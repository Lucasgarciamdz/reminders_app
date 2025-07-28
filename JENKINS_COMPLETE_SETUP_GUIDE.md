# Jenkins Complete Setup Guide for JHipster Reminders App

This guide provides comprehensive instructions for setting up Jenkins CI/CD pipeline for your JHipster application with Elasticsearch integration, including backend tests, Cypress e2e tests, and Docker image building/pushing.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Jenkins Installation](#jenkins-installation)
3. [Required Plugins](#required-plugins)
4. [Tool Configuration](#tool-configuration)
5. [DockerHub Setup](#dockerhub-setup)
6. [Pipeline Configuration](#pipeline-configuration)
7. [Running the Pipeline](#running-the-pipeline)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

## 🔧 Prerequisites

### System Requirements
- **OS**: Linux/macOS/Windows with Docker support
- **RAM**: Minimum 8GB (16GB recommended)
- **Disk**: At least 20GB free space
- **Java**: OpenJDK 17 or higher
- **Docker**: Docker Engine 20.10+ with Docker Compose
- **Git**: Version 2.20+

### Required Software
```bash
# Install Java 17
sudo apt update
sudo apt install openjdk-17-jdk

# Install Maven
sudo apt install maven

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## 🚀 Jenkins Installation

### Option 1: Docker Installation (Recommended)

1. **Create Jenkins directory structure:**
```bash
mkdir -p ~/jenkins_home
sudo chown 1000:1000 ~/jenkins_home
```

2. **Create docker-compose.yml for Jenkins:**
```yaml
version: '3.8'
services:
  jenkins:
    image: jenkins/jenkins:lts
    container_name: jenkins
    user: root
    ports:
      - "8080:8080"
      - "50000:50000"
    volumes:
      - ~/jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
      - /usr/bin/docker:/usr/bin/docker
    environment:
      - JAVA_OPTS=-Djenkins.install.runSetupWizard=false
    restart: unless-stopped
```

3. **Start Jenkins:**
```bash
docker-compose up -d
```

4. **Get initial admin password:**
```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

### Option 2: Native Installation

1. **Install Jenkins:**
```bash
# Add Jenkins repository
wget -q -O - https://pkg.jenkins.io/debian/jenkins.io.key | sudo apt-key add -
sudo sh -c 'echo deb http://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'

# Install Jenkins
sudo apt update
sudo apt install jenkins

# Start Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins
```

2. **Configure Jenkins user for Docker:**
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

## 🔌 Required Plugins

Access Jenkins at `http://localhost:8080` and install these plugins:

### Essential Plugins
1. **Pipeline Plugins:**
   - Pipeline
   - Pipeline: Stage View
   - Pipeline: Groovy
   - Pipeline: Declarative

2. **SCM Plugins:**
   - Git
   - GitHub
   - GitHub Branch Source

3. **Build Tools:**
   - Maven Integration
   - NodeJS
   - Docker Pipeline

4. **Testing & Reporting:**
   - JUnit
   - HTML Publisher
   - Test Results Analyzer
   - Cypress Test Results

5. **Notifications:**
   - Slack Notification (optional)
   - Email Extension

### Installation Steps
1. Go to **Manage Jenkins** → **Manage Plugins**
2. Click **Available** tab
3. Search and select each plugin
4. Click **Install without restart**
5. Restart Jenkins when installation completes

## ⚙️ Tool Configuration

### Configure Global Tools

1. **Go to Manage Jenkins → Global Tool Configuration**

2. **Configure JDK:**
   - Name: `JDK17`
   - JAVA_HOME: `/usr/lib/jvm/java-17-openjdk-amd64` (adjust path)
   - Or use automatic installer

3. **Configure Maven:**
   - Name: `Maven3`
   - MAVEN_HOME: `/usr/share/maven` (or auto-install)

4. **Configure NodeJS:**
   - Name: `NodeJS18`
   - Version: `18.x.x`
   - Global npm packages: `cypress`

5. **Configure Docker:**
   - Usually auto-detected if Docker is properly installed

## 🐳 DockerHub Setup

### 1. Create DockerHub Account
- Sign up at [hub.docker.com](https://hub.docker.com)
- Create repositories:
  - `your-username/reminders-backend`
  - `your-username/reminders-frontend`

### 2. Configure Jenkins Credentials

1. **Go to Manage Jenkins → Manage Credentials**
2. **Click (global) → Add Credentials**
3. **Configure DockerHub credentials:**
   - Kind: `Username with password`
   - ID: `dockerhub-credentials`
   - Username: Your DockerHub username
   - Password: Your DockerHub password or access token
   - Description: `DockerHub Credentials`

### 3. Update Jenkinsfile
Edit the `Jenkinsfile` and replace:
```groovy
BACKEND_IMAGE = "your-dockerhub-username/reminders-backend"
FRONTEND_IMAGE = "your-dockerhub-username/reminders-frontend"
```

With your actual DockerHub username:
```groovy
BACKEND_IMAGE = "johndoe/reminders-backend"
FRONTEND_IMAGE = "johndoe/reminders-frontend"
```

## 📝 Pipeline Configuration

### 1. Create New Pipeline Job

1. **Go to Jenkins Dashboard → New Item**
2. **Enter name:** `reminders-ci-cd`
3. **Select:** Pipeline
4. **Click OK**

### 2. Configure Pipeline

1. **In Pipeline section, select:** `Pipeline script from SCM`
2. **SCM:** Git
3. **Repository URL:** Your Git repository URL
4. **Credentials:** Add your Git credentials if private repo
5. **Branch:** `*/main` (or your default branch)
6. **Script Path:** `Jenkinsfile`

### 3. Configure Build Triggers (Optional)

- **GitHub hook trigger:** For automatic builds on push
- **Poll SCM:** `H/5 * * * *` (check every 5 minutes)
- **Build periodically:** `H 2 * * *` (nightly builds)

## 🏃‍♂️ Running the Pipeline

### 1. Manual Build
1. Go to your pipeline job
2. Click **Build Now**
3. Monitor progress in **Build History**

### 2. Automatic Builds
- Push code to your repository
- Jenkins will automatically trigger the build (if webhook configured)

### 3. Pipeline Stages Overview

The pipeline includes these stages:

1. **Checkout** - Downloads source code
2. **Install Dependencies** - Installs Maven and npm dependencies (parallel)
3. **Run Tests** - Executes backend and frontend unit tests (parallel)
4. **E2E Tests** - Runs Cypress end-to-end tests
5. **Build and Push Docker Images** - Creates and pushes Docker images (parallel)
6. **Security Scan** - Runs security scans (parallel)

### 4. Expected Build Time
- **First build:** 15-25 minutes (downloading dependencies)
- **Subsequent builds:** 8-15 minutes
- **With cache:** 5-10 minutes

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. Docker Permission Denied
```bash
# Add jenkins user to docker group
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins

# For Docker-in-Docker setup
docker exec -u root jenkins usermod -aG docker jenkins
docker restart jenkins
```

#### 2. Elasticsearch Connection Issues
- **Issue:** Backend tests fail with Elasticsearch connection errors
- **Solution:** Testcontainers handles this automatically. Ensure Docker is running and has sufficient resources.

```bash
# Increase Docker resources
docker system prune -f
docker volume prune -f
```

#### 3. Cypress Installation Issues
```bash
# Clear Cypress cache
rm -rf ~/.cache/Cypress
npm install cypress --save-dev
npx cypress install
```

#### 4. Maven Build Failures
```bash
# Clear Maven cache
rm -rf ~/.m2/repository
mvn dependency:purge-local-repository
```

#### 5. Node.js Version Issues
- Ensure NodeJS plugin is configured for version 18
- Check `frontend/package.json` engines requirement

#### 6. Memory Issues
Add to Jenkins JVM options:
```bash
JAVA_OPTS="-Xmx2048m -XX:MaxPermSize=512m"
```

### Debug Commands

```bash
# Check Jenkins logs
docker logs jenkins

# Check system resources
docker stats
df -h
free -h

# Test Docker connectivity
docker run hello-world

# Test Maven
mvn --version

# Test Node.js
node --version
npm --version
```

## 📚 Best Practices

### 1. Resource Management
- **Allocate sufficient memory:** 8GB+ RAM for Jenkins server
- **Monitor disk space:** Clean up old builds regularly
- **Docker cleanup:** Regular `docker system prune`

### 2. Security
- **Use credentials plugin** for sensitive data
- **Enable CSRF protection**
- **Regular Jenkins updates**
- **Limit build permissions**

### 3. Performance Optimization
- **Parallel stages** for independent tasks
- **Maven dependency caching**
- **Docker layer caching**
- **Incremental builds**

### 4. Monitoring and Notifications
- **Set up Slack notifications:**
```groovy
environment {
    SLACK_WEBHOOK_URL = credentials('slack-webhook')
}
```

- **Email notifications for failures**
- **Build status badges in README**

### 5. Backup Strategy
- **Jenkins configuration:** `~/jenkins_home`
- **Build artifacts:** Archive important outputs
- **Database backups:** If using persistent storage

## 🔄 Maintenance

### Regular Tasks
1. **Weekly:**
   - Update Jenkins plugins
   - Clean old builds: `Manage Jenkins → Disk Usage`
   - Review build performance

2. **Monthly:**
   - Update base Docker images
   - Review security scan reports
   - Update dependencies

3. **Quarterly:**
   - Jenkins version update
   - Review and optimize pipeline
   - Disaster recovery testing

### Monitoring Commands
```bash
# Check Jenkins health
curl -f http://localhost:8080/login

# Monitor build queue
curl -s http://localhost:8080/queue/api/json

# Check system resources
docker exec jenkins df -h
docker exec jenkins free -h
```

## 🎯 Next Steps

1. **Set up monitoring:** Consider Prometheus + Grafana for metrics
2. **Implement GitOps:** Use ArgoCD for deployment automation
3. **Add quality gates:** SonarQube integration
4. **Multi-environment:** Staging and production pipelines
5. **Blue-green deployment:** Zero-downtime deployments

## 📞 Support

If you encounter issues:

1. **Check Jenkins logs:** `docker logs jenkins`
2. **Review build console output**
3. **Verify all prerequisites are met**
4. **Check Docker daemon status**
5. **Ensure sufficient system resources**

---

**Happy Building! 🚀**

This setup provides a robust CI/CD pipeline that will automatically test your code, build Docker images, and push them to DockerHub whenever you commit changes to your repository.