describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.mockApiResponses();
  });

  describe('Login Page', () => {
    it('should display login form correctly', () => {
      cy.visit('/login');

      // Check page elements
      cy.contains('Sign In').should('be.visible');
      cy.contains('Welcome back! Please sign in to your account.').should('be.visible');

      // Check form fields
      cy.get('#username').should('be.visible');
      cy.get('#password').should('be.visible');
      cy.get('.login-button').should('be.visible');
      cy.get('input[type="checkbox"]').should('be.visible'); // Remember me

      // Check register link
      cy.contains('Sign up here').should('be.visible');
    });

    it('should show validation errors for empty fields', () => {
      cy.visit('/login');

      // Try to submit empty form
      cy.get('.login-button').click();

      // Check validation messages
      cy.contains('Username is required').should('be.visible');
      cy.contains('Password is required').should('be.visible');
    });

    it('should show validation errors for short inputs', () => {
      cy.visit('/login');

      // Enter short username and password
      cy.get('#username').type('ab');
      cy.get('#password').type('123');
      cy.get('.login-button').click();

      // Check validation messages
      cy.contains('Username must be at least 3 characters').should('be.visible');
      cy.contains('Password must be at least 4 characters').should('be.visible');
    });

    it('should successfully login with valid credentials', () => {
      cy.visit('/login');

      // Fill form with valid credentials
      cy.get('#username').type(Cypress.env('TEST_USERNAME'));
      cy.get('#password').type(Cypress.env('TEST_PASSWORD'));

      // Submit form
      cy.get('.login-button').click();

      // Wait for API call
      cy.wait('@login');

      // Should redirect to dashboard
      cy.url().should('not.include', '/login');
      cy.url().should('include', '/dashboard');
    });

    it('should handle remember me checkbox', () => {
      cy.visit('/login');

      // Check remember me
      cy.get('input[type="checkbox"]').check();
      cy.get('input[type="checkbox"]').should('be.checked');

      // Uncheck remember me
      cy.get('input[type="checkbox"]').uncheck();
      cy.get('input[type="checkbox"]').should('not.be.checked');
    });

    it('should show loading state during login', () => {
      cy.visit('/login');

      // Intercept with delay to see loading state
      cy.intercept('POST', '/api/authenticate', {
        delay: 1000,
        fixture: 'auth-success.json'
      }).as('slowLogin');

      cy.get('#username').type(Cypress.env('TEST_USERNAME'));
      cy.get('#password').type(Cypress.env('TEST_PASSWORD'));
      cy.get('.login-button').click();

      // Check loading state
      cy.get('.loading-spinner').should('be.visible');
      cy.contains('Signing in...').should('be.visible');
      cy.get('.login-button').should('be.disabled');

      cy.wait('@slowLogin');
    });
  });

  describe('Authentication State', () => {
    it('should redirect to login when not authenticated', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });

    it('should redirect to dashboard when already authenticated', () => {
      // Login first
      cy.login();

      // Try to visit login page
      cy.visit('/login');

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
    });

    it('should maintain authentication across page refreshes', () => {
      cy.login();
      cy.goToDashboard();

      // Refresh page
      cy.reload();

      // Should still be authenticated
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="dashboard"]').should('exist');
    });
  });

  describe('Logout', () => {
    beforeEach(() => {
      cy.login();
      cy.goToDashboard();
    });

    it('should successfully logout', () => {
      // Click user menu
      cy.get('[aria-label="account of current user"]').click();

      // Check menu items
      cy.get('[role="menu"]').should('be.visible');
      cy.contains('Logout').should('be.visible');

      // Logout
      cy.contains('Logout').click();

      // Should redirect to login
      cy.url().should('include', '/login');
    });
  });

  describe('Responsive Design', () => {
    it('should work correctly on mobile devices', () => {
      cy.testResponsive((viewport) => {
        cy.visit('/login');

        // Check form is still usable
        cy.get('#username').should('be.visible');
        cy.get('#password').should('be.visible');
        cy.get('.login-button').should('be.visible');

        if (viewport.name === 'mobile') {
          // Check mobile-specific behavior
          cy.get('.login-card').should('have.css', 'width');
        }
      });
    });
  });
});