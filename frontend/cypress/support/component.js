// ***********************************************************
// This example support/component.js is processed and
// loaded automatically before your component test files.
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

import { mount } from 'cypress/react'
import React from 'react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

// Import your store slices
import remindersReducer from '../../src/store/slices/remindersSlice'
import uiReducer from '../../src/store/slices/uiSlice'
import authReducer from '../../src/store/slices/authSlice'

// Create a test store factory
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      reminders: remindersReducer,
      ui: uiReducer,
      auth: authReducer,
    },
    preloadedState: initialState,
  })
}

// Enhanced mount command with Redux and MUI providers
const mountWithProviders = (component, options = {}) => {
  const { reduxState = {}, ...mountOptions } = options
  const store = createTestStore(reduxState)
  
  const wrapped = React.createElement(
    Provider,
    { store },
    React.createElement(
      LocalizationProvider,
      { dateAdapter: AdapterDayjs },
      component
    )
  )
  
  return mount(wrapped, mountOptions)
}

Cypress.Commands.add('mount', mount)
Cypress.Commands.add('mountWithProviders', mountWithProviders)

// Example use:
// cy.mount(<MyComponent />)
// cy.mountWithProviders(<MyComponent />, { reduxState: { ui: { showAddForm: true } } })