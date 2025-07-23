// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- Authentication Commands --

/**
 * Login command that handles the authentication flow
 * @param {string} username - Username for login
 * @param {string} password - Password for login
 */
Cypress.Commands.add('login', (username = 'admin', password = 'admin') => {
  cy.session([username, password], () => {
    // Setup API mocks before visiting login page
    cy.mockApiResponses();
    
    cy.visit('/login');
    
    // Fill login form
    cy.get('#username').type(username);
    cy.get('#password').type(password);
    
    // Submit form
    cy.get('.login-button').click();
    
    // Wait for login API call to complete
    cy.wait('@login');
    
    // Wait for successful login - check URL first
    cy.url().should('not.include', '/login');
    cy.url().should('include', '/dashboard');
    
    // Wait for any authentication loading states to complete
    cy.get('[data-testid="loading"]', { timeout: 5000 }).should('not.exist');
    cy.get('[data-testid="auth-loading"]', { timeout: 5000 }).should('not.exist');
    
    // Wait for dashboard to load with increased timeout and better error handling
    cy.get('[data-testid="dashboard"]', { timeout: 25000 }).should('exist').should('be.visible');
    
    // Wait for app bar to be visible (indicates full page load)
    cy.get('[role="banner"]', { timeout: 10000 }).should('be.visible');
    
    // Wait for main content to be ready
    cy.get('main', { timeout: 10000 }).should('exist');
    
    // Additional wait for Redux state to initialize
    cy.wait(1000);
  });
});

/**
 * Logout command
 */
Cypress.Commands.add('logout', () => {
  cy.get('[aria-label="account of current user"]').click();
  cy.contains('Logout').click();
  cy.url().should('include', '/login');
});

// -- Navigation Commands --

/**
 * Navigate to dashboard
 */
Cypress.Commands.add('goToDashboard', () => {
  cy.visit('/dashboard');
  
  // Wait for any loading states to complete
  cy.get('[data-testid="loading"]', { timeout: 5000 }).should('not.exist');
  cy.get('[data-testid="auth-loading"]', { timeout: 5000 }).should('not.exist');
  
  // Wait for dashboard to load - be more flexible about the selector
  cy.get('[data-testid="dashboard"]', { timeout: 15000 }).should('exist').should('be.visible');
  
  // Wait for app bar to be visible (this is more reliable)
  cy.get('[role="banner"]', { timeout: 10000 }).should('be.visible');
  
  // Wait for the main content area to be ready
  cy.get('main', { timeout: 10000 }).should('exist');
  
  // Additional wait for React to fully render
  cy.wait(500);
});

// -- Reminder Commands --

/**
 * Create a new reminder
 * @param {Object} reminderData - Reminder data
 */
Cypress.Commands.add('createReminder', (reminderData = {}) => {
  const defaultData = {
    title: 'Test Reminder',
    description: 'This is a test reminder',
    priority: 'MEDIUM',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
  };
  
  const data = { ...defaultData, ...reminderData };
  
  // Click FAB to open form
  cy.get('[aria-label="add reminder"]').click();
  
  // Fill form
  cy.get('[data-testid="reminder-title"]').type(data.title);
  cy.get('[data-testid="reminder-description"]').type(data.description);
  
  // Set priority if different from default
  if (data.priority !== 'MEDIUM') {
    cy.get('[data-testid="reminder-priority"]').click();
    cy.contains(data.priority).click();
  }
  
  // Set due date
  cy.get('[data-testid="reminder-due-date"]').type(data.dueDate);
  
  // Submit form
  cy.get('[data-testid="save-reminder"]').click();
  
  // Wait for form to close
  cy.get('[data-testid="add-reminder-form"]').should('not.exist');
});

/**
 * Toggle reminder completion
 * @param {string} reminderTitle - Title of the reminder to toggle
 */
Cypress.Commands.add('toggleReminderCompletion', (reminderTitle) => {
  cy.contains('[data-testid="reminder-item"]', reminderTitle)
    .find('[data-testid="toggle-completion"]')
    .click();
});

/**
 * Delete reminder
 * @param {string} reminderTitle - Title of the reminder to delete
 */
