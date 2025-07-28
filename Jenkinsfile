pipeline {
    agent any
    
    environment {
        // DockerHub credentials (configure in Jenkins)
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKERHUB_USERNAME = "${DOCKERHUB_CREDENTIALS_USR}"
        DOCKERHUB_PASSWORD = "${DOCKERHUB_CREDENTIALS_PSW}"
        
        // Docker image names (change these to your DockerHub username/repository)
        BACKEND_IMAGE = "luxor12354/reminders_app:latest_backend"
        FRONTEND_IMAGE = "luxor12354/reminders_app:latest_frontend"
        
        // Build version
        BUILD_VERSION = "${BUILD_NUMBER}-${GIT_COMMIT.take(7)}"
        
        // Java and Node versions
        JAVA_HOME = "/usr/lib/jvm/java-17-openjdk"
        NODE_VERSION = "24"
        
        // Test configuration
        CYPRESS_CACHE_FOLDER = "${WORKSPACE}/.cypress"
    }
    
    tools {
        jdk 'JDK17'
        nodejs 'NodeJS18'
        maven 'Maven3'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
                
                // Display environment info
                sh '''
                    echo "=== Environment Information ==="
                    java -version
                    node --version
                    npm --version
                    mvn --version
                    docker --version
                    echo "==============================="
                '''
            }
        }
        
        stage('Install Dependencies') {
            parallel {
                stage('Backend Dependencies') {
                    steps {
                        echo 'Installing backend dependencies...'
                        dir('backend') {
                            sh '''
                                # Cache Maven dependencies
                                mvn dependency:go-offline -ntp --batch-mode
                            '''
                        }
                    }
                }
                
                stage('Frontend Dependencies') {
                    steps {
                        echo 'Installing frontend dependencies...'
                        dir('frontend') {
                            sh '''
                                # Clean install for consistent builds
                                npm ci
                                
                                # Verify Cypress installation
                                npx cypress verify
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Run Tests') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        echo 'Running backend tests with Elasticsearch...'
                        dir('backend') {
                            script {
                                try {
                                    sh '''
                                        # Run unit tests (testcontainers will handle Elasticsearch)
                                        mvn clean test -ntp --batch-mode \
                                            -Dlogging.level.ROOT=WARN \
                                            -Dlogging.level.org.springframework=WARN \
                                            -Dlogging.level.ar.edu.um=INFO
                                        
                                        # Run integration tests
                                        mvn verify -ntp --batch-mode \
                                            -DskipUnitTests=true \
                                            -Dlogging.level.ROOT=WARN \
                                            -Dlogging.level.org.springframework=WARN \
                                            -Dlogging.level.ar.edu.um=INFO
                                    '''
                                } catch (Exception e) {
                                    currentBuild.result = 'UNSTABLE'
                                    echo "Backend tests failed: ${e.getMessage()}"
                                    throw e
                                }
                            }
                        }
                    }
                    post {
                        always {
                            // Publish test results
                            dir('backend') {
                                publishTestResults testResultsPattern: 'target/surefire-reports/*.xml'
                                publishTestResults testResultsPattern: 'target/failsafe-reports/*.xml'
                                
                                // Archive test reports
                                archiveArtifacts artifacts: 'target/surefire-reports/**/*', allowEmptyArchive: true
                                archiveArtifacts artifacts: 'target/failsafe-reports/**/*', allowEmptyArchive: true
                            }
                        }
                    }
                }
                
                stage('Frontend Unit Tests') {
                    steps {
                        echo 'Running frontend unit tests...'
                        dir('frontend') {
                            sh '''
                                # Run React unit tests
                                CI=true npm test -- --coverage --watchAll=false --testResultsProcessor=jest-junit
                            '''
                        }
                    }
                    post {
                        always {
                            dir('frontend') {
                                // Publish test results if available
                                publishTestResults testResultsPattern: 'junit.xml'
                                
                                // Publish coverage reports
                                publishHTML([
                                    allowMissing: false,
                                    alwaysLinkToLastBuild: true,
                                    keepAll: true,
                                    reportDir: 'coverage/lcov-report',
                                    reportFiles: 'index.html',
                                    reportName: 'Frontend Coverage Report'
                                ])
                            }
                        }
                    }
                }
            }
        }
        
        stage('E2E Tests') {
            steps {
                echo 'Running Cypress E2E tests...'
                script {
                    try {
                        // Start backend for E2E tests
                        dir('backend') {
                            sh '''
                                # Start backend in background for E2E tests
                                nohup mvn spring-boot:run -Dspring-boot.run.profiles=e2e -ntp > backend.log 2>&1 &
                                echo $! > backend.pid
                                
                                # Wait for backend to be ready
                                echo "Waiting for backend to start..."
                                timeout 120 bash -c 'until curl -f http://localhost:8080/management/health; do sleep 2; done'
                            '''
                        }
                        
                        // Run Cypress tests
                        dir('frontend') {
                            sh '''
                                # Start frontend and run Cypress tests
                                npm run test:e2e
                            '''
                        }
                    } catch (Exception e) {
                        echo "E2E tests failed: ${e.getMessage()}"
                        currentBuild.result = 'UNSTABLE'
                    } finally {
                        // Stop backend
                        dir('backend') {
                            sh '''
                                if [ -f backend.pid ]; then
                                    kill $(cat backend.pid) || true
                                    rm -f backend.pid
                                fi
                            '''
                        }
                    }
                }
            }
            post {
                always {
                    dir('frontend') {
                        // Archive Cypress results
                        archiveArtifacts artifacts: 'cypress/videos/**/*', allowEmptyArchive: true
                        archiveArtifacts artifacts: 'cypress/screenshots/**/*', allowEmptyArchive: true
                        
                        // Publish Cypress test results if available
                        publishTestResults testResultsPattern: 'cypress/results/*.xml'
                    }
                    
                    // Archive backend logs
                    dir('backend') {
                        archiveArtifacts artifacts: 'backend.log', allowEmptyArchive: true
                    }
                }
            }
        }
        
        stage('Build and Push Docker Images') {
            parallel {
                stage('Build Backend Image') {
                    steps {
                        echo 'Building backend Docker image...'
                        dir('backend') {
                            script {
                                try {
                                    // Build using Jib for better performance
                                    sh '''
                                        mvn clean package -DskipTests -Pprod jib:build \
                                            -Djib.to.image=${BACKEND_IMAGE}:${BUILD_VERSION} \
                                            -Djib.to.auth.username=${DOCKERHUB_USERNAME} \
                                            -Djib.to.auth.password=${DOCKERHUB_PASSWORD} \
                                            -ntp --batch-mode
                                    '''
                                    
                                    // Tag as latest
                                    sh '''
                                        mvn jib:build \
                                            -Djib.to.image=${BACKEND_IMAGE}:latest \
                                            -Djib.to.auth.username=${DOCKERHUB_USERNAME} \
                                            -Djib.to.auth.password=${DOCKERHUB_PASSWORD} \
                                            -ntp --batch-mode
                                    '''
                                } catch (Exception e) {
                                    echo "Backend image build failed, trying Docker build..."
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
                    }
                }
                
                stage('Build Frontend Image') {
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
            }
        }
        
        stage('Security Scan') {
            parallel {
                stage('Backend Security Scan') {
                    steps {
                        echo 'Running backend security scan...'
                        dir('backend') {
                            sh '''
                                # Run OWASP dependency check
                                mvn org.owasp:dependency-check-maven:check -ntp --batch-mode || true
                            '''
                        }
                    }
                    post {
                        always {
                            dir('backend') {
                                archiveArtifacts artifacts: 'target/dependency-check-report.html', allowEmptyArchive: true
                            }
                        }
                    }
                }
                
                stage('Frontend Security Scan') {
                    steps {
                        echo 'Running frontend security scan...'
                        dir('frontend') {
                            sh '''
                                # Run npm audit
                                npm audit --audit-level=moderate || true
                                
                                # Generate audit report
                                npm audit --json > audit-report.json || true
                            '''
                        }
                    }
                    post {
                        always {
                            dir('frontend') {
                                archiveArtifacts artifacts: 'audit-report.json', allowEmptyArchive: true
                            }
                        }
                    }
                }
            }
        }
    }
    
    post {
        always {
            echo 'Pipeline completed!'
            
            // Clean up Docker resources
            sh '''
                # Clean up dangling images
                docker image prune -f || true
                
                # Clean up stopped containers
                docker container prune -f || true
                
                # Clean up unused networks
                docker network prune -f || true
            '''
        }
        
        success {
            echo '✅ Pipeline succeeded! All tests passed and images pushed to DockerHub.'
            
            // Send success notification (configure webhook URL)
            script {
                if (env.SLACK_WEBHOOK_URL) {
                    sh """
                        curl -X POST -H 'Content-type: application/json' \
                        --data '{"text":"✅ Build #${BUILD_NUMBER} succeeded for ${JOB_NAME}\\nImages: ${BACKEND_IMAGE}:${BUILD_VERSION}, ${FRONTEND_IMAGE}:${BUILD_VERSION}"}' \
                        ${SLACK_WEBHOOK_URL}
                    """
                }
            }
        }
        
        failure {
            echo '❌ Pipeline failed! Check the logs for details.'
            
            // Send failure notification
            script {
                if (env.SLACK_WEBHOOK_URL) {
                    sh """
                        curl -X POST -H 'Content-type: application/json' \
                        --data '{"text":"❌ Build #${BUILD_NUMBER} failed for ${JOB_NAME}\\nCheck: ${BUILD_URL}"}' \
                        ${SLACK_WEBHOOK_URL}
                    """
                }
            }
        }
        
        unstable {
            echo '⚠️ Pipeline completed with test failures.'
            
            script {
                if (env.SLACK_WEBHOOK_URL) {
                    sh """
                        curl -X POST -H 'Content-type: application/json' \
                        --data '{"text":"⚠️ Build #${BUILD_NUMBER} unstable for ${JOB_NAME}\\nSome tests failed: ${BUILD_URL}"}' \
                        ${SLACK_WEBHOOK_URL}
                    """
                }
            }
        }
    }
}