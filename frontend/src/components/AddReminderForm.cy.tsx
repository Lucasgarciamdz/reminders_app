/// <reference path="../../cypress/support/component.d.ts" />

import React from 'react'
import AddReminderForm from './AddReminderForm'
import { store } from '@/store';

describe('<AddReminderForm />', () => {
  it('mounts and displays form elements when form is open', () => {
    // Mount with Redux state that shows the form
    cy.mountWithProviders(<AddReminderForm />, {
      reduxState: {
        ui: {
          showAddForm: true,
          notifications: []
        },
        reminders: {
          items: [],
          loading: false,
          error: null
        }
      }
    })
    
    // Check that form dialog is visible
    cy.get('[data-testid="add-reminder-form"]').should('be.visible')
    
    // Check that form elements are present
    cy.get('[data-testid="reminder-title"]').should('exist')
    cy.get('[data-testid="reminder-description"]').should('exist')
    cy.get('[data-testid="save-reminder"]').should('exist')
    
    // Check form title
    cy.contains('Add New Reminder').should('be.visible')
  })

  it('does not display form when showAddForm is false', () => {
    // Mount with Redux state that hides the form
    cy.mountWithProviders(<AddReminderForm />, {
      reduxState: {
        ui: {
          showAddForm: false,
          notifications: []
        },
        reminders: {
          items: [],
          loading: false,
          error: null
        }
      }
    })
    
    // Check that form dialog is not visible
    cy.get('[data-testid="add-reminder-form"]').should('not.exist')
  })

  it('closes form when cancel button is clicked', () => {
    // Mount with Redux state that shows the form
    cy.mountWithProviders(<AddReminderForm />, {
      reduxState: {
        ui: {
          showAddForm: true,
          notifications: []
        },
        reminders: {
          items: [],
          loading: false,
          error: null
        }
      }
    })
    
    // Form should be visible initially
    cy.get('[data-testid="add-reminder-form"]').should('be.visible')
    
    // Click cancel button
    cy.get('button').contains('Cancel').click()
    
    // Form should be closed (not visible)
    cy.get('[data-testid="add-reminder-form"]').should('not.exist')
  })

  it('validates required fields', () => {
    cy.mountWithProviders(<AddReminderForm />, {
      reduxState: {
        ui: {
          showAddForm: true,
          notifications: []
        },
        reminders: {
          items: [],
          loading: false,
          error: null
        }
      }
    })
    
    // Try to submit without filling required fields
    cy.get('[data-testid="save-reminder"]').click()
    
    // Should show validation error for title
    cy.get('[data-testid="reminder-title"]')
      .find('p')
      .scrollIntoView()
      .should('be.visible')
      .and('contain', 'Reminder title is required');
  })

})
