# 🚀 Guía de Configuración de Jenkins para CI/CD

Esta guía te ayudará a configurar Jenkins localmente con Docker para compilar y subir automáticamente tus proyectos backend y frontend a Docker Hub.

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:
- Docker y Docker Compose
- Git
- Una cuenta en Docker Hub

## 🔧 Paso 1: Levantar Jenkins con Docker Compose

1. **Ejecuta Jenkins:**
   ```bash
   docker-compose -f docker-compose.jenkins.yml up -d
   ```

2. **Verifica que Jenkins esté corriendo:**
   ```bash
   docker logs jenkins-server
   ```

3. **Accede a Jenkins:**
   - Abre tu navegador en: http://localhost:8080
   - Espera a que Jenkins termine de inicializar

## 🔑 Paso 2: Configuración Inicial de Jenkins

1. **Obtén la contraseña inicial:**
   ```bash
   docker exec jenkins-server cat /var/jenkins_home/secrets/initialAdminPassword
   ```

2. **Completa el setup inicial:**
   - Pega la contraseña en la interfaz web
   - Selecciona "Install suggested plugins"
   - Crea tu usuario administrador
   - Configura la URL de Jenkins (deja la por defecto: http://localhost:8080)

## 🔌 Paso 3: Instalar Plugins Necesarios

Ve a **Manage Jenkins > Manage Plugins > Available** e instala:

- **Docker Pipeline** (para comandos Docker en pipelines)
- **Git** (para integración con repositorios Git)
- **Pipeline** (para pipelines declarativos)
- **Credentials Binding** (para manejar credenciales)

Reinicia Jenkins después de instalar los plugins.

## 🔐 Paso 4: Configurar Credenciales de Docker Hub

1. Ve a **Manage Jenkins > Manage Credentials**
2. Haz clic en **(global)** domain
3. Haz clic en **Add Credentials**
4. Configura:
   - **Kind:** Username with password
   - **Username:** tu_usuario_dockerhub
   - **Password:** tu_contraseña_dockerhub
   - **ID:** `dockerhub-credentials` (¡IMPORTANTE: usa exactamente este ID!)
   - **Description:** Docker Hub Credentials

## 📁 Paso 5: Crear el Pipeline Job

1. **Crear nuevo job:**
   - Haz clic en **New Item**
   - Nombre: `reminders-ci-cd`
   - Selecciona **Pipeline**
   - Haz clic en **OK**

2. **Configurar el pipeline:**
   - En la sección **Pipeline**, selecciona **Pipeline script from SCM**
   - **SCM:** Git
   - **Repository URL:** la URL de tu repositorio Git
   - **Branch:** */main (o la rama que uses)
   - **Script Path:** Jenkinsfile
   - Haz clic en **Save**

## 🎯 Paso 6: Ejecutar el Pipeline

1. **Ejecutar manualmente:**
   - Ve al job `reminders-ci-cd`
   - Haz clic en **Build Now**

2. **Monitorear la ejecución:**
   - Haz clic en el número de build en **Build History**
   - Ve a **Console Output** para ver los logs en tiempo real

## 📦 ¿Qué hace el Pipeline?

El pipeline automatiza estos pasos:

1. **Checkout:** Descarga el código del repositorio
2. **Build Backend:** Compila el proyecto Spring Boot con Maven
3. **Build Frontend:** Compila el proyecto React con npm
4. **Build Docker Images:** Crea imágenes Docker para backend y frontend
5. **Push to Docker Hub:** Sube las imágenes a tu cuenta de Docker Hub
6. **Cleanup:** Limpia las imágenes locales para ahorrar espacio

## 🏷️ Etiquetas de las Imágenes

Las imágenes se suben con dos etiquetas:
- `tu_usuario/reminders-backend:BUILD_NUMBER` (ej: `tu_usuario/reminders-backend:1`)
- `tu_usuario/reminders-backend:latest`
- `tu_usuario/reminders-frontend:BUILD_NUMBER` (ej: `tu_usuario/reminders-frontend:1`)
- `tu_usuario/reminders-frontend:latest`

## 🔧 Comandos Útiles

**Ver logs de Jenkins:**
```bash
docker logs -f jenkins-server
```

**Parar Jenkins:**
```bash
docker-compose -f docker-compose.jenkins.yml down
```

**Reiniciar Jenkins:**
```bash
docker-compose -f docker-compose.jenkins.yml restart
```

**Acceder al contenedor de Jenkins:**
```bash
docker exec -it jenkins-server bash
```

## 🚨 Solución de Problemas

### Error de permisos con Docker
Si tienes problemas con permisos de Docker, verifica que el usuario jenkins tenga acceso al socket de Docker:
```bash
docker exec -it jenkins-server ls -la /var/run/docker.sock
```

### Error de compilación del backend
Asegúrate de que el archivo `mvnw` tenga permisos de ejecución:
```bash
chmod +x backend/mvnw
```

### Error de compilación del frontend
Verifica que Node.js esté disponible en el contenedor de Jenkins. El pipeline usa la imagen base que incluye Node.js.

## 🎉 ¡Listo!

Una vez configurado, cada vez que ejecutes el pipeline:
1. Se compilarán ambos proyectos
2. Se crearán las imágenes Docker
3. Se subirán automáticamente a tu Docker Hub
4. Podrás usar las imágenes en cualquier entorno

¡Tu pipeline de CI/CD está listo para usar! 🚀
## 🔧 SOLUC
IÓN PARA PROBLEMAS DE DOCKER

Si tienes problemas con permisos de Docker, sigue estos pasos:

### Pasos para el Desarrollador:

1. **Detén Jenkins actual:**
   ```bash
   docker-compose -f docker-compose.jenkins.yml down
   ```

2. **Limpia volúmenes (opcional, solo si quieres empezar limpio):**
   ```bash
   docker volume prune
   ```

3. **Levanta la nueva configuración con Docker-in-Docker:**
   ```bash
   docker-compose -f docker-compose.jenkins.yml up -d
   ```

4. **Verifica que ambos contenedores estén corriendo:**
   ```bash
   docker ps
   ```
   Deberías ver `jenkins-server` y `docker-dind` corriendo.

5. **Espera unos minutos para que Jenkins termine de inicializar**

6. **Accede a Jenkins en http://localhost:8081**

7. **Ejecuta el pipeline - ahora debería funcionar sin problemas de permisos**

### ¿Qué cambió?

- **Docker-in-Docker (DinD)**: Jenkins ahora usa su propio daemon de Docker
- **Sin problemas de permisos**: No depende del Docker del host
- **Más seguro**: Aislamiento completo entre Jenkins y el host
- **Instalación automática**: El pipeline instala Docker CLI y Node.js automáticamente

### Verificación:

Una vez que el pipeline corra exitosamente, verifica en Docker Hub que las imágenes se subieron:
- `tu_usuario/reminders-backend:latest`
- `tu_usuario/reminders-frontend:latest`

¡Esta configuración debería resolver definitivamente los problemas de permisos! 🎯