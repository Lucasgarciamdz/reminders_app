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
  });

  describe('Performance', () => {
    it('should load quickly on subsequent visits', () => {
      // Reload page
      cy.reload();
      
      // Should load quickly due to caching
      cy.get('[data-testid="dashboard"]').should('be.visible');
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
});