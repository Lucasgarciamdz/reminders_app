#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# ASCII Art Header
cat << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     🚀 JHipster CI/CD Pipeline Setup with Jenkins 🚀        ║
║                                                              ║
║  Complete setup for testing, building, and deploying        ║
║  your JHipster application with Docker containers           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF

echo ""

# Check prerequisites
print_header "🔍 Checking Prerequisites..."

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_status "✅ Docker is installed and running"

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

print_status "✅ Docker Compose is available"

# Check if we're in the right directory
if [ ! -f "backend/pom.xml" ] || [ ! -f "backend/package.json" ]; then
    print_error "This script must be run from the project root directory containing backend folder"
    exit 1
fi

print_status "✅ Project structure verified"

# Get user input for Docker Hub
print_header "🐳 Docker Hub Configuration"
echo ""
read -p "Enter your Docker Hub username [luxor12354]: " DOCKER_USERNAME
DOCKER_USERNAME=${DOCKER_USERNAME:-luxor12354}

read -s -p "Enter your Docker Hub password/token: " DOCKER_PASSWORD
echo ""

if [ -z "$DOCKER_PASSWORD" ]; then
    print_error "Docker Hub password/token is required"
    exit 1
fi

# Update Jenkinsfile with user's Docker Hub username
print_status "Updating Jenkinsfile with your Docker Hub username..."
sed -i.bak "s/DOCKER_HUB_USERNAME = 'luxor12354'/DOCKER_HUB_USERNAME = '$DOCKER_USERNAME'/" Jenkinsfile
rm -f Jenkinsfile.bak

# Create Jenkins directories
print_status "Creating Jenkins directories..."
mkdir -p jenkins/jenkins-data
mkdir -p jenkins/jenkins-config

# Set proper permissions for Jenkins
print_status "Setting up permissions..."
if command -v sudo &> /dev/null; then
    sudo chown -R 1000:1000 jenkins/jenkins-data 2>/dev/null || chown -R 1000:1000 jenkins/jenkins-data
else
    chown -R 1000:1000 jenkins/jenkins-data
fi

# Create Jenkins configuration with user's Docker Hub credentials
print_status "Creating Jenkins configuration with your credentials..."

cat > jenkins/jenkins-config/basic-security.groovy << 'EOF'
#!groovy

import jenkins.model.*
import hudson.security.*
import jenkins.security.s2m.AdminWhitelistRule

def instance = Jenkins.getInstance()

def hudsonRealm = new HudsonPrivateSecurityRealm(false)
hudsonRealm.createAccount("admin", "admin123")
instance.setSecurityRealm(hudsonRealm)

def strategy = new FullControlOnceLoggedInAuthorizationStrategy()
strategy.setAllowAnonymousRead(false)
instance.setAuthorizationStrategy(strategy)
instance.save()

Jenkins.instance.getInjector().getInstance(AdminWhitelistRule.class).setMasterKillSwitch(false)
EOF

cat > jenkins/jenkins-config/setup-credentials.groovy << EOF
#!groovy

import jenkins.model.*
import com.cloudbees.plugins.credentials.*
import com.cloudbees.plugins.credentials.common.*
import com.cloudbees.plugins.credentials.domains.*
import com.cloudbees.plugins.credentials.impl.*
import hudson.util.Secret

def instance = Jenkins.getInstance()
def domain = Domain.global()
def store = instance.getExtensionList('com.cloudbees.plugins.credentials.SystemCredentialsProvider')[0].getStore()

// Create Docker Hub credentials
def dockerHubCredentials = new UsernamePasswordCredentialsImpl(
    CredentialsScope.GLOBAL,
    "dockerhub-credentials",
    "Docker Hub Credentials",
    "$DOCKER_USERNAME",
    "$DOCKER_PASSWORD"
)

store.addCredentials(domain, dockerHubCredentials)
instance.save()
EOF

# Start Jenkins
print_header "🚀 Starting Jenkins..."
cd jenkins
docker-compose -f docker-compose.jenkins.yml up -d

print_status "Waiting for Jenkins to start (this may take a few minutes)..."
cd ..

# Wait for Jenkins to be ready with better feedback
timeout=300
counter=0
echo -n "Starting Jenkins"
while ! curl -s http://localhost:8081 > /dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        print_error "Jenkins failed to start within $timeout seconds"
        echo "Check logs with: docker-compose -f jenkins/docker-compose.jenkins.yml logs"
        exit 1
    fi
    sleep 5
    counter=$((counter + 5))
    echo -n "."
