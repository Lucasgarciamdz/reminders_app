pipeline {
    agent any
    
    environment {
        // DockerHub credentials (configure in Jenkins)
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKERHUB_USERNAME = "${DOCKERHUB_CREDENTIALS_USR}"
        DOCKERHUB_PASSWORD = "${DOCKERHUB_CREDENTIALS_PSW}"
        
        // Docker image names (change these to your DockerHub username/repository)
        BACKEND_IMAGE = "your-dockerhub-username/reminders-backend"
        FRONTEND_IMAGE = "your-dockerhub-username/reminders-frontend"
        
        // Build version
        BUILD_VERSION = "${BUILD_NUMBER}-${GIT_COMMIT.take(7)}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }
        
        stage('Build Backend') {
            steps {
                echo 'Building backend Docker image...'
                dir('backend') {
                    script {
                        def backendImage = docker.build("${BACKEND_IMAGE}:${BUILD_VERSION}")
                        docker.withRegistry('https://registry.hub.docker.com', 'dockerhub-credentials') {
                            backendImage.push()
                            backendImage.push('latest')
                        }
                    }
                }
            }
        }
        
        stage('Build Frontend') {
            steps {
                echo 'Building frontend Docker image...'
                dir('frontend') {
                    script {
                        def frontendImage = docker.build("${FRONTEND_IMAGE}:${BUILD_VERSION}")
                        docker.withRegistry('https://registry.hub.docker.com', 'dockerhub-credentials') {
                            frontendImage.push()
                            frontendImage.push('latest')
                        }
                    }
                }
            }
        }
        
        stage('Clean Up') {
            steps {
                echo 'Cleaning up local Docker images...'
                sh """
                    docker rmi ${BACKEND_IMAGE}:${BUILD_VERSION} || true
                    docker rmi ${FRONTEND_IMAGE}:${BUILD_VERSION} || true
                    docker system prune -f
                """
            }
        }
    }
    
    post {
        always {
            echo 'Pipeline completed!'
            // Clean workspace
            cleanWs()
        }
        success {
            echo 'Pipeline succeeded! Images pushed to DockerHub.'
        }
        failure {
            echo 'Pipeline failed! Check the logs for details.'
        }
    }
}