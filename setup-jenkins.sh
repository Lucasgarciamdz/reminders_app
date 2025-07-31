#!/bin/bash

echo "🚀 Setting up Jenkins for Reminders App Demo"
echo "============================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Stop any existing Jenkins container
echo "🛑 Stopping existing Jenkins containers..."
docker-compose down jenkins 2>/dev/null || true

# Create Jenkins data directory with proper permissions
echo "📁 Setting up Jenkins data directory..."
sudo mkdir -p jenkins_data
sudo chown -R 1000:1000 jenkins_data 2>/dev/null || true

# Start Jenkins with CI profile
echo "🏗️  Starting Jenkins..."
docker-compose --profile ci up -d jenkins

# Wait for Jenkins to start
echo "⏳ Waiting for Jenkins to start..."
sleep 30

# Check if Jenkins is running
if docker-compose ps jenkins | grep -q "Up"; then
    echo "✅ Jenkins is running!"
    echo ""
    echo "🌐 Access Jenkins at: http://localhost:8081"
    echo ""
    echo "🔑 To get the initial admin password, run:"
    echo "   docker-compose exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword"
    echo ""
    echo "📋 Recommended Jenkins plugins for this demo:"
    echo "   - Git plugin"
    echo "   - Pipeline plugin"
    echo "   - Docker plugin"
    echo "   - Maven Integration plugin"
    echo "   - NodeJS plugin"
    echo ""
    echo "🔧 After setup, configure these tools in Jenkins:"
    echo "   - JDK 17 (auto-install)"
    echo "   - Maven 3.9.x (auto-install)"
    echo "   - NodeJS 18.x (auto-install)"
    echo ""
    echo "📝 Create a new Pipeline job and point it to your Git repository"
    echo "   Repository URL: https://github.com/Lucasgarciamdz/reminders_app"
    echo "   Script Path: Jenkinsfile"
else
    echo "❌ Jenkins failed to start. Check logs with:"
    echo "   docker-compose logs jenkins"
    exit 1
fi