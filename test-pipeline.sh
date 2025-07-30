#!/bin/bash

echo "🧪 Testing the complete pipeline locally..."

# Start services
echo "Starting database and ELK stack..."
docker-compose up -d postgres elasticsearch kibana logstash

# Wait for services
echo "Waiting for services to be ready..."
sleep 30

# Run backend tests
echo "Running backend tests..."
cd backend
./mvnw test -ntp

# Run frontend tests  
echo "Running frontend tests..."
npm test -- --watch=false --browsers=ChromeHeadless

# Build applications
echo "Building applications..."
./mvnw clean package -Pprod -DskipTests -ntp

cd ..

# Build Docker images
echo "Building Docker images..."
docker build -t test-backend backend/
docker build -t test-frontend frontend/

echo "✅ Pipeline test completed successfully!"

# Cleanup
docker-compose down
