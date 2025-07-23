/// <reference types="cypress" />

import { mount } from 'cypress/react'

declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount
      mountWithProviders: (
        component: React.ReactElement,
        options?: {
          reduxState?: any
          [key: string]: any
        }
      ) => Cypress.Chainable<any>
    }
  }
}