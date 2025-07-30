pipeline {
    agent any
    
    environment {
        DOCKER_HUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKER_HUB_USERNAME = 'luxor12354'
        BACKEND_IMAGE = "${DOCKER_HUB_USERNAME}/reminders-backend"
        FRONTEND_IMAGE = "${DOCKER_HUB_USERNAME}/reminders-frontend"
        NODE_VERSION = '22.15.0'
        JAVA_VERSION = '17'
    }
    
    tools {
        maven 'Maven3'
        nodejs 'NodeJS18'
        jdk 'JDK17'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.BUILD_VERSION = sh(
                        script: "echo '${env.BUILD_NUMBER}-${env.GIT_COMMIT[0..7]}'",
                        returnStdout: true
                    ).trim()
                }
            }
        }
        
        stage('Environment Setup') {
            parallel {
                stage('Backend Dependencies') {
                    steps {
                        dir('backend') {
                            sh '''
                                echo "Java Version:"
                                java -version
                                echo "Maven Version:"
                                mvn --version
                                echo "Installing backend dependencies..."
                                mvn dependency:go-offline -ntp
                            '''
                        }
                    }
                }
                
                stage('Frontend Dependencies') {
                    steps {
                        dir('backend') {
                            sh '''
                                echo "Node Version:"
                                node --version
                                echo "NPM Version:"
                                npm --version
                                echo "Installing frontend dependencies..."
                                npm ci --cache .npm --prefer-offline
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Code Quality & Tests') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            sh '''
                                echo "Running backend unit tests..."
                                mvn clean test -ntp -Dskip.installnodenpm -Dskip.npm
                                
                                echo "Running backend integration tests..."
                                mvn verify -ntp -Dskip.installnodenpm -Dskip.npm -DskipUTs=true
                                
                                echo "Running Checkstyle..."
                                mvn checkstyle:check -ntp
                            '''
                        }
                    }
                    post {
                        always {
                            publishTestResults testResultsPattern: 'backend/target/surefire-reports/*.xml'
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'backend/target/site/jacoco',
                                reportFiles: 'index.html',
                                reportName: 'Backend Coverage Report'
                            ])
                        }
                    }
                }
                
                stage('Frontend Tests') {
                    steps {
                        dir('backend') {
                            sh '''
                                echo "Running frontend linting..."
                                npm run lint
                                
                                echo "Running frontend unit tests..."
                                npm run test -- --watch=false --browsers=ChromeHeadless
                                
                                echo "Building frontend for production..."
                                npm run webapp:build:prod
                            '''
                        }
                    }
                    post {
                        always {
                            publishTestResults testResultsPattern: 'backend/target/test-results/TESTS-*.xml'
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'backend/target/test-results/coverage',
                                reportFiles: 'index.html',
                                reportName: 'Frontend Coverage Report'
                            ])
                        }
                    }
                }
            }
        }
        
        stage('Build Applications') {
            parallel {
                stage('Build Backend JAR') {
                    steps {
                        dir('backend') {
                            sh '''
                                echo "Building backend JAR..."
                                mvn clean package -Pprod -DskipTests -ntp
                            '''
                        }
                    }
                    post {
                        always {
                            archiveArtifacts artifacts: 'backend/target/*.jar', fingerprint: true
                        }
                    }
                }
                
                stage('Build Frontend') {
                    steps {
                        dir('backend') {
                            sh '''
                                echo "Building frontend production build..."
                                npm run webapp:build:prod
                            '''
                        }
                    }
                    post {
                        always {
                            archiveArtifacts artifacts: 'backend/target/classes/static/**/*', fingerprint: true
                        }
                    }
                }
            }
        }
        
        stage('Docker Build & Push') {
            parallel {
                stage('Backend Docker') {
                    steps {
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
                
                stage('Frontend Docker') {
                    steps {
                        script {
                            def frontendImage = docker.build("${FRONTEND_IMAGE}:${BUILD_VERSION}", "-f frontend/Dockerfile frontend/")
                            docker.withRegistry('https://registry.hub.docker.com', 'dockerhub-credentials') {
                                frontendImage.push()
                                frontendImage.push('latest')
                            }
                        }
                    }
                }
            }
        }
        
        stage('Integration Tests') {
            steps {
                sh '''
                    echo "Starting services for integration tests..."
                    docker-compose -f docker-compose.yml up -d postgres elasticsearch
                    
                    echo "Waiting for services to be ready..."
                    sleep 30
                    
                    echo "Running integration tests..."
                    cd backend
                    mvn verify -Pit -ntp
                '''
            }
            post {
                always {
                    sh 'docker-compose -f docker-compose.yml down -v'
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                sh '''
                    echo "Deploying to staging environment..."
                    docker-compose -f docker-compose.yml --profile staging up -d
                '''
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                sh '''
                    echo "Deploying to production environment..."
                    docker-compose -f docker-compose.yml --profile production up -d
                '''
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully!'
            slackSend(
                channel: '#deployments',
                color: 'good',
                message: "✅ Build ${env.BUILD_NUMBER} succeeded for ${env.JOB_NAME}"
            )
        }
        failure {
            echo 'Pipeline failed!'
            slackSend(
                channel: '#deployments',
                color: 'danger',
                message: "❌ Build ${env.BUILD_NUMBER} failed for ${env.JOB_NAME}"
            )
        }
    }
}