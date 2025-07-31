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
        
        // stage('Install Dependencies') {
        //     steps {
        //         script {
        //             echo "🔧 Instalando dependencias necesarias..."
        //             sh '''
        //                 # Instalar Docker CLI si no existe
        //                 if ! command -v docker &> /dev/null; then
        //                     echo "Instalando Docker CLI..."
        //                     apt-get update
        //                     apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
        //                     curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        //                     echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        //                     apt-get update
        //                     apt-get install -y docker-ce-cli
        //                 fi
                        
        //                 # Instalar Node.js si no existe
        //                 if ! command -v node &> /dev/null; then
        //                     echo "Instalando Node.js..."
        //                     curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        //                     apt-get install -y nodejs
        //                 fi
                        
        //                 echo "Versiones instaladas:"
        //                 docker --version
        //                 node --version
        //                 npm --version
        //             '''
        //         }
        //     }
        // }
        
        stage('Build Backend') {
            steps {
                dir('backend') {
                    script {
                        echo "🔨 Compilando el backend con Maven..."
                        sh './mvnw clean package -DskipTests -Pprod -Dskip.installnodenpm -Dskip.npm'
                        echo "✅ Backend compilado exitosamente"
                    }
                }
            }
        }
        
        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    script {
                        echo "🔨 Instalando Node.js y compilando el frontend..."
                        
                        // Instalar Node.js si no existe
                        sh '''
                            if ! command -v node &> /dev/null; then
                                echo "Instalando Node.js..."
                                curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
                                apt-get install -y nodejs
                            fi
                            
                            echo "Versiones instaladas:"
                            node --version
                            npm --version
                        '''
                        
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
                                def backendImage = docker.build("${BACKEND_IMAGE}:${BUILD_NUMBER_TAG}")
                                backendImage.tag('latest')
                                echo "✅ Imagen del backend creada: ${BACKEND_IMAGE}:${BUILD_NUMBER_TAG}"
                                
                                // Store the image for later use
                                env.BACKEND_IMAGE_BUILT = "${BACKEND_IMAGE}:${BUILD_NUMBER_TAG}"
                            }
                        }
                    }
                }
                stage('Build Frontend Image') {
                    steps {
                        dir('frontend') {
                            script {
                                echo "🐳 Creando imagen Docker del frontend..."
                                def frontendImage = docker.build("${FRONTEND_IMAGE}:${BUILD_NUMBER_TAG}")
                                frontendImage.tag('latest')
                                echo "✅ Imagen del frontend creada: ${FRONTEND_IMAGE}:${BUILD_NUMBER_TAG}"
                                
                                // Store the image for later use
                                env.FRONTEND_IMAGE_BUILT = "${FRONTEND_IMAGE}:${BUILD_NUMBER_TAG}"
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
                    
                    // Use Docker Pipeline plugin for registry operations
                    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-credentials') {
                        // Push backend images
                        def backendImage = docker.image("${BACKEND_IMAGE}:${BUILD_NUMBER_TAG}")
                        backendImage.push()
                        backendImage.push('latest')
                        echo "✅ Backend subido a Docker Hub: ${BACKEND_IMAGE}"
                        
                        // Push frontend images
                        def frontendImage = docker.image("${FRONTEND_IMAGE}:${BUILD_NUMBER_TAG}")
                        frontendImage.push()
                        frontendImage.push('latest')
                        echo "✅ Frontend subido a Docker Hub: ${FRONTEND_IMAGE}"
                    }
                }
            }
        }
        
        stage('Cleanup') {
            steps {
                script {
                    echo "🧹 Limpiando imágenes locales..."
                    try {
                        // Clean up backend images
                        def backendImage = docker.image("${BACKEND_IMAGE}:${BUILD_NUMBER_TAG}")
                        sh "docker rmi ${BACKEND_IMAGE}:${BUILD_NUMBER_TAG} ${BACKEND_IMAGE}:latest || true"
                        
                        // Clean up frontend images
                        def frontendImage = docker.image("${FRONTEND_IMAGE}:${BUILD_NUMBER_TAG}")
                        sh "docker rmi ${FRONTEND_IMAGE}:${BUILD_NUMBER_TAG} ${FRONTEND_IMAGE}:latest || true"
                    } catch (Exception e) {
                        echo "⚠️ Cleanup warning: ${e.getMessage()}"
                    }
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