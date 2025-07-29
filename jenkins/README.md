# Jenkins Setup for JHipster Application

This directory contains all the necessary files to set up a complete Jenkins CI/CD pipeline for your JHipster application.

## 🚀 Quick Start

1. **Run the setup script:**
   ```bash
   ./jenkins/setup-jenkins.sh
   ```

2. **Access Jenkins:**
   - URL: http://localhost:8081
   - Username: `admin`
   - Password: `admin123`

## 📁 Files Overview

- `docker-compose.jenkins.yml` - Jenkins master and agent setup
- `Dockerfile.jenkins` - Custom Jenkins image with required tools
- `plugins.txt` - List of Jenkins plugins to install
- `setup-jenkins.sh` - Automated setup script
- `jenkins-config/` - Jenkins configuration files

## 🔧 What's Included

### Tools Installed
- **Jenkins 2.479** with JDK 17
- **Maven 3.9.6** for backend builds
- **Node.js 22.15.0** for frontend builds
- **Docker CLI** for container operations
- **Essential Jenkins plugins** for CI/CD

### Pipeline Features
- ✅ **Parallel execution** for faster builds
- ✅ **Backend testing** (unit + integration)
- ✅ **Frontend testing** (lint + unit tests)
- ✅ **Code quality checks** (Checkstyle, coverage)
- ✅ **Docker image building** and pushing
- ✅ **Multi-environment deployment** (staging/production)
- ✅ **Health checks** and monitoring
- ✅ **Slack notifications** (configurable)

## 📋 Pipeline Stages

1. **Checkout** - Get source code
2. **Environment Setup** - Install dependencies (parallel)
3. **Code Quality & Tests** - Run all tests (parallel)
4. **Build Applications** - Create JAR and frontend build (parallel)
5. **Docker Build & Push** - Create and push Docker images (parallel)
6. **Integration Tests** - End-to-end testing
7. **Deploy** - Deploy to staging/production

## ⚙️ Configuration

### Docker Hub Credentials
1. Go to Jenkins → Manage Jenkins → Manage Credentials
2. Update the `dockerhub-credentials` with your actual Docker Hub username and password/token
3. Or update the setup script with your credentials before running

### Environment Variables
Update these in the Jenkinsfile if needed:
- `DOCKER_HUB_USERNAME` - Your Docker Hub username
- `BACKEND_IMAGE` - Backend Docker image name
- `FRONTEND_IMAGE` - Frontend Docker image name

### Branch Strategy
- `develop` branch → Automatic deployment to staging
- `main` branch → Manual approval for production deployment

## 🔍 Monitoring & Reports

The pipeline generates:
- **Test reports** for backend and frontend
- **Code coverage reports** (JaCoCo for backend, Jest for frontend)
- **Build artifacts** (JAR files, static assets)
- **Docker image tags** with build version

## 🛠️ Customization

### Adding New Stages
Edit the `Jenkinsfile` to add new stages:
```groovy
stage('Your New Stage') {
    steps {
        // Your commands here
    }
}
```

### Adding Plugins
Add plugin names to `plugins.txt` and rebuild the Jenkins image:
```bash
cd jenkins
docker-compose -f docker-compose.jenkins.yml down
docker-compose -f docker-compose.jenkins.yml up --build -d
```

## 🚨 Troubleshooting

### Jenkins Won't Start
- Check if port 8081 is available
- Ensure Docker has enough resources allocated
- Check logs: `docker-compose -f jenkins/docker-compose.jenkins.yml logs`

### Build Failures
- Check if all tools are properly installed
- Verify Docker Hub credentials
- Ensure your application builds locally first

### Permission Issues
- Make sure Jenkins has access to Docker socket
- Check file permissions in jenkins-data directory

## 📞 Support Commands

```bash
# View Jenkins logs
docker-compose -f jenkins/docker-compose.jenkins.yml logs -f

# Restart Jenkins
docker-compose -f jenkins/docker-compose.jenkins.yml restart

# Stop Jenkins
docker-compose -f jenkins/docker-compose.jenkins.yml down

# Clean up (removes all data)
docker-compose -f jenkins/docker-compose.jenkins.yml down -v
```

## 🔐 Security Notes

- Change default admin password after first login
- Use Docker Hub tokens instead of passwords
- Consider setting up HTTPS for production use
- Regularly update Jenkins and plugins

## 📈 Next Steps

1. **Set up webhooks** in your Git repository for automatic builds
2. **Configure Slack notifications** by adding your webhook URL
3. **Set up monitoring** with health checks and alerts
4. **Add more environments** (dev, staging, prod) as needed
5. **Implement blue-green deployments** for zero-downtime updates