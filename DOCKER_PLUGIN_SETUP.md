# Jenkins Docker Plugin Implementation

## Overview
Your Jenkinsfile has been updated to use the Jenkins Docker Pipeline plugin instead of shell commands for Docker operations. This provides better error handling, cleaner syntax, and more robust Docker integration.

## Changes Made

### 1. Build Stage Improvements
**Before:**
```groovy
sh "docker build -t ${BACKEND_IMAGE}:${BUILD_NUMBER_TAG} -t ${BACKEND_IMAGE}:latest ."
```

**After:**
```groovy
def backendImage = docker.build("${BACKEND_IMAGE}:${BUILD_NUMBER_TAG}")
backendImage.tag('latest')
```

### 2. Registry Operations
**Before:**
```groovy
sh "echo ${DOCKER_HUB_PASSWORD} | docker login -u ${DOCKER_HUB_USERNAME} --password-stdin"
sh "docker push ${BACKEND_IMAGE}:${BUILD_NUMBER_TAG}"
sh "docker logout"
```

**After:**
```groovy
docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-credentials') {
    def backendImage = docker.image("${BACKEND_IMAGE}:${BUILD_NUMBER_TAG}")
    backendImage.push()
    backendImage.push('latest')
}
```

### 3. Enhanced Error Handling
- Added try-catch blocks for cleanup operations
- Better error messages and warnings
- Automatic registry logout handled by the plugin

## Required Setup Steps

### 1. Fix Docker Permission Issues (CRITICAL)
The "Permission denied" error occurs because Jenkins doesn't have access to the Docker daemon. Here are the solutions:

#### Option A: If Jenkins runs directly on the host (not in Docker)
```bash
# Add jenkins user to docker group
sudo usermod -aG docker jenkins

# Fix docker socket permissions
sudo chown root:docker /var/run/docker.sock
sudo chmod 664 /var/run/docker.sock

# Restart Jenkins service
sudo systemctl restart jenkins
```

#### Option B: If Jenkins runs in Docker (recommended for your setup)
Update your `docker-compose.jenkins.yml` to include proper Docker socket mounting:

```yaml
version: '3.8'
services:
  jenkins:
    image: jenkins/jenkins:lts
    container_name: jenkins
    user: root  # Run as root to access Docker socket
    volumes:
      - jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock  # Mount Docker socket
      - /usr/bin/docker:/usr/bin/docker  # Mount Docker binary
    ports:
      - "8080:8080"
      - "50000:50000"
    environment:
      - JAVA_OPTS=-Djenkins.install.runSetupWizard=false

volumes:
  jenkins_home:
```

#### Option C: Alternative Docker-in-Docker approach
```yaml
version: '3.8'
services:
  jenkins:
    image: jenkins/jenkins:lts
    container_name: jenkins
    privileged: true
    volumes:
      - jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
    ports:
      - "8080:8080"
      - "50000:50000"
    environment:
      - DOCKER_HOST=unix:///var/run/docker.sock

volumes:
  jenkins_home:
```

### 2. Install Docker Pipeline Plugin
1. Go to **Manage Jenkins** → **Manage Plugins**
2. Search for "Docker Pipeline" plugin
3. Install and restart Jenkins if needed

### 3. Verify Docker Hub Credentials
Ensure your Docker Hub credentials are properly configured:
1. Go to **Manage Jenkins** → **Manage Credentials**
2. Verify that `dockerhub-credentials` exists with:
   - **Kind**: Username with password
   - **Username**: Your Docker Hub username
   - **Password**: Your Docker Hub password or access token

### 4. Test Docker Access
After fixing permissions, test Docker access in Jenkins:
1. Create a simple pipeline job
2. Add this test script:
```groovy
pipeline {
    agent any
    stages {
        stage('Test Docker') {
            steps {
                sh 'docker --version'
                sh 'docker info'
            }
        }
    }
}
```

## Benefits of Using Docker Plugin

### 1. Better Security
- Credentials are handled securely by Jenkins
- No password exposure in logs
- Automatic cleanup of authentication tokens

### 2. Improved Error Handling
- Plugin provides better error messages
- Automatic retry mechanisms
- Proper exception handling

### 3. Cleaner Code
- More readable pipeline syntax
- Less shell command complexity
- Better integration with Jenkins features

### 4. Enhanced Functionality
- Built-in registry management
- Image tagging and pushing in one operation
- Better workspace synchronization

## Testing the Updated Pipeline

1. **Verify Plugin Installation**: Check that Docker Pipeline plugin is installed
2. **Test Credentials**: Ensure Docker Hub credentials work
3. **Run Pipeline**: Execute the updated Jenkinsfile
4. **Monitor Logs**: Check for any plugin-specific error messages

## Troubleshooting

### Common Issues:

1. **Permission Denied Error (Most Common)**
   ```
   docker: Permission denied
   ```
   **Solution**: Fix Docker socket permissions (see setup steps above)

2. **Docker Command Not Found**
   ```
   docker: command not found
   ```
   **Solution**: Install Docker in Jenkins container or mount Docker binary

3. **Plugin Not Found Error**
   - Install Docker Pipeline plugin from Jenkins Plugin Manager

4. **Credentials Not Found**
   - Verify `dockerhub-credentials` ID matches your credential configuration

5. **Docker Daemon Connection Issues**
   - Ensure Jenkins agent has access to Docker daemon
   - Check Docker socket permissions: `/var/run/docker.sock`

6. **Registry Authentication Failures**
   - Verify Docker Hub credentials are correct
   - Check if using Docker Hub access tokens instead of passwords

### Debug Commands:
```bash
# Check Docker socket permissions
ls -la /var/run/docker.sock

# Check if jenkins user is in docker group
groups jenkins

# Test Docker access from Jenkins container
docker exec -it jenkins docker --version

# Check if Docker Pipeline plugin is installed
curl -s http://your-jenkins-url/pluginManager/api/json?depth=1 | grep docker-workflow
```

### Quick Fix Commands:
```bash
# If Jenkins runs on host
sudo usermod -aG docker jenkins
sudo chown root:docker /var/run/docker.sock
sudo chmod 664 /var/run/docker.sock
sudo systemctl restart jenkins

# If Jenkins runs in Docker, restart with proper permissions
docker-compose down
docker-compose up -d
```

## Next Steps

1. **Install the Docker Pipeline plugin** if not already installed
2. **Verify your Docker Hub credentials** configuration
3. **Test the updated pipeline** with a small change
4. **Monitor the first few builds** to ensure everything works correctly

The updated pipeline is now more maintainable and follows Jenkins best practices for Docker integration.