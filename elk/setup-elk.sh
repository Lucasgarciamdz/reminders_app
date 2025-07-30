#!/bin/bash

# ELK Stack Setup Script for Reminders Application
# This script sets up the complete ELK stack for log management

set -e

echo "🚀 Setting up ELK Stack for Reminders Application..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p elk/logstash/{config,pipeline}
mkdir -p elk/filebeat
mkdir -p elk/kibana/dashboards

# Set proper permissions for Filebeat
echo "🔐 Setting permissions..."
sudo chown -R root:root elk/filebeat/ 2>/dev/null || echo "⚠️  Could not set root ownership for filebeat (this might be okay)"

# Start ELK stack
echo "🐳 Starting ELK Stack..."
cd elk
docker compose -f docker-compose.elk.yml -p "reminders" up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🏥 Checking service health..."
for service in elasticsearch kibana logstash; do
    if docker compose -f /home/lucasg/facultad/final_ing_aplicada/elk/docker-compose.elk.yml ps | grep -q "$service.*Up"; then
        echo "✅ $service is running"
    else
        echo "❌ $service failed to start"
        docker compose -f /home/lucasg/facultad/final_ing_aplicada/elk/docker-compose.elk.yml logs $service
    fi
done

# Create Kibana index patterns
echo "📊 Setting up Kibana index patterns..."
sleep 10

# Wait for Kibana to be ready
until curl -s http://localhost:5601/api/status | grep -q '"level":"available"'; do
    echo "⏳ Waiting for Kibana to be ready..."
    sleep 5
done

# Import dashboards (if available)
if [ -f "kibana/dashboards/reminders-app-dashboard.json" ]; then
    echo "📈 Importing Kibana dashboards..."
    curl -X POST "localhost:5601/api/saved_objects/_import" \
         -H "kbn-xsrf: true" \
         -H "Content-Type: application/json" \
         --form file=@kibana/dashboards/reminders-app-dashboard.json || echo "⚠️  Dashboard import failed (this is okay for first run)"
fi

echo ""
echo "🎉 ELK Stack setup complete!"
echo ""
echo "📍 Access URLs:"
echo "   Elasticsearch: http://localhost:9200"
echo "   Kibana:        http://localhost:5601"
echo "   Logstash API:  http://localhost:9600"
echo ""
echo "📝 Log Inputs:"
echo "   Beats:         localhost:5044"
echo "   TCP JSON:      localhost:5000"
echo "   UDP Syslog:    localhost:5001"
echo "   App TCP:       localhost:5002"
echo "   HTTP:          localhost:8080"
echo "   App HTTP:      localhost:8081"
echo ""
echo "🔧 To integrate with your application:"
echo "   1. Update your application logging to send logs to localhost:5002 (TCP JSON)"
echo "   2. Or use the HTTP endpoint at localhost:8081"
echo "   3. Docker container logs are automatically collected"
echo ""
echo "📊 Next steps:"
echo "   1. Open Kibana at http://localhost:5601"
echo "   2. Go to Stack Management > Index Patterns"
echo "   3. Create index patterns for: application-logs-*, backend-logs-*, frontend-logs-*"
echo "   4. Go to Discover to start exploring your logs"
echo ""