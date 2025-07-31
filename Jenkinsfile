pipeline {
    agent any
    
    environment {
        DOCKER_HUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKER_HUB_USERNAME = "${DOCKER_HUB_CREDENTIALS_USR}"
        DOCKER_HUB_PASSWORD = "${DOCKER_HUB_CREDENTIALS_PSW}"
        BACKEND_IMAGE = "${DOCKER_HUB_USERNAME}/reminders-backend"
        FRONTEND_IMAGE = "${DOCKER_HUB_USERNAME}/reminders-frontend"
        BUILD_NUMBER_TAG = "${BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build Backend') {
            steps {
                dir('backend') {
                    script {
                        echo "🔨 Compilando el backend con Maven..."
                        sh './mvnw clean package -DskipTests -Pprod'
                        echo "✅ Backend compilado exitosamente"
                    }
                }
            }
        }
        
        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    script {
                        echo "🔨 Compilando el frontend con npm..."
                        sh 'npm ci'
                        sh 'npm run build'
                        echo "✅ Frontend compilado exitosamente"
                    }
                }
            }
        }
        
        stage('Build Docker Images') {
            parallel {
                stage('Build Backend Image') {
                    steps {
                        dir('backend') {
                            script {
                                echo "🐳 Creando imagen Docker del backend..."
                                sh "docker build -t ${BACKEND_IMAGE}:${BUILD_NUMBER_TAG} -t ${BACKEND_IMAGE}:latest ."
                                echo "✅ Imagen del backend creada: ${BACKEND_IMAGE}:${BUILD_NUMBER_TAG}"
                            }
                        }
                    }
                }
                stage('Build Frontend Image') {
                    steps {
                        dir('frontend') {
                            script {
                                echo "🐳 Creando imagen Docker del frontend..."
                                sh "docker build -t ${FRONTEND_IMAGE}:${BUILD_NUMBER_TAG} -t ${FRONTEND_IMAGE}:latest ."
                                echo "✅ Imagen del frontend creada: ${FRONTEND_IMAGE}:${BUILD_NUMBER_TAG}"
                            }
                        }
                    }
                }
            }
        }
        
        stage('Push to Docker Hub') {
            steps {
                script {
                    echo "🚀 Subiendo imágenes a Docker Hub..."
                    
                    // Login to Docker Hub
                    sh "echo ${DOCKER_HUB_PASSWORD} | docker login -u ${DOCKER_HUB_USERNAME} --password-stdin"
                    
                    // Push backend images
                    sh "docker push ${BACKEND_IMAGE}:${BUILD_NUMBER_TAG}"
                    sh "docker push ${BACKEND_IMAGE}:latest"
                    echo "✅ Backend subido a Docker Hub: ${BACKEND_IMAGE}"
                    
                    // Push frontend images
                    sh "docker push ${FRONTEND_IMAGE}:${BUILD_NUMBER_TAG}"
                    sh "docker push ${FRONTEND_IMAGE}:latest"
                    echo "✅ Frontend subido a Docker Hub: ${FRONTEND_IMAGE}"
                    
                    // Logout
                    sh "docker logout"
                }
            }
        }
        
        stage('Cleanup') {
            steps {
                script {
                    echo "🧹 Limpiando imágenes locales..."
                    sh "docker rmi ${BACKEND_IMAGE}:${BUILD_NUMBER_TAG} ${BACKEND_IMAGE}:latest || true"
                    sh "docker rmi ${FRONTEND_IMAGE}:${BUILD_NUMBER_TAG} ${FRONTEND_IMAGE}:latest || true"
                    echo "✅ Limpieza completada"
                }
            }
        }
    }
    
    post {
        success {
            echo "🎉 Pipeline ejecutado exitosamente!"
            echo "📦 Imágenes disponibles en Docker Hub:"
            echo "   - ${BACKEND_IMAGE}:${BUILD_NUMBER_TAG}"
            echo "   - ${FRONTEND_IMAGE}:${BUILD_NUMBER_TAG}"
        }
        failure {
            echo "❌ Pipeline falló. Revisa los logs para más detalles."
        }
        always {
            echo "🧹 Limpiando workspace..."
            cleanWs()
        }
    }
}