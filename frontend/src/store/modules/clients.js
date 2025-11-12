import axios from 'axios'

const state = {
  clients: [],
  currentClient: null,
  pagination: { page: 1, limit: 20, total: 0 }
}

const getters = {
  allClients: state => state.clients,
  currentClient: state => state.currentClient
}

const mutations = {
  SET_CLIENTS(state, clients) {
    state.clients = clients
  },
  SET_CURRENT_CLIENT(state, client) {
    state.currentClient = client
  },
  SET_PAGINATION(state, pagination) {
    state.pagination = pagination
  },
  ADD_CLIENT(state, client) {
    state.clients.push(client)
  },
  UPDATE_CLIENT(state, updatedClient) {
    const index = state.clients.findIndex(c => c.clientId === updatedClient.clientId)
    if (index !== -1) {
      state.clients.splice(index, 1, updatedClient)
    }
  },
  REMOVE_CLIENT(state, clientId) {
    state.clients = state.clients.filter(c => c.clientId !== clientId)
  }
}

const actions = {
  async fetchClients({ commit }, params = {}) {
    try {
      const response = await axios.get('/clients', { params })
      commit('SET_CLIENTS', response.data.data)
      commit('SET_PAGINATION', response.data.pagination)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async fetchClient({ commit }, id) {
    try {
      const response = await axios.get(`/clients/${id}`)
      commit('SET_CURRENT_CLIENT', response.data)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async createClient({ commit }, clientData) {
    try {
      const response = await axios.post('/clients', clientData)
      commit('ADD_CLIENT', response.data)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async updateClient({ commit }, { id, ...clientData }) {
    try {
      const response = await axios.put(`/clients/${id}`, clientData)
      commit('UPDATE_CLIENT', response.data)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async deleteClient({ commit }, id) {
    try {
      await axios.delete(`/clients/${id}`)
      commit('REMOVE_CLIENT', id)
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async fetchClientContracts({ commit }, { id, ...params }) {
    try {
      const response = await axios.get(`/clients/${id}/contracts`, { params })
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

