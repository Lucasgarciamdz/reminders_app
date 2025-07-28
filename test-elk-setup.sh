#!/bin/bash

echo "🧪 Testing ELK Stack Setup..."

# Test Elasticsearch
echo "Testing Elasticsearch..."
if curl -s http://localhost:9200/_cluster/health | grep -q "green\|yellow"; then
    echo "✅ Elasticsearch is healthy"
else
    echo "❌ Elasticsearch is not healthy"
    exit 1
fi

# Test Logstash
echo "Testing Logstash..."
if curl -s http://localhost:9600 > /dev/null; then
    echo "✅ Logstash is responding"
else
    echo "❌ Logstash is not responding"
    exit 1
fi

# Test Kibana
echo "Testing Kibana..."
if curl -s http://localhost:5601/api/status | grep -q "available"; then
    echo "✅ Kibana is available"
else
    echo "⚠️  Kibana might still be starting up"
fi

# Send a test log to Logstash
echo "Sending test log to Logstash..."
echo '{"@timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'","level":"info","logger_name":"test.logger","message":"ELK test message","application":"reminders","environment":"development"}' | nc localhost 5000

if [ $? -eq 0 ]; then
    echo "✅ Test log sent successfully"
    echo "💡 Check Kibana in a few seconds to see the test log"
else
    echo "❌ Failed to send test log"
fi

echo ""
echo "🎯 Setup verification complete!"
echo "📊 Open Kibana: http://localhost:5601"