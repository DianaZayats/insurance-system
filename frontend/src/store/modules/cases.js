import axios from 'axios'

const state = {
  cases: [],
  currentCase: null,
  pagination: { page: 1, limit: 20, total: 0 }
}

const getters = {
  allCases: state => state.cases,
  currentCase: state => state.currentCase
}

const mutations = {
  SET_CASES(state, cases) {
    state.cases = cases
  },
  SET_CURRENT_CASE(state, caseItem) {
    state.currentCase = caseItem
  },
  SET_PAGINATION(state, pagination) {
    state.pagination = pagination
  },
  ADD_CASE(state, caseItem) {
    state.cases.push(caseItem)
  },
  UPDATE_CASE(state, updatedCase) {
    const index = state.cases.findIndex(c => c.caseId === updatedCase.caseId)
    if (index !== -1) {
      state.cases.splice(index, 1, updatedCase)
    }
  },
  REMOVE_CASE(state, caseId) {
    state.cases = state.cases.filter(c => c.caseId !== caseId)
  }
}

const actions = {
  async fetchCases({ commit }, params = {}) {
    try {
      const response = await axios.get('/cases', { params })
      commit('SET_CASES', response.data.data)
      commit('SET_PAGINATION', response.data.pagination)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async fetchCase({ commit }, id) {
    try {
      const response = await axios.get(`/cases/${id}`)
      commit('SET_CURRENT_CASE', response.data)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async createCase({ commit }, caseData) {
    try {
      const response = await axios.post('/cases', caseData)
      commit('ADD_CASE', response.data)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async updateCase({ commit }, { id, ...caseData }) {
    try {
      const response = await axios.put(`/cases/${id}`, caseData)
      commit('UPDATE_CASE', response.data)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async deleteCase({ commit }, id) {
    try {
      await axios.delete(`/cases/${id}`)
      commit('REMOVE_CASE', id)
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

