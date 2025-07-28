#!/bin/bash

# Jenkins Setup Script for JHipster Reminders App
# This script automates the Jenkins setup process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Docker
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if user is in docker group
    if ! groups $USER | grep -q docker; then
        print_warning "User $USER is not in docker group. You may need to run: sudo usermod -aG docker $USER"
        print_warning "After adding to docker group, please logout and login again."
    fi
    
    # Check available disk space (minimum 10GB)
    available_space=$(df / | awk 'NR==2 {print $4}')
    if [ $available_space -lt 10485760 ]; then  # 10GB in KB
        print_warning "Less than 10GB disk space available. Jenkins may need more space."
    fi
    
    # Check available memory (minimum 4GB)
    available_memory=$(free -m | awk 'NR==2{print $7}')
    if [ $available_memory -lt 4096 ]; then
        print_warning "Less than 4GB memory available. Consider increasing system memory."
    fi
    
    print_success "System requirements check completed."
}

# Function to create Jenkins directory structure
create_jenkins_directories() {
    print_status "Creating Jenkins directory structure..."
    
    JENKINS_HOME="$HOME/jenkins_home"
    
    # Create directories
    mkdir -p "$JENKINS_HOME"
    mkdir -p "$JENKINS_HOME/plugins"
    mkdir -p "$JENKINS_HOME/jobs"
    
    # Set proper permissions
    sudo chown -R 1000:1000 "$JENKINS_HOME" 2>/dev/null || chown -R 1000:1000 "$JENKINS_HOME"
    
    print_success "Jenkins directories created at $JENKINS_HOME"
}

# Function to create Docker Compose file for Jenkins
create_docker_compose() {
    print_status "Creating Docker Compose configuration..."
    
    cat > docker-compose.jenkins.yml << 'EOF'
version: '3.8'

services:
  jenkins:
    image: jenkins/jenkins:lts
    container_name: jenkins-ci
    user: root
    ports:
      - "8080:8080"
      - "50000:50000"
    volumes:
      - ~/jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
      - /usr/bin/docker:/usr/bin/docker:ro
    environment:
      - JAVA_OPTS=-Djenkins.install.runSetupWizard=false -Xmx2048m
      - JENKINS_OPTS=--httpPort=8080
    restart: unless-stopped
    networks:
      - jenkins-network

  # Optional: Add a Jenkins agent for distributed builds
  jenkins-agent:
    image: jenkins/inbound-agent:latest
    container_name: jenkins-agent
    environment:
      - JENKINS_URL=http://jenkins:8080
      - JENKINS_SECRET=${JENKINS_AGENT_SECRET:-}
      - JENKINS_AGENT_NAME=docker-agent
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /usr/bin/docker:/usr/bin/docker:ro
    depends_on:
      - jenkins
    networks:
      - jenkins-network
    profiles:
      - agent

networks:
  jenkins-network:
    driver: bridge

volumes:
  jenkins_home:
    driver: local
EOF
    
    print_success "Docker Compose file created: docker-compose.jenkins.yml"
}

# Function to create Jenkins configuration
create_jenkins_config() {
    print_status "Creating Jenkins initial configuration..."
    
    JENKINS_HOME="$HOME/jenkins_home"
    
    # Create basic Jenkins configuration
    mkdir -p "$JENKINS_HOME/init.groovy.d"
    
    cat > "$JENKINS_HOME/init.groovy.d/basic-security.groovy" << 'EOF'
#!groovy

import jenkins.model.*
import hudson.security.*
import jenkins.security.s2m.AdminWhitelistRule

def instance = Jenkins.getInstance()

// Create admin user
def hudsonRealm = new HudsonPrivateSecurityRealm(false)
hudsonRealm.createAccount("admin", "admin123")
instance.setSecurityRealm(hudsonRealm)

// Set authorization strategy
def strategy = new FullControlOnceLoggedInAuthorizationStrategy()
strategy.setAllowAnonymousRead(false)
instance.setAuthorizationStrategy(strategy)

// Disable CLI over remoting
instance.getDescriptor("jenkins.CLI").get().setEnabled(false)

// Enable Agent to master security subsystem
instance.getInjector().getInstance(AdminWhitelistRule.class).setMasterKillSwitch(false)

// Save configuration
instance.save()

println "Basic security configuration applied"
EOF

    # Create plugin list
    cat > "$JENKINS_HOME/plugins.txt" << 'EOF'
ant:latest
build-timeout:latest
credentials-binding:latest
email-ext:latest
git:latest
github-branch-source:latest
gradle:latest
ldap:latest
mailer:latest
matrix-auth:latest
pam-auth:latest
pipeline-github-lib:latest
pipeline-stage-view:latest
ssh-slaves:latest
timestamper:latest
workflow-aggregator:latest
ws-cleanup:latest
docker-workflow:latest
nodejs:latest
maven-plugin:latest
junit:latest
html-publisher:latest
slack:latest
EOF
    
    print_success "Jenkins configuration files created"
}

