// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from command log to reduce noise
const app = window.top;
if (!app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML = '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // for certain expected errors in development
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  return true;
});

// Custom assertions
chai.use((chai, utils) => {
  chai.Assertion.addMethod('beVisible', function () {
    const obj = this._obj;
    this.assert(
      obj.should('be.visible'),
      'expected #{this} to be visible',
      'expected #{this} not to be visible'
    );
  });
});

// Global before hook
beforeEach(() => {
  // Clear localStorage and sessionStorage before each test
  cy.clearLocalStorage();
  cy.clearCookies();
  
  // Set up viewport for consistent testing
  cy.viewport(1280, 720);
  
  // Intercept common API calls
  cy.intercept('GET', '/api/account', { fixture: 'user.json' }).as('getAccount');
  cy.intercept('GET', '/api/reminders*', { fixture: 'reminders.json' }).as('getReminders');
});