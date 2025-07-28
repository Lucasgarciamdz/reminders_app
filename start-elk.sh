#!/bin/bash

echo "🚀 Starting JHipster ELK Stack..."

# Navigate to the docker directory
cd backend/src/main/docker

# Start the ELK stack
echo "📊 Starting Elasticsearch, Logstash, and Kibana..."
docker-compose -f elasticsearch.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check Elasticsearch
if curl -s http://localhost:9200/_cluster/health > /dev/null; then
    echo "✅ Elasticsearch is running at http://localhost:9200"
else
    echo "❌ Elasticsearch is not responding"
fi

# Check Logstash
if curl -s http://localhost:9600 > /dev/null; then
    echo "✅ Logstash is running at http://localhost:9600"
else
    echo "❌ Logstash is not responding"
fi

# Check Kibana
if curl -s http://localhost:5601/api/status > /dev/null; then
    echo "✅ Kibana is running at http://localhost:5601"
else
    echo "⏳ Kibana is still starting up (this can take a minute)..."
fi

echo ""
echo "🎉 ELK Stack is starting up!"
echo ""
echo "📋 Next steps:"
echo "1. Start your JHipster app: cd backend && ./mvnw spring-boot:run"
echo "2. Open Kibana: http://localhost:5601"
echo "3. Create index pattern: reminders-logs-*"
echo "4. View logs in Discover section"
echo ""
echo "📖 For detailed instructions, see: ELK_JHIPSTER_SETUP_GUIDE.md"