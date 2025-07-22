describe('Dashboard', () => {
  beforeEach(() => {
    cy.mockApiResponses();
    cy.login();
    cy.goToDashboard();
  });

  describe('Layout and Navigation', () => {
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

    it('should show user information in menu', () => {
      cy.get('[aria-label="account of current user"]').click();
      
      // Check user info is displayed
      cy.get('[role="menu"]').within(() => {
        cy.contains('Admin').should('be.visible'); // User's first name
        cy.contains('Logout').should('be.visible');
      });
      
      // Close menu by clicking outside
      cy.get('body').click(0, 0);
      cy.get('[role="menu"]').should('not.exist');
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
      cy.contains('Your Reminders').should('be.visible');
      cy.contains('Complete project documentation').should('be.visible');
      cy.contains('Buy groceries').should('be.visible');
      cy.contains('Schedule dentist appointment').should('be.visible');
      
      // Check reminder count
      cy.contains('3 reminders').should('be.visible');
    });

    it('should show reminder details correctly', () => {
      cy.wait('@getReminders');
      
      // Check first reminder details
      cy.contains('[data-testid="reminder-item"]', 'Complete project documentation').within(() => {
        cy.contains('Write comprehensive documentation').should('be.visible');
        cy.contains('HIGH').should('be.visible');
        cy.get('[data-testid="toggle-completion"]').should('exist');
      });
    });

    it('should display completed and pending counts', () => {
      cy.wait('@getReminders');
      
      // Check summary stats
      cy.contains('1').should('be.visible'); // Completed count
      cy.contains('Completed').should('be.visible');
      cy.contains('2').should('be.visible'); // Pending count
      cy.contains('Pending').should('be.visible');
    });
  });

  describe('Filters', () => {
    it('should display filter options', () => {
      cy.wait('@getReminders');
      
      // Check if filters component exists
      cy.get('[data-testid="reminder-filters"]').should('exist');
    });

    it('should handle clear filters functionality', () => {
      cy.wait('@getReminders');
      
      // Click clear filters button (debug button)
      cy.contains('Clear Filters').click();
      
      // Should trigger reminders reload
      cy.wait('@getReminders');
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

  describe('Loading States', () => {
    it('should show loading state when fetching reminders', () => {
      // Intercept with delay
      cy.intercept('GET', '/api/reminders*', { 
        delay: 1000,
        fixture: 'reminders.json' 
      }).as('slowReminders');
      
      cy.reload();
      
      // Check loading state
      cy.get('[data-testid="loading"]').should('be.visible');
      
      cy.wait('@slowReminders');
      cy.get('[data-testid="loading"]').should('not.exist');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      // Mock API error
      cy.intercept('GET', '/api/reminders*', { 
        statusCode: 500,
        body: { message: 'Internal Server Error' }
      }).as('errorReminders');
      
      cy.reload();
      cy.wait('@errorReminders');
      
      // Check error message is displayed
      cy.get('[role="alert"]').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to different screen sizes', () => {
      cy.testResponsive((viewport) => {
        cy.wait('@getReminders');
        
        if (viewport.name === 'mobile') {
          // Check mobile-specific elements
          cy.get('[aria-label="menu"]').should('be.visible'); // Mobile menu icon
        }
        
        // FAB should always be visible
        cy.get('[aria-label="add reminder"]').should('be.visible');
        
        // App title should be visible
        cy.contains('Reminders').should('be.visible');
      });
    });

    it('should handle mobile navigation', () => {
      cy.viewport(375, 667); // Mobile viewport
      cy.wait('@getReminders');
      
      // Check mobile menu icon exists
      cy.get('[aria-label="menu"]').should('be.visible');
      
      // User menu should still work
      cy.get('[aria-label="account of current user"]').click();
      cy.get('[role="menu"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should meet basic accessibility requirements', () => {
      cy.wait('@getReminders');
      
      // Check ARIA labels
      cy.get('[aria-label="add reminder"]').should('exist');
      cy.get('[aria-label="account of current user"]').should('exist');
      
      // Check keyboard navigation
      cy.checkA11y();
    });

    it('should support keyboard navigation', () => {
      cy.wait('@getReminders');
      
      // Test tab navigation
      cy.get('body').tab();
      cy.focused().should('exist');
      
      // Test FAB keyboard access
      cy.get('[aria-label="add reminder"]').focus().should('be.focused');
      cy.get('[aria-label="add reminder"]').type('{enter}');
      cy.get('[data-testid="add-reminder-form"]').should('be.visible');
    });
  });
});