# Cypress E2E Testing Setup

Se ha configurado Cypress para testing end-to-end del frontend React PWA. Esta configuración incluye tests completos para autenticación, dashboard, gestión de reminders y funcionalidad PWA.

## 📁 Estructura de Archivos Creados

```
frontend/
├── cypress.config.js              # Configuración principal de Cypress
├── cypress/
│   ├── e2e/                      # Tests end-to-end
│   │   ├── 01-auth.cy.js         # Tests de autenticación
│   │   ├── 02-dashboard.cy.js    # Tests del dashboard
│   │   ├── 03-reminders.cy.js    # Tests de gestión de reminders
│   │   └── 04-pwa.cy.js          # Tests de funcionalidad PWA
│   ├── fixtures/                 # Datos de prueba
│   │   ├── user.json             # Usuario de prueba
│   │   ├── reminders.json        # Reminders de prueba
│   │   ├── auth-success.json     # Respuesta de login exitoso
│   │   ├── reminder-created.json # Reminder creado
│   │   └── reminder-updated.json # Reminder actualizado
│   └── support/                  # Archivos de soporte
│       ├── e2e.js               # Configuración global E2E
│       ├── commands.js          # Comandos personalizados
│       └── component.js         # Configuración para component testing
├── tsconfig.json                 # Configuración TypeScript para Cypress
└── .gitignore                   # Actualizado con exclusiones de Cypress
```

## 🚀 Comandos Disponibles

### Instalar Dependencias
```bash
cd frontend
npm install
```

### Ejecutar Tests

#### Modo Interactivo (Recomendado para desarrollo)
```bash
npm run test:e2e:open
```
Este comando:
1. Inicia el servidor de desarrollo en http://localhost:3000
2. Abre la interfaz de Cypress para ejecutar tests interactivamente

#### Modo Headless (Para CI/CD)
```bash
npm run test:e2e
```
Este comando:
1. Inicia el servidor de desarrollo
2. Ejecuta todos los tests en modo headless
3. Genera videos y screenshots de los tests

#### Solo Cypress (servidor ya ejecutándose)
```bash
npm run cypress:open    # Modo interactivo
npm run cypress:run     # Modo headless
```

## 🧪 Tests Incluidos

### 1. Authentication Flow (`01-auth.cy.js`)
- ✅ Visualización correcta del formulario de login
- ✅ Validación de campos vacíos y cortos
- ✅ Login exitoso con credenciales válidas
- ✅ Funcionalidad "Remember me"
- ✅ Estados de carga durante login
- ✅ Redirección automática cuando ya está autenticado
- ✅ Logout funcional
- ✅ Diseño responsive

### 2. Dashboard (`02-dashboard.cy.js`)
- ✅ Layout y navegación correctos
- ✅ Información de usuario en menú
- ✅ Funcionalidad de refresh
- ✅ Carga y visualización de reminders
- ✅ Filtros de reminders
- ✅ Formulario de agregar reminder
- ✅ Indicador de offline
- ✅ Estados de carga
- ✅ Manejo de errores
- ✅ Diseño responsive
- ✅ Accesibilidad básica

### 3. Reminders Management (`03-reminders.cy.js`)
- ✅ Lista de reminders con detalles
- ✅ Diferentes niveles de prioridad
- ✅ Estados de completado
- ✅ Toggle de completado
- ✅ Eliminación con confirmación
- ✅ Creación de nuevos reminders
- ✅ Validación de formularios
- ✅ Estado vacío
- ✅ Búsqueda y filtros
- ✅ Comportamiento responsive
- ✅ Rendimiento con muchos reminders

### 4. PWA Functionality (`04-pwa.cy.js`)
- ✅ Registro de Service Worker
- ✅ Cache de recursos
- ✅ Funcionalidad offline
- ✅ Indicador de estado online/offline
- ✅ Cola de acciones offline
- ✅ Configuración del manifest
- ✅ Prompt de instalación
- ✅ Sincronización en background
- ✅ Persistencia en localStorage
- ✅ Rendimiento
- ✅ Experiencia móvil

## 🛠️ Comandos Personalizados

