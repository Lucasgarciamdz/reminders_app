describe('Reminders Management', () => {
  beforeEach(() => {
    cy.mockApiResponses();
    cy.login();
    cy.goToDashboard();
  });

  describe('Basic Functionality', () => {
    it('should display reminders list', () => {
      cy.wait('@getReminders');
      
      // Check that reminders are displayed
      cy.get('[data-testid="reminder-item"]').should('have.length.at.least', 1);
      
      // Check basic reminder content
      cy.contains('Complete project documentation').should('be.visible');
      cy.contains('Buy groceries').should('be.visible');
      cy.contains('Schedule dentist appointment').should('be.visible');
    });

    it('should open add reminder form', () => {
      cy.get('[aria-label="add reminder"]').click();
      
      // Check form is displayed
      cy.get('[data-testid="add-reminder-form"]').should('be.visible');
      cy.get('[data-testid="reminder-title"]').should('be.visible');
      cy.get('[data-testid="reminder-description"]').should('be.visible');
      cy.get('[data-testid="save-reminder"]').should('be.visible');
      cy.get('[data-testid="cancel-reminder"]').should('be.visible');
    });

    it('should close add reminder form when cancel is clicked', () => {
      cy.get('[aria-label="add reminder"]').click();
      cy.get('[data-testid="add-reminder-form"]').should('be.visible');
      
      cy.get('[data-testid="cancel-reminder"]').click();
      cy.get('[data-testid="add-reminder-form"]').should('not.exist');
    });

    it('should validate required fields', () => {
      cy.get('[aria-label="add reminder"]').click();
      
      // Try to save without filling required fields
      cy.get('[data-testid="save-reminder"]').click();
      
      // Should show validation errors or prevent submission
      cy.get('[data-testid="add-reminder-form"]').should('be.visible');
    });
  });

  describe('Display Features', () => {
    it('should show different priority levels', () => {
      cy.wait('@getReminders');
      
      // Check priority indicators exist
      cy.contains('HIGH').should('be.visible');
      cy.contains('MEDIUM').should('be.visible');
      cy.contains('LOW').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should work correctly on mobile devices', () => {
      cy.viewport(375, 667); // Mobile viewport
      cy.wait('@getReminders');
      
      // FAB should be visible
      cy.get('[aria-label="add reminder"]').should('be.visible');
      
      // Reminders should be displayed
      cy.get('[data-testid="reminder-item"]').should('be.visible');
      
      // Mobile menu should be available
      cy.get('[aria-label="menu"]').should('be.visible');
    });
  });

  describe('Performance', () => {
    it('should handle large number of reminders', () => {
      // Mock large dataset
      const largeRemindersList = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        title: `Reminder ${i + 1}`,
        description: `Description for reminder ${i + 1}`,
        priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][i % 4],
        completed: i % 3 === 0,
        dueDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString()
      }));
      
      cy.intercept('GET', '/api/reminders*', { 
        statusCode: 200,
        body: { 
          content: largeRemindersList,
          totalElements: largeRemindersList.length
        }
      }).as('largeReminders');
      
      cy.reload();
      cy.wait('@largeReminders');
      
      // Should render without performance issues
      cy.get('[data-testid="reminder-item"]').should('have.length.at.least', 10);
      
      // Should be responsive
      cy.get('[aria-label="add reminder"]').should('be.visible');
    });
  });
});