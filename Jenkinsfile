pipeline {
    agent any
    
    tools {
        maven 'Maven3'
        jdk 'JDK-18'
        nodejs 'NodeJS18'
    }
    
    environment {
        DOCKER_HUB_USERNAME = 'luxor12354'
        BACKEND_IMAGE = "${DOCKER_HUB_USERNAME}/reminders_app:backend"
        FRONTEND_IMAGE = "${DOCKER_HUB_USERNAME}/reminders_app:frontend"
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }
        
        stage('Test Backend') {
            steps {
                dir('backend') {
                    echo 'Running backend tests...'
                    sh 'chmod +x mvnw'
                    echo 'Cleaning all build artifacts...'
                    sh 'rm -rf target/ || true'
                    sh 'rm -rf src/main/webapp/node_modules/ || true'
                    sh 'rm -rf src/main/webapp/.angular/ || true'
                    sh './mvnw clean package -DskipTests -X'
                }
            }
            post {
                always {
                    dir('backend') {
                        publishTestResults testResultsPattern: 'target/surefire-reports/*.xml'
                    }
                }
            }
        }
        
        stage('Test Frontend - Cypress') {
            steps {
                dir('frontend') {
                    echo 'Installing frontend dependencies...'
                    sh 'npm ci'
                    echo 'Running Cypress tests...'
                    sh 'npm run cypress:run:headless'
                }
            }
        }
        
        stage('Build Backend Docker Image') {
            steps {
                dir('backend') {
                    echo 'Cleaning frontend build cache...'
                    sh 'rm -rf src/main/webapp/node_modules || true'
                    sh 'rm -rf target/classes/static || true'
                    echo 'Cleaning and packaging backend application...'
                    sh './mvnw clean package -DskipTests'
                    echo 'Building backend Docker image...'
                    script {
                        def backendImage = docker.build("${BACKEND_IMAGE}:${BUILD_NUMBER}")
                        backendImage.tag('latest')
                    }
                }
            }
        }
        
        stage('Build Frontend Docker Image') {
            steps {
                dir('frontend') {
                    echo 'Building frontend Docker image...'
                    script {
                        def frontendImage = docker.build("${FRONTEND_IMAGE}:${BUILD_NUMBER}")
                        frontendImage.tag('latest')
                    }
                }
            }
        }
        
        stage('Push Docker Images') {
            steps {
                echo 'Pushing Docker images to DockerHub...'
                script {
                    docker.withRegistry('https://registry.hub.docker.com', 'docker-hub-credentials') {
                        // Push backend image
                        def backendImage = docker.image("${BACKEND_IMAGE}:${BUILD_NUMBER}")
                        backendImage.push()
                        backendImage.push('latest')
                        
                        // Push frontend image
                        def frontendImage = docker.image("${FRONTEND_IMAGE}:${BUILD_NUMBER}")
                        frontendImage.push()
                        frontendImage.push('latest')
                    }
                }
            }
        }
    }
    
    post {
        always {
            echo 'Pipeline execution completed.'
            cleanWs()
        }
        success {
            echo '✅ Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
    }
}