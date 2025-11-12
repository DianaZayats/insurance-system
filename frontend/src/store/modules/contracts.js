import axios from 'axios'

const state = {
  contracts: [],
  currentContract: null,
  pagination: { page: 1, limit: 20, total: 0 }
}

const getters = {
  allContracts: state => state.contracts,
  currentContract: state => state.currentContract
}

const mutations = {
  SET_CONTRACTS(state, contracts) {
    state.contracts = contracts
  },
  SET_CURRENT_CONTRACT(state, contract) {
    state.currentContract = contract
  },
  SET_PAGINATION(state, pagination) {
    state.pagination = pagination
  },
  ADD_CONTRACT(state, contract) {
    state.contracts.push(contract)
  },
  UPDATE_CONTRACT(state, updatedContract) {
    const index = state.contracts.findIndex(c => c.contractId === updatedContract.contractId)
    if (index !== -1) {
      state.contracts.splice(index, 1, updatedContract)
    }
  },
  REMOVE_CONTRACT(state, contractId) {
    state.contracts = state.contracts.filter(c => c.contractId !== contractId)
  }
}

const actions = {
  async fetchContracts({ commit }, params = {}) {
    try {
      const response = await axios.get('/contracts', { params })
      commit('SET_CONTRACTS', response.data.data)
      commit('SET_PAGINATION', response.data.pagination)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async fetchContract({ commit }, id) {
    try {
      const response = await axios.get(`/contracts/${id}`)
      commit('SET_CURRENT_CONTRACT', response.data)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async createContract({ commit }, contractData) {
    try {
      const response = await axios.post('/contracts', contractData)
      commit('ADD_CONTRACT', response.data)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async updateContract({ commit }, { id, ...contractData }) {
    try {
      const response = await axios.put(`/contracts/${id}`, contractData)
      commit('UPDATE_CONTRACT', response.data)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async updateContractStatus({ commit }, { id, status }) {
    try {
      const response = await axios.post(`/contracts/${id}/status`, { status })
      commit('UPDATE_CONTRACT', response.data)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async deleteContract({ commit }, id) {
    try {
      await axios.delete(`/contracts/${id}`)
      commit('REMOVE_CONTRACT', id)
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

