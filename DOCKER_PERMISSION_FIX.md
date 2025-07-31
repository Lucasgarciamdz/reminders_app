# Quick Fix for Docker Permission Denied Error

## The Problem
You're getting this error:
```
docker: Permission denied
/var/jenkins_home/workspace/reminders-pipeline/frontend@tmp/durable-07e2cd85/script.sh.copy: 1: docker: Permission denied
```

This happens because Jenkins doesn't have permission to access the Docker daemon.

## Quick Solution

### Step 1: Check your Jenkins setup
First, determine how Jenkins is running:

```bash
# Check if Jenkins is running in Docker
docker ps | grep jenkins

# Or check if it's a system service
sudo systemctl status jenkins
```

### Step 2: Fix based on your setup

#### If Jenkins runs in Docker (most likely your case):

1. **Stop Jenkins:**
```bash
docker-compose down
# or
docker stop jenkins
```

2. **Update your docker-compose.jenkins.yml:**
```yaml
version: '3.8'
services:
  jenkins:
    image: jenkins/jenkins:lts
    container_name: jenkins
    user: root  # This is the key change
    volumes:
      - jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock  # Mount Docker socket
      - /usr/bin/docker:/usr/bin/docker:ro  # Mount Docker binary (read-only)
    ports:
      - "8080:8080"
      - "50000:50000"
    environment:
      - JAVA_OPTS=-Djenkins.install.runSetupWizard=false

volumes:
  jenkins_home:
```

3. **Restart Jenkins:**
```bash
docker-compose up -d
```

#### If Jenkins runs as a system service:

```bash
# Add jenkins user to docker group
sudo usermod -aG docker jenkins

# Fix docker socket permissions
sudo chown root:docker /var/run/docker.sock
sudo chmod 664 /var/run/docker.sock

# Restart Jenkins
sudo systemctl restart jenkins
```

### Step 3: Test the fix

1. Go to Jenkins → New Item → Pipeline
2. Use this test script:
```groovy
pipeline {
    agent any
    stages {
        stage('Test Docker') {
            steps {
                sh 'whoami'
                sh 'docker --version'
                sh 'docker info'
            }
        }
    }
}
```

3. Run the pipeline. You should see Docker working without permission errors.

### Step 4: Run your original pipeline

Once Docker permissions are fixed, your original pipeline should work.

## Alternative: Use Docker Plugin Later

After fixing the permission issue, you can switch back to using the Docker Pipeline plugin for better integration. But first, get the basic Docker commands working.

## Security Note

Running Jenkins as root (user: root) gives it full system access. This is convenient but less secure. For production, consider:

1. Creating a custom Jenkins image with proper Docker group setup
2. Using rootless Docker
3. Running Jenkins with specific user permissions

But for development/testing, the root approach is the quickest fix.