Cypress.Commands.add('deleteReminder', (reminderTitle) => {
  cy.contains('[data-testid="reminder-item"]', reminderTitle)
    .find('[data-testid="delete-reminder"]')
    .click();
  
  // Confirm deletion
  cy.get('[data-testid="confirm-delete"]').click();
});

// -- UI Helper Commands --

/**
 * Wait for loading to complete
 */
Cypress.Commands.add('waitForLoading', () => {
  cy.get('[data-testid="loading"]', { timeout: 1000 }).should('not.exist');
});

/**
 * Check if element is visible in viewport
 */
Cypress.Commands.add('isInViewport', { prevSubject: true }, (subject) => {
  cy.wrap(subject).should('be.visible');
  cy.window().then((win) => {
    const rect = subject[0].getBoundingClientRect();
    expect(rect.top).to.be.at.least(0);
    expect(rect.left).to.be.at.least(0);
    expect(rect.bottom).to.be.at.most(win.innerHeight);
    expect(rect.right).to.be.at.most(win.innerWidth);
  });
});

/**
 * Test responsive behavior
 */
Cypress.Commands.add('testResponsive', (callback) => {
  const viewports = [
    { width: 375, height: 667, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1280, height: 720, name: 'desktop' },
  ];
  
  viewports.forEach((viewport) => {
    cy.viewport(viewport.width, viewport.height);
    cy.log(`Testing on ${viewport.name} (${viewport.width}x${viewport.height})`);
    callback(viewport);
  });
});

// -- API Commands --

/**
 * Mock API responses
 */
Cypress.Commands.add('mockApiResponses', () => {
  // Mock authentication endpoint with proper response
  cy.intercept('POST', '/api/authenticate', {
    statusCode: 200,
    body: {
      id_token: 'eyJhbGciOiJIUzUxMiJ9.mock-jwt-token',
      user: {
        id: 1,
        login: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@localhost',
        authorities: ['ROLE_ADMIN', 'ROLE_USER']
      }
    }
  }).as('login');
  
  // Mock user account endpoint
  cy.intercept('GET', '/api/account', {
    statusCode: 200,
    body: {
      id: 1,
      login: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@localhost',
      authorities: ['ROLE_ADMIN', 'ROLE_USER']
    }
  }).as('getUser');
  
  // Mock reminders endpoint with test data
  cy.intercept('GET', '/api/reminders*', {
    statusCode: 200,
    fixture: 'reminders.json'
  }).as('getReminders');
  
  // Mock other endpoints
  cy.intercept('POST', '/api/reminders', { 
    statusCode: 201,
    body: {
      id: 1,
      title: 'Test Reminder',
      description: 'This is a test reminder',
      priority: 'MEDIUM',
      completed: false,
      createdDate: new Date().toISOString()
    }
  }).as('createReminder');
  
  cy.intercept('PUT', '/api/reminders/*', { 
    statusCode: 200,
    body: {
      id: 1,
      title: 'Updated Reminder',
      description: 'This is an updated reminder',
      priority: 'HIGH',
      completed: true,
      createdDate: new Date().toISOString()
    }
  }).as('updateReminder');
  
  cy.intercept('DELETE', '/api/reminders/*', { statusCode: 204 }).as('deleteReminder');
});

// -- Accessibility Commands --

/**
 * Tab navigation command
 */
Cypress.Commands.add('tab', { prevSubject: 'optional' }, (subject) => {
  if (subject) {
    cy.wrap(subject).trigger('keydown', { key: 'Tab' });
  } else {
    cy.get('body').trigger('keydown', { key: 'Tab' });
  }
});

/**
 * Check basic accessibility
 */
Cypress.Commands.add('checkA11y', () => {
  // Basic keyboard navigation test
  cy.get('body').tab();
  cy.focused().should('exist');
  
  // Check for proper ARIA labels
  cy.get('[aria-label]').should('have.length.greaterThan', 0);
  
  // Check for proper heading structure
  cy.get('h1, h2, h3, h4, h5, h6').should('exist');
});

// -- PWA Commands --

/**
 * Test offline functionality
 */
Cypress.Commands.add('goOffline', () => {
  cy.window().then((win) => {
    win.navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  });
  
  // Simulate offline
  cy.window().its('navigator').invoke('setOnline', false);
});

/**
 * Test online functionality
 */
Cypress.Commands.add('goOnline', () => {
  cy.window().its('navigator').invoke('setOnline', true);
});