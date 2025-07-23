describe('Dashboard', () => {
  beforeEach(() => {
    cy.mockApiResponses();
    cy.login();
    cy.goToDashboard();
  });

  describe('Basic Layout', () => {
    it('should display dashboard correctly', () => {
      // Check app bar
      cy.get('[role="banner"]').should('be.visible'); // AppBar
      cy.contains('Reminders').should('be.visible');
      
      // Check user menu
      cy.get('[aria-label="account of current user"]').should('be.visible');
      
      // Check refresh button
      cy.get('[aria-label="refresh"]').should('be.visible');
      
      // Check FAB
      cy.get('[aria-label="add reminder"]').should('be.visible');
    });

    it('should handle refresh functionality', () => {
      cy.get('[aria-label="refresh"]').click();
      
      // Should trigger API call
      cy.wait('@getReminders');
    });
  });

  describe('Reminders Display', () => {
    it('should load and display reminders', () => {
      cy.wait('@getReminders');
      
      // Check reminders are displayed
      cy.contains('Complete project documentation').should('be.visible');
      cy.contains('Buy groceries').should('be.visible');
      cy.contains('Schedule dentist appointment').should('be.visible');
    });
  });

  describe('Add Reminder', () => {
    it('should open add reminder form when FAB is clicked', () => {
      cy.get('[aria-label="add reminder"]').click();
      
      // Check form is displayed
      cy.get('[data-testid="add-reminder-form"]').should('be.visible');
    });
  });

  describe('Offline Indicator', () => {
    it('should show offline indicator when offline', () => {
      // Simulate offline state
      cy.window().then((win) => {
        // Mock navigator.onLine
        cy.stub(win.navigator, 'onLine').value(false);
        
        // Trigger online/offline event
        win.dispatchEvent(new Event('offline'));
      });
      
      // Check offline indicator
      cy.contains('Offline').should('be.visible');
      cy.get('[data-testid="offline-icon"]').should('be.visible');
    });
  });
});