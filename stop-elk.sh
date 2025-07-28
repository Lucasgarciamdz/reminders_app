#!/bin/bash

echo "🛑 Stopping JHipster ELK Stack..."

# Navigate to the docker directory
cd backend/src/main/docker

# Stop the ELK stack
docker-compose -f elasticsearch.yml down

echo "✅ ELK Stack stopped successfully!"