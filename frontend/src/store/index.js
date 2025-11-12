import { createStore } from 'vuex'
import auth from './modules/auth'
import clients from './modules/clients'
import agents from './modules/agents'
import branches from './modules/branches'
import insuranceTypes from './modules/insuranceTypes'
import contracts from './modules/contracts'
import cases from './modules/cases'
import reports from './modules/reports'

export default createStore({
  modules: {
    auth,
    clients,
    agents,
    branches,
    insuranceTypes,
    contracts,
    cases,
    reports
  }
})