# Function to start Jenkins
start_jenkins() {
    print_status "Starting Jenkins..."
    
    # Check if Jenkins is already running
    if docker ps | grep -q jenkins-ci; then
        print_warning "Jenkins container is already running"
        return
    fi
    
    # Start Jenkins using Docker Compose
    if command_exists docker-compose; then
        docker-compose -f docker-compose.jenkins.yml up -d
    else
        docker compose -f docker-compose.jenkins.yml up -d
    fi
    
    print_status "Waiting for Jenkins to start..."
    
    # Wait for Jenkins to be ready
    timeout=300  # 5 minutes
    counter=0
    
    while [ $counter -lt $timeout ]; do
        if curl -s http://localhost:8080/login >/dev/null 2>&1; then
            break
        fi
        sleep 5
        counter=$((counter + 5))
        echo -n "."
    done
    
    echo ""
    
    if [ $counter -ge $timeout ]; then
        print_error "Jenkins failed to start within 5 minutes"
        exit 1
    fi
    
    print_success "Jenkins started successfully!"
}

# Function to display access information
display_access_info() {
    print_success "Jenkins Setup Complete!"
    echo ""
    echo "🌐 Access Jenkins at: http://localhost:8080"
    echo "👤 Default credentials:"
    echo "   Username: admin"
    echo "   Password: admin123"
    echo ""
    echo "📁 Jenkins home directory: $HOME/jenkins_home"
    echo ""
    echo "🔧 Next steps:"
    echo "1. Access Jenkins web interface"
    echo "2. Install recommended plugins"
    echo "3. Configure tools (JDK, Maven, NodeJS)"
    echo "4. Add DockerHub credentials"
    echo "5. Create your pipeline job"
    echo ""
    echo "📖 For detailed setup instructions, see: JENKINS_COMPLETE_SETUP_GUIDE.md"
    echo ""
    
    # Show initial admin password if available
    if [ -f "$HOME/jenkins_home/secrets/initialAdminPassword" ]; then
        INITIAL_PASSWORD=$(cat "$HOME/jenkins_home/secrets/initialAdminPassword")
        print_warning "Alternative admin password: $INITIAL_PASSWORD"
    fi
}

# Function to create helper scripts
create_helper_scripts() {
    print_status "Creating helper scripts..."
    
    # Jenkins management script
    cat > jenkins-manage.sh << 'EOF'
#!/bin/bash

case "$1" in
    start)
        echo "Starting Jenkins..."
        docker-compose -f docker-compose.jenkins.yml up -d
        ;;
    stop)
        echo "Stopping Jenkins..."
        docker-compose -f docker-compose.jenkins.yml down
        ;;
    restart)
        echo "Restarting Jenkins..."
        docker-compose -f docker-compose.jenkins.yml restart
        ;;
    logs)
        echo "Showing Jenkins logs..."
        docker logs -f jenkins-ci
        ;;
    backup)
        echo "Creating Jenkins backup..."
        tar -czf "jenkins-backup-$(date +%Y%m%d-%H%M%S).tar.gz" ~/jenkins_home
        echo "Backup created: jenkins-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        ;;
    status)
        echo "Jenkins status:"
        docker ps | grep jenkins-ci || echo "Jenkins is not running"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|backup|status}"
        exit 1
        ;;
esac
EOF
    
    chmod +x jenkins-manage.sh
    
    # Troubleshooting script
    cat > jenkins-troubleshoot.sh << 'EOF'
#!/bin/bash

echo "=== Jenkins Troubleshooting Information ==="
echo ""

echo "1. System Information:"
echo "   OS: $(uname -a)"
echo "   Docker version: $(docker --version)"
echo "   Docker Compose version: $(docker-compose --version 2>/dev/null || docker compose version)"
echo "   Available memory: $(free -h | grep Mem | awk '{print $7}')"
echo "   Available disk: $(df -h / | awk 'NR==2 {print $4}')"
echo ""

echo "2. Docker Status:"
docker ps -a | grep jenkins || echo "   No Jenkins containers found"
echo ""

echo "3. Jenkins Logs (last 50 lines):"
docker logs --tail 50 jenkins-ci 2>/dev/null || echo "   Jenkins container not running"
echo ""

echo "4. Port Status:"
netstat -tlnp | grep :8080 || echo "   Port 8080 not in use"
echo ""

echo "5. Jenkins Home Directory:"
ls -la ~/jenkins_home/ 2>/dev/null || echo "   Jenkins home directory not found"
echo ""

echo "6. Docker Socket Permissions:"
ls -la /var/run/docker.sock
echo ""

echo "=== Common Solutions ==="
echo "1. If Jenkins won't start:"
echo "   - Check if port 8080 is available: sudo lsof -i :8080"
echo "   - Restart Docker: sudo systemctl restart docker"
echo "   - Check disk space: df -h"
echo ""
echo "2. If Docker permission denied:"
echo "   - Add user to docker group: sudo usermod -aG docker \$USER"
echo "   - Logout and login again"
echo ""
echo "3. If Jenkins is slow:"
echo "   - Increase memory: Edit docker-compose.jenkins.yml JAVA_OPTS"
echo "   - Clean up: docker system prune -f"
EOF
    
    chmod +x jenkins-troubleshoot.sh
    
    print_success "Helper scripts created: jenkins-manage.sh, jenkins-troubleshoot.sh"
}

# Main execution
main() {
    echo "🚀 Jenkins Setup Script for JHipster Reminders App"
    echo "=================================================="
    echo ""
    
    create_jenkins_directories
    
    create_jenkins_config
    create_helper_scripts
    start_jenkins
    display_access_info
    
    echo ""
    print_success "Jenkins setup completed successfully! 🎉"
}

# Run main function
main "$@"