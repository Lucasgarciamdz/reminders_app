describe('PWA Functionality', () => {
  beforeEach(() => {
    cy.mockApiResponses();
    cy.login();
    cy.goToDashboard();
  });

  describe('Service Worker', () => {
    it('should register service worker', () => {
      cy.window().then((win) => {
        expect(win.navigator.serviceWorker).to.exist;
        
        return win.navigator.serviceWorker.ready.then((registration) => {
          expect(registration).to.exist;
          expect(registration.active).to.exist;
        });
      });
    });

    it('should cache resources for offline use', () => {
      // Check that main resources are cached
      cy.window().then((win) => {
        return win.caches.keys().then((cacheNames) => {
          expect(cacheNames.length).to.be.greaterThan(0);
        });
      });
    });
  });

  describe('Offline Functionality', () => {
    it('should show offline indicator when offline', () => {
      // Simulate going offline
      cy.window().then((win) => {
        // Mock navigator.onLine
        Object.defineProperty(win.navigator, 'onLine', {
          writable: true,
          value: false
        });
        
        // Dispatch offline event
        win.dispatchEvent(new Event('offline'));
      });
      
      // Check offline indicator appears
      cy.contains('Offline').should('be.visible');
      cy.get('[data-testid="offline-icon"]').should('be.visible');
    });

    it('should hide offline indicator when back online', () => {
      // First go offline
      cy.window().then((win) => {
        Object.defineProperty(win.navigator, 'onLine', {
          writable: true,
          value: false
        });
        win.dispatchEvent(new Event('offline'));
      });
      
      cy.contains('Offline').should('be.visible');
      
      // Then go back online
      cy.window().then((win) => {
        Object.defineProperty(win.navigator, 'onLine', {
          writable: true,
          value: true
        });
        win.dispatchEvent(new Event('online'));
      });
      
      // Offline indicator should disappear
      cy.contains('Offline').should('not.exist');
    });

    it('should queue actions when offline', () => {
      // Go offline
      cy.window().then((win) => {
        Object.defineProperty(win.navigator, 'onLine', {
          writable: true,
          value: false
        });
        win.dispatchEvent(new Event('offline'));
      });
      
      // Try to create a reminder while offline
      cy.get('[aria-label="add reminder"]').click();
      cy.get('[data-testid="reminder-title"]').type('Offline Reminder');
      cy.get('[data-testid="reminder-description"]').type('Created while offline');
      cy.get('[data-testid="save-reminder"]').click();
      
      // Should show queued message or similar feedback
      cy.contains('Queued for sync').should('be.visible');
    });
  });

  describe('App Manifest', () => {
    it('should have proper manifest configuration', () => {
      cy.request('/manifest.json').then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('name');
        expect(response.body).to.have.property('short_name');
        expect(response.body).to.have.property('start_url');
        expect(response.body).to.have.property('display');
        expect(response.body).to.have.property('theme_color');
        expect(response.body).to.have.property('background_color');
        expect(response.body).to.have.property('icons');
      });
    });
  });

  describe('Install Prompt', () => {
    it('should show install prompt when available', () => {
      // Mock beforeinstallprompt event
      cy.window().then((win) => {
        const mockEvent = new Event('beforeinstallprompt');
        mockEvent.preventDefault = cy.stub();
        mockEvent.prompt = cy.stub().resolves({ outcome: 'accepted' });
        
        win.dispatchEvent(mockEvent);
      });
      
      // Check if install prompt component appears
      cy.get('[data-testid="pwa-install-prompt"]').should('be.visible');
    });

    it('should handle install prompt acceptance', () => {
      // Mock beforeinstallprompt event
      cy.window().then((win) => {
        const mockEvent = new Event('beforeinstallprompt');
        mockEvent.preventDefault = cy.stub();
        mockEvent.prompt = cy.stub().resolves({ outcome: 'accepted' });
        
        // Store event on window for component to access
        win.deferredPrompt = mockEvent;
        win.dispatchEvent(mockEvent);
      });
      
      // Click install button if prompt is shown
      cy.get('[data-testid="install-app-button"]').click();
      
      // Verify prompt was called
      cy.window().then((win) => {
        expect(win.deferredPrompt.prompt).to.have.been.called;
      });
    });
  });

  describe('Background Sync', () => {
    it('should sync data when coming back online', () => {
      // Start offline
      cy.window().then((win) => {
        Object.defineProperty(win.navigator, 'onLine', {
          writable: true,
          value: false
        });
        win.dispatchEvent(new Event('offline'));
      });
      
      // Create reminder offline (this would be queued)
      cy.get('[aria-label="add reminder"]').click();
      cy.get('[data-testid="reminder-title"]').type('Sync Test Reminder');
      cy.get('[data-testid="save-reminder"]').click();
      
      // Go back online
      cy.window().then((win) => {
        Object.defineProperty(win.navigator, 'onLine', {
          writable: true,
          value: true
        });
        win.dispatchEvent(new Event('online'));
      });
      
      // Should trigger sync and API call
      cy.wait('@createReminder');
    });
  });

  describe('Local Storage', () => {
    it('should persist data in local storage', () => {
      cy.window().then((win) => {
        // Check that app uses localStorage/IndexedDB
        expect(win.localStorage).to.exist;
        
        // Check for app-specific storage keys
        const keys = Object.keys(win.localStorage);
        expect(keys.some(key => key.includes('reminders') || key.includes('auth'))).to.be.true;
      });
    });

    it('should restore data from local storage on reload', () => {
      // Create a reminder
      cy.get('[aria-label="add reminder"]').click();
      cy.get('[data-testid="reminder-title"]').type('Persistence Test');
      cy.get('[data-testid="save-reminder"]').click();
      
      // Reload page
      cy.reload();
      
      // Data should still be available (from cache or storage)
      cy.contains('Persistence Test').should('be.visible');
    });
  });

  describe('Performance', () => {
    it('should load quickly on subsequent visits', () => {
      // First visit (already loaded)
      const startTime = Date.now();
      
      // Reload page
      cy.reload();
      
      // Should load quickly due to caching
      cy.get('[data-testid="dashboard"]').should('be.visible');
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(3000); // Should load in under 3 seconds
      });
    });

    it('should work with slow network conditions', () => {
      // Simulate slow network
      cy.intercept('GET', '/api/reminders*', { 
        delay: 2000,
        fixture: 'reminders.json' 
      }).as('slowReminders');
      
      cy.reload();
      
      // Should show loading state
      cy.get('[data-testid="loading"]').should('be.visible');
      
      cy.wait('@slowReminders');
      
      // Should eventually load
      cy.contains('Your Reminders').should('be.visible');
    });
  });

  describe('Mobile Experience', () => {
    it('should provide native-like experience on mobile', () => {
      cy.viewport(375, 667); // iPhone SE viewport
      
      // Check mobile-optimized layout
      cy.get('[aria-label="add reminder"]').should('be.visible');
      cy.get('[aria-label="menu"]').should('be.visible');
      
      // Test touch interactions
      cy.get('[aria-label="add reminder"]').click();
      cy.get('[data-testid="add-reminder-form"]').should('be.visible');
      
      // Test swipe-like interactions (if implemented)
      cy.get('[data-testid="reminder-item"]').first().trigger('touchstart');
    });

    it('should handle orientation changes', () => {
      // Portrait
      cy.viewport(375, 667);
      cy.contains('Reminders').should('be.visible');
      
      // Landscape
      cy.viewport(667, 375);
      cy.contains('Reminders').should('be.visible');
      
      // Layout should adapt
      cy.get('[aria-label="add reminder"]').should('be.visible');
    });
  });
});