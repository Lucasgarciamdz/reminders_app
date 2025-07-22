# Jenkins CI/CD Setup Guide

## Archivos Creados

1. **`Jenkinsfile`** - Pipeline de Jenkins para CI/CD
2. **`backend/Dockerfile`** - Imagen Docker para el backend (Spring Boot)
3. **`frontend/Dockerfile`** - Imagen Docker para el frontend (React PWA)
4. **`docker-compose.yml`** - Configuración para ejecutar toda la aplicación

## Configuración Requerida en Jenkins

### 1. Instalar Plugins Necesarios
- Docker Pipeline Plugin
- Git Plugin
- Pipeline Plugin

### 2. Configurar Credenciales de DockerHub
1. Ve a "Manage Jenkins" → "Manage Credentials"
2. Agrega nuevas credenciales:
   - **ID**: `dockerhub-credentials`
   - **Type**: Username with password
   - **Username**: Tu usuario de DockerHub
   - **Password**: Tu token de DockerHub

### 3. Actualizar Variables en el Jenkinsfile
Edita el `Jenkinsfile` y cambia:
```groovy
BACKEND_IMAGE = "tu-usuario-dockerhub/reminders-backend"
FRONTEND_IMAGE = "tu-usuario-dockerhub/reminders-frontend"
```

### 4. Crear el Job en Jenkins
1. New Item → Pipeline
2. En "Pipeline" section, selecciona "Pipeline script from SCM"
3. Configura tu repositorio Git
4. Especifica "Jenkinsfile" como Script Path

## Comandos para Probar Localmente

### Construir las imágenes:
```bash
# Backend
cd backend
docker build -t reminders-backend .

# Frontend
cd ../frontend
docker build -t reminders-frontend .
```

### Ejecutar con docker-compose:
```bash
# Desde la raíz del proyecto
docker-compose up -d
```

### Acceder a la aplicación:
- Frontend: http://localhost
- Backend API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui/

## Notas Importantes

1. **Seguridad**: Las credenciales están configuradas para usar Jenkins credentials store
2. **Versionado**: Las imágenes se etiquetan con número de build + commit hash
3. **Limpieza**: El pipeline limpia imágenes locales después del push
4. **Multi-stage builds**: Optimiza el tamaño de las imágenes finales
5. **Health checks**: Incluidos en ambos Dockerfiles

## Próximos Pasos

1. Configura las credenciales de DockerHub en Jenkins
2. Actualiza los nombres de las imágenes en el Jenkinsfile
3. Crea el pipeline job en Jenkins
4. Haz un commit y push para activar el primer build

El pipeline se ejecutará automáticamente en cada push al repositorio y creará imágenes Docker actualizadas en DockerHub.