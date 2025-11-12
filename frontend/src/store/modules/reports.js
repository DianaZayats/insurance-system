import axios from 'axios'

const state = {
  reports: {}
}

const getters = {
  getReport: state => name => state.reports[name]
}

const mutations = {
  SET_REPORT(state, { name, data }) {
    state.reports[name] = data
  }
}

const actions = {
  async fetchMaxContributionMonth({ commit }) {
    try {
      const response = await axios.get('/reports/max-contribution-month')
      commit('SET_REPORT', { name: 'maxContributionMonth', data: response.data })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async fetchAgentIncome({ commit }, month) {
    try {
      const response = await axios.get('/reports/agent-income', { params: { month } })
      commit('SET_REPORT', { name: 'agentIncome', data: response.data })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async fetchMostDemandedTypePerClient({ commit }) {
    try {
      const response = await axios.get('/reports/most-demanded-type-per-client')
      commit('SET_REPORT', { name: 'mostDemandedTypePerClient', data: response.data })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async fetchActiveContracts({ commit }, clientId) {
    try {
      const response = await axios.get('/reports/active-contracts', { params: { clientId } })
      commit('SET_REPORT', { name: 'activeContracts', data: response.data })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async fetchCaseExtremes({ commit }, mode) {
    try {
      const response = await axios.get('/reports/case-extremes', { params: { mode } })
      commit('SET_REPORT', { name: 'caseExtremes', data: response.data })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async fetchAllTypesUsedClients({ commit }) {
    try {
      const response = await axios.get('/reports/all-types-used-clients')
      commit('SET_REPORT', { name: 'allTypesUsedClients', data: response.data })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async exportReport({ commit }, { name, params }) {
    try {
      const response = await axios.get('/reports/export.csv', {
        params: { name, ...params },
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${name}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}

