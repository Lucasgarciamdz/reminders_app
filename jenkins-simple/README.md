# Simple Jenkins Setup

This is a minimal Jenkins setup to run your existing Jenkinsfile pipeline.

## Quick Start

1. **Start Jenkins:**
   ```bash
   cd jenkins-simple
   chmod +x start-jenkins.sh
   ./start-jenkins.sh
   ```

2. **Access Jenkins:**
   - Open http://localhost:8080
   - Get initial password: `docker exec jenkins-simple cat /var/jenkins_home/secrets/initialAdminPassword`

3. **Setup Jenkins:**
   - Install suggested plugins
   - Create admin user
   - Install additional plugins: Docker Pipeline, NodeJS Plugin, Maven Integration

4. **Configure Tools (Manage Jenkins > Tools):**
   - **Maven:** Add Maven 3 (name: `Maven3`)
   - **JDK:** Add JDK 18 (name: `JDK-18`) 
   - **NodeJS:** Add NodeJS 18 (name: `NodeJS18`)

5. **Add Docker Hub Credentials (Manage Jenkins > Credentials):**
   - Add Username/Password credential
   - ID: `docker-hub-credentials`
   - Username: your Docker Hub username
   - Password: your Docker Hub password/token

6. **Create Pipeline:**
   - New Item > Pipeline
   - Pipeline script from SCM
   - Git repository URL: your repo
   - Script path: `Jenkinsfile`

## Commands

- **Start:** `docker-compose up -d`
- **Stop:** `docker-compose down`
- **Logs:** `docker-compose logs -f`
- **Restart:** `docker-compose restart`

## What's Included

- Jenkins LTS 2.504.3 (latest)
- Docker access for building images
- Persistent data storage
- Ports 8080 (web) and 50000 (agents)

That's it! No complex setup, just Jenkins ready to run your pipeline.