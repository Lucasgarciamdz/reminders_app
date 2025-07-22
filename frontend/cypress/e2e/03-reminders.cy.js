describe('Reminders Management', () => {
  beforeEach(() => {
    cy.mockApiResponses();
    cy.login();
    cy.goToDashboard();
    cy.wait('@getReminders');
  });

  describe('Reminder List', () => {
    it('should display all reminders correctly', () => {
      // Check all reminders are visible
      cy.contains('Complete project documentation').should('be.visible');
      cy.contains('Buy groceries').should('be.visible');
      cy.contains('Schedule dentist appointment').should('be.visible');
      
      // Check reminder details
      cy.contains('[data-testid="reminder-item"]', 'Complete project documentation').within(() => {
        cy.contains('Write comprehensive documentation').should('be.visible');
        cy.contains('HIGH').should('be.visible');
        cy.get('[data-testid="toggle-completion"]').should('exist');
        cy.get('[data-testid="delete-reminder"]').should('exist');
      });
    });

    it('should show different priority levels', () => {
      // Check HIGH priority
      cy.contains('[data-testid="reminder-item"]', 'Complete project documentation')
        .contains('HIGH').should('be.visible');
      
      // Check MEDIUM priority
      cy.contains('[data-testid="reminder-item"]', 'Buy groceries')
        .contains('MEDIUM').should('be.visible');
      
      // Check LOW priority
      cy.contains('[data-testid="reminder-item"]', 'Schedule dentist appointment')
        .contains('LOW').should('be.visible');
    });

    it('should show completion status correctly', () => {
      // Check completed reminder
      cy.contains('[data-testid="reminder-item"]', 'Buy groceries').within(() => {
        cy.get('[data-testid="toggle-completion"]').should('have.attr', 'aria-checked', 'true');
      });
      
      // Check incomplete reminders
      cy.contains('[data-testid="reminder-item"]', 'Complete project documentation').within(() => {
        cy.get('[data-testid="toggle-completion"]').should('have.attr', 'aria-checked', 'false');
      });
    });
  });

  describe('Toggle Completion', () => {
    it('should toggle reminder completion status', () => {
      // Toggle incomplete reminder to complete
      cy.contains('[data-testid="reminder-item"]', 'Complete project documentation')
        .find('[data-testid="toggle-completion"]')
        .click();
      
      cy.wait('@updateReminder');
      
      // Check visual feedback
      cy.contains('[data-testid="reminder-item"]', 'Complete project documentation').within(() => {
        cy.get('[data-testid="toggle-completion"]').should('have.attr', 'aria-checked', 'true');
      });
    });

    it('should handle toggle errors gracefully', () => {
      // Mock API error
      cy.intercept('PUT', '/api/reminders/*', { 
        statusCode: 500,
        body: { message: 'Update failed' }
      }).as('updateError');
      
      cy.contains('[data-testid="reminder-item"]', 'Complete project documentation')
        .find('[data-testid="toggle-completion"]')
        .click();
      
      cy.wait('@updateError');
      
      // Should show error message
      cy.get('[role="alert"]').should('be.visible');
    });
  });

  describe('Delete Reminder', () => {
    it('should delete reminder with confirmation', () => {
      // Click delete button
      cy.contains('[data-testid="reminder-item"]', 'Schedule dentist appointment')
        .find('[data-testid="delete-reminder"]')
        .click();
      
      // Confirm deletion
      cy.get('[data-testid="confirm-delete"]').click();
      
      cy.wait('@deleteReminder');
      
      // Reminder should be removed from list
      cy.contains('Schedule dentist appointment').should('not.exist');
    });

    it('should cancel deletion when user cancels', () => {
      // Click delete button
      cy.contains('[data-testid="reminder-item"]', 'Schedule dentist appointment')
        .find('[data-testid="delete-reminder"]')
        .click();
      
      // Cancel deletion
      cy.get('[data-testid="cancel-delete"]').click();
      
      // Reminder should still exist
      cy.contains('Schedule dentist appointment').should('be.visible');
    });
  });

  describe('Add New Reminder', () => {
    it('should open add reminder form', () => {
      cy.get('[aria-label="add reminder"]').click();
      
      // Check form is displayed
      cy.get('[data-testid="add-reminder-form"]').should('be.visible');
      cy.get('[data-testid="reminder-title"]').should('be.visible');
      cy.get('[data-testid="reminder-description"]').should('be.visible');
      cy.get('[data-testid="reminder-priority"]').should('be.visible');
      cy.get('[data-testid="reminder-due-date"]').should('be.visible');
    });

    it('should create new reminder successfully', () => {
      const newReminder = {
        title: 'Test Reminder from Cypress',
        description: 'This is a test reminder created during E2E testing',
        priority: 'HIGH'
      };
      
      // Open form
      cy.get('[aria-label="add reminder"]').click();
      
      // Fill form
      cy.get('[data-testid="reminder-title"]').type(newReminder.title);
      cy.get('[data-testid="reminder-description"]').type(newReminder.description);
      
      // Set priority
      cy.get('[data-testid="reminder-priority"]').click();
      cy.contains(newReminder.priority).click();
      
      // Set due date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];
      cy.get('[data-testid="reminder-due-date"]').type(dateString);
      
      // Submit form
      cy.get('[data-testid="save-reminder"]').click();
      
      cy.wait('@createReminder');
      
      // Form should close
      cy.get('[data-testid="add-reminder-form"]').should('not.exist');
      
      // New reminder should appear in list
      cy.contains(newReminder.title).should('be.visible');
    });

    it('should validate required fields', () => {
      // Open form
      cy.get('[aria-label="add reminder"]').click();
      
      // Try to submit empty form
      cy.get('[data-testid="save-reminder"]').click();
      
      // Check validation messages
      cy.contains('Title is required').should('be.visible');
    });

    it('should close form when cancel is clicked', () => {
      // Open form
      cy.get('[aria-label="add reminder"]').click();
      
      // Click cancel
      cy.get('[data-testid="cancel-reminder"]').click();
      
      // Form should close
      cy.get('[data-testid="add-reminder-form"]').should('not.exist');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no reminders exist', () => {
      // Mock empty reminders response
      cy.intercept('GET', '/api/reminders*', { body: [] }).as('emptyReminders');
      
      cy.reload();
      cy.wait('@emptyReminders');
      
      // Check empty state
      cy.contains('No reminders yet').should('be.visible');
      cy.contains('Create your first reminder').should('be.visible');
    });
  });

  describe('Search and Filter', () => {
    it('should filter reminders by completion status', () => {
      // Assuming filters component exists
      cy.get('[data-testid="filter-completed"]').click();
      
      // Should show only completed reminders
      cy.contains('Buy groceries').should('be.visible');
      cy.contains('Complete project documentation').should('not.exist');
    });

    it('should filter reminders by priority', () => {
      // Filter by HIGH priority
      cy.get('[data-testid="filter-priority"]').click();
      cy.contains('HIGH').click();
      
      // Should show only HIGH priority reminders
      cy.contains('Complete project documentation').should('be.visible');
      cy.contains('Buy groceries').should('not.exist');
    });
  });

  describe('Responsive Behavior', () => {
    it('should work correctly on mobile devices', () => {
      cy.testResponsive((viewport) => {
        // Check reminders are still visible and usable
        cy.contains('Complete project documentation').should('be.visible');
        
        // FAB should be accessible
        cy.get('[aria-label="add reminder"]').should('be.visible');
        
        if (viewport.name === 'mobile') {
          // Check mobile-specific layout
          cy.get('[data-testid="reminder-item"]').should('have.css', 'width');
        }
      });
    });
  });

  describe('Performance', () => {
    it('should handle large number of reminders', () => {
      // Mock large dataset
      const manyReminders = Array.from({ length: 50 }, (_, i) => ({
        id: i + 10,
        title: `Reminder ${i + 1}`,
        description: `Description for reminder ${i + 1}`,
        dueDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
        isCompleted: i % 3 === 0,
        priority: ['LOW', 'MEDIUM', 'HIGH'][i % 3],
        createdDate: new Date().toISOString(),
        lastModifiedDate: new Date().toISOString(),
        category: null,
        tags: []
      }));
      
      cy.intercept('GET', '/api/reminders*', { body: manyReminders }).as('manyReminders');
      
      cy.reload();
      cy.wait('@manyReminders');
      
      // Check that reminders are displayed
      cy.contains('Reminder 1').should('be.visible');
      cy.contains('50 reminders').should('be.visible');
    });
  });
});