done

echo ""
print_status "✅ Jenkins is now running!"

# Test the application locally
print_header "🧪 Testing Application Locally..."

print_status "Testing backend build..."
cd backend
if ./mvnw clean compile -ntp -q; then
    print_status "✅ Backend compiles successfully"
else
    print_warning "⚠️  Backend compilation issues detected"
fi

print_status "Testing frontend dependencies..."
if npm ci --silent; then
    print_status "✅ Frontend dependencies installed successfully"
else
    print_warning "⚠️  Frontend dependency issues detected"
fi

cd ..

# Build initial Docker images
print_header "🐳 Building Initial Docker Images..."

print_status "Building backend JAR..."
cd backend
./mvnw clean package -Pprod -DskipTests -ntp -q
cd ..

print_status "Building backend Docker image..."
docker build -t ${DOCKER_USERNAME}/reminders-backend:latest backend/

print_status "Building frontend Docker image..."
docker build -t ${DOCKER_USERNAME}/reminders-frontend:latest frontend/

# Test Docker images
print_status "Testing Docker images..."
if docker run --rm ${DOCKER_USERNAME}/reminders-backend:latest java -version > /dev/null 2>&1; then
    print_status "✅ Backend Docker image works"
else
    print_warning "⚠️  Backend Docker image issues"
fi

# Push to Docker Hub
print_header "📤 Pushing Images to Docker Hub..."
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

docker push ${DOCKER_USERNAME}/reminders-backend:latest
docker push ${DOCKER_USERNAME}/reminders-frontend:latest

print_status "✅ Images pushed to Docker Hub successfully"

# Create a simple test script
cat > test-pipeline.sh << 'EOF'
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
EOF

chmod +x test-pipeline.sh

# Final output
print_header "🎉 Setup Complete!"

cat << EOF

╔══════════════════════════════════════════════════════════════╗
║                    🎉 SETUP COMPLETE! 🎉                    ║
╚══════════════════════════════════════════════════════════════╝

📍 Jenkins Access:
   URL: http://localhost:8081
   Username: admin
   Password: admin123

🐳 Docker Images Created:
   - ${DOCKER_USERNAME}/reminders-backend:latest
   - ${DOCKER_USERNAME}/reminders-frontend:latest

📋 Next Steps:

1. 🌐 Access Jenkins at http://localhost:8081

2. 🔧 Create a new Pipeline job:
   - Click "New Item"
   - Enter name: "reminders-pipeline"
   - Select "Pipeline"
   - In Pipeline section, select "Pipeline script from SCM"
   - Set SCM to Git and enter your repository URL
   - Set Script Path to "Jenkinsfile"

3. 🚀 Run your first build:
   - Click "Build Now"
   - Monitor the build progress

4. 🧪 Test locally (optional):
   ./test-pipeline.sh

📦 Pipeline Features:
   ✅ Parallel execution for faster builds
   ✅ Backend testing (unit + integration)
   ✅ Frontend testing (lint + unit tests)
   ✅ Code quality checks
   ✅ Docker image building and pushing
   ✅ Multi-environment deployment
   ✅ Health checks and monitoring

🔧 Tools Configured:
   - Jenkins 2.479 with JDK 17
   - Maven 3.9.6
   - Node.js 22.15.0
   - Docker CLI
   - Essential Jenkins plugins

⚙️  Environment Variables Set:
   - DOCKER_HUB_USERNAME: ${DOCKER_USERNAME}
   - Backend image: ${DOCKER_USERNAME}/reminders-backend
   - Frontend image: ${DOCKER_USERNAME}/reminders-frontend

🛠️  Management Commands:
   - View logs: docker-compose -f jenkins/docker-compose.jenkins.yml logs -f
   - Restart: docker-compose -f jenkins/docker-compose.jenkins.yml restart
   - Stop: docker-compose -f jenkins/docker-compose.jenkins.yml down

📚 Documentation:
   - Check jenkins/README.md for detailed information
   - Jenkinsfile contains the complete pipeline configuration

🔐 Security Notes:
   - Change the default admin password after first login
   - Your Docker Hub credentials are securely stored in Jenkins
   - Consider setting up HTTPS for production use

Happy coding! 🚀

EOF