### Autenticación
```javascript
cy.login()                    // Login con credenciales por defecto
cy.login('user', 'pass')     // Login con credenciales específicas
cy.logout()                  // Logout
```

### Navegación
```javascript
cy.goToDashboard()           // Ir al dashboard
```

### Reminders
```javascript
cy.createReminder({          // Crear reminder
  title: 'Mi Reminder',
  description: 'Descripción',
  priority: 'HIGH'
})
cy.toggleReminderCompletion('Título') // Toggle completado
cy.deleteReminder('Título')           // Eliminar reminder
```

### Utilidades
```javascript
cy.waitForLoading()          // Esperar que termine la carga
cy.testResponsive(callback)  // Probar en diferentes viewports
cy.checkA11y()              // Verificar accesibilidad básica
cy.mockApiResponses()       // Mock de respuestas API
```

## ⚙️ Configuración

### Variables de Entorno
Las siguientes variables están configuradas en `cypress.config.js`:
- `TEST_USERNAME`: 'admin' (usuario de prueba)
- `TEST_PASSWORD`: 'admin' (contraseña de prueba)
- `API_URL`: 'http://localhost:8080/api' (URL del backend)

### Interceptores API
Los tests usan interceptores para mockear las respuestas del backend:
- `GET /api/account` → `fixtures/user.json`
- `GET /api/reminders` → `fixtures/reminders.json`
- `POST /api/authenticate` → `fixtures/auth-success.json`
- `POST /api/reminders` → `fixtures/reminder-created.json`
- `PUT /api/reminders/*` → `fixtures/reminder-updated.json`
- `DELETE /api/reminders/*` → respuesta vacía

## 🎯 Data Attributes Requeridos

Para que los tests funcionen correctamente, asegúrate de que los componentes tengan estos atributos:

```jsx
// Dashboard
<div data-testid="dashboard">
<div data-testid="loading">
<div data-testid="offline-icon">

// Reminders
<div data-testid="reminder-item">
<button data-testid="toggle-completion">
<button data-testid="delete-reminder">
<div data-testid="reminder-filters">

// Add Reminder Form
<div data-testid="add-reminder-form">
<input data-testid="reminder-title">
<textarea data-testid="reminder-description">
<select data-testid="reminder-priority">
<input data-testid="reminder-due-date">
<button data-testid="save-reminder">
<button data-testid="cancel-reminder">

// Delete Confirmation
<button data-testid="confirm-delete">
<button data-testid="cancel-delete">

// PWA
<div data-testid="pwa-install-prompt">
<button data-testid="install-app-button">
```

## 🔧 Personalización

### Agregar Nuevos Tests
1. Crea un nuevo archivo en `cypress/e2e/`
2. Usa el patrón `##-nombre.cy.js` para mantener el orden
3. Importa comandos personalizados si es necesario

### Modificar Datos de Prueba
Edita los archivos en `cypress/fixtures/` para cambiar los datos de prueba.

### Agregar Comandos Personalizados
Agrega nuevos comandos en `cypress/support/commands.js`.

## 🚨 Notas Importantes

1. **Backend**: Los tests asumen que el backend está disponible en `http://localhost:8080`
2. **Credenciales**: Usuario de prueba por defecto es `admin/admin`
3. **Data Attributes**: Asegúrate de agregar los `data-testid` necesarios en los componentes
4. **Responsive**: Los tests incluyen verificaciones responsive automáticas
5. **PWA**: Los tests de PWA requieren que la aplicación esté configurada como PWA

## 📊 Ejecución en CI/CD

Para integrar en CI/CD, usa:
```bash
npm run test:e2e
```

Este comando es ideal para pipelines ya que:
- Inicia el servidor automáticamente
- Ejecuta tests en modo headless
- Genera artifacts (videos/screenshots)
- Retorna códigos de salida apropiados

## 🎉 ¡Listo para Usar!

Los tests están listos para ejecutarse. Simplemente:
1. Instala las dependencias: `npm install`
2. Ejecuta: `npm run test:e2e:open`
3. Selecciona y ejecuta los tests en la interfaz de Cypress

¡Happy Testing! 🧪✨