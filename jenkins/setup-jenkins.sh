#!/bin/bash

set -e

echo "🚀 Setting up Jenkins for JHipster Application"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

# Create necessary directories
print_status "Creating Jenkins directories..."
mkdir -p jenkins/jenkins-data
mkdir -p jenkins/jenkins-config

# Set proper permissions
print_status "Setting permissions..."
sudo chown -R 1000:1000 jenkins/jenkins-data

# Create Jenkins configuration files
print_status "Creating Jenkins configuration..."

# Create initial admin user configuration
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

# Create Docker Hub credentials setup script
cat > jenkins/jenkins-config/setup-credentials.groovy << 'EOF'
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

// Create Docker Hub credentials (you'll need to update these)
def dockerHubCredentials = new UsernamePasswordCredentialsImpl(
    CredentialsScope.GLOBAL,
    "dockerhub-credentials",
    "Docker Hub Credentials",
    "luxor12354", // Replace with your Docker Hub username
    "your-docker-hub-password" // Replace with your Docker Hub password or token
)

store.addCredentials(domain, dockerHubCredentials)
instance.save()
EOF

# Start Jenkins
print_status "Starting Jenkins..."
cd jenkins
docker-compose -f docker-compose.jenkins.yml up -d

print_status "Waiting for Jenkins to start..."
sleep 30

# Wait for Jenkins to be ready
print_status "Checking Jenkins status..."
timeout=300
counter=0
while ! curl -s http://localhost:8081 > /dev/null; do
    if [ $counter -ge $timeout ]; then
        print_error "Jenkins failed to start within $timeout seconds"
        exit 1
    fi
    sleep 5
    counter=$((counter + 5))
    echo -n "."
done

echo ""
print_status "Jenkins is now running!"

# Display access information
echo ""
echo "=================================================="
echo "🎉 Jenkins Setup Complete!"
echo "=================================================="
echo ""
echo "📍 Jenkins URL: http://localhost:8081"
echo "👤 Username: admin"
echo "🔑 Password: admin123"
echo ""
echo "📋 Next Steps:"
echo "1. Access Jenkins at http://localhost:8081"
echo "2. Log in with the credentials above"
echo "3. Update Docker Hub credentials in Jenkins:"
echo "   - Go to 'Manage Jenkins' > 'Manage Credentials'"
echo "   - Update the 'dockerhub-credentials' with your actual Docker Hub credentials"
echo "4. Create a new Pipeline job and point it to your repository"
echo "5. The Jenkinsfile is already configured in your project root"
echo ""
echo "🔧 Tools configured:"
echo "   - Maven 3.9.6"
echo "   - Node.js 22.15.0"
echo "   - OpenJDK 17"
echo "   - Docker CLI"
echo ""
echo "📦 Pipeline stages:"
echo "   - Checkout code"
echo "   - Install dependencies"
echo "   - Run tests (backend & frontend)"
echo "   - Build applications"
echo "   - Build & push Docker images"
echo "   - Integration tests"
echo "   - Deploy (staging/production)"
echo ""
echo "⚠️  Important:"
echo "   - Update your Docker Hub credentials in Jenkins"
echo "   - Modify the DOCKER_HUB_USERNAME in Jenkinsfile if needed"
echo "   - Configure webhooks in your Git repository for automatic builds"
echo ""
echo "🛑 To stop Jenkins: docker-compose -f jenkins/docker-compose.jenkins.yml down"
echo "=================================================="