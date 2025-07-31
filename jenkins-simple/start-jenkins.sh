#!/bin/bash

echo "🚀 Starting Jenkins (Simple Setup)"
echo "=================================="

# Start Jenkins
docker-compose -p "reminders" up -d

echo ""
echo "✅ Jenkins is starting up..."
echo ""
echo "📋 Next steps:"
echo "1. Wait 1-2 minutes for Jenkins to start"
echo "2. Open http://localhost:8080"
echo "3. Get the initial admin password:"
echo "   docker exec jenkins-simple cat /var/jenkins_home/secrets/initialAdminPassword"
echo ""
echo "4. Install suggested plugins + these additional ones:"
echo "   - Docker Pipeline"
echo "   - NodeJS Plugin"
echo "   - Maven Integration"
echo ""
echo "5. Configure tools in Jenkins:"
echo "   - Go to Manage Jenkins > Tools"
echo "   - Add Maven 3 (name: Maven3)"
echo "   - Add JDK 18 (name: JDK-18)"
echo "   - Add NodeJS 18 (name: NodeJS18)"
echo ""
echo "6. Add Docker Hub credentials:"
echo "   - Go to Manage Jenkins > Credentials"
echo "   - Add Username/Password (ID: docker-hub-credentials)"
echo ""
echo "🔍 To check logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"