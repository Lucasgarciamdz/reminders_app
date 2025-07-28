# 🚀 Jenkins Quick Start Guide

Get your Jenkins CI/CD pipeline up and running in minutes!

## ⚡ Quick Setup (5 minutes)

### 1. Prerequisites Check
```bash
# Ensure you have Docker installed and running
docker --version
docker-compose --version

# Make sure you're in the docker group
groups $USER | grep docker
```

### 2. Run the Setup Script
```bash
# Make the script executable and run it
chmod +x jenkins-setup.sh
./jenkins-setup.sh
```

### 3. Access Jenkins
- Open: http://localhost:8080
- Login: `admin` / `admin123`

### 4. Configure Your Pipeline

1. **Update DockerHub credentials:**
   - Go to `Manage Jenkins` → `Manage Credentials`
   - Add your DockerHub username/password with ID: `dockerhub-credentials`

2. **Update Jenkinsfile:**
   ```groovy
   // Replace these lines in Jenkinsfile:
   BACKEND_IMAGE = "your-dockerhub-username/reminders-backend"
   FRONTEND_IMAGE = "your-dockerhub-username/reminders-frontend"
   
   // With your actual DockerHub username:
   BACKEND_IMAGE = "johndoe/reminders-backend"
   FRONTEND_IMAGE = "johndoe/reminders-frontend"
   ```

3. **Create Pipeline Job:**
   - New Item → Pipeline
   - Name: `reminders-ci-cd`
   - Pipeline script from SCM → Git
   - Repository URL: Your Git repo
   - Script Path: `Jenkinsfile`

### 5. Run Your First Build
Click "Build Now" and watch the magic happen! ✨

## 🛠️ Management Commands

```bash
# Start Jenkins
./jenkins-manage.sh start

# Stop Jenkins
./jenkins-manage.sh stop

# View logs
./jenkins-manage.sh logs

# Check status
./jenkins-manage.sh status

# Create backup
./jenkins-manage.sh backup

# Troubleshoot issues
./jenkins-troubleshoot.sh
```

## 🔍 Pipeline Overview

Your pipeline will automatically:

1. ✅ **Run Backend Tests** (with Elasticsearch via testcontainers)
2. ✅ **Run Frontend Unit Tests**
3. ✅ **Execute Cypress E2E Tests**
4. 🐳 **Build Docker Images**
5. 📤 **Push to DockerHub**
6. 🔒 **Security Scans**

**Build Time:** ~8-15 minutes (first build may take longer)

## 🚨 Quick Troubleshooting

### Jenkins won't start?
```bash
# Check if port 8080 is in use
sudo lsof -i :8080

# Restart Docker
sudo systemctl restart docker

# Check logs
docker logs jenkins-ci
```

### Docker permission denied?
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Logout and login again
```

### Tests failing?
- Backend tests use testcontainers (Elasticsearch auto-starts)
- Ensure Docker has enough resources (8GB+ RAM recommended)
- Check `./jenkins-troubleshoot.sh` for detailed diagnostics

## 📚 Need More Help?

- **Detailed Guide:** See `JENKINS_COMPLETE_SETUP_GUIDE.md`
- **Troubleshooting:** Run `./jenkins-troubleshoot.sh`
- **Logs:** `./jenkins-manage.sh logs`

---

**That's it! Your Jenkins CI/CD pipeline is ready to rock! 🎸**