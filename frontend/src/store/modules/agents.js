import axios from 'axios'

const state = {
  agents: [],
  currentAgent: null,
  pagination: { page: 1, limit: 20, total: 0 }
}

const getters = {
  allAgents: state => state.agents,
  currentAgent: state => state.currentAgent
}

const mutations = {
  SET_AGENTS(state, agents) {
    state.agents = agents
  },
  SET_CURRENT_AGENT(state, agent) {
    state.currentAgent = agent
  },
  SET_PAGINATION(state, pagination) {
    state.pagination = pagination
  },
  ADD_AGENT(state, agent) {
    state.agents.push(agent)
  },
  UPDATE_AGENT(state, updatedAgent) {
    const index = state.agents.findIndex(a => a.agentId === updatedAgent.agentId)
    if (index !== -1) {
      state.agents.splice(index, 1, updatedAgent)
    }
  },
  REMOVE_AGENT(state, agentId) {
    state.agents = state.agents.filter(a => a.agentId !== agentId)
  }
}

const actions = {
  async fetchAgents({ commit }, params = {}) {
    try {
      const response = await axios.get('/agents', { params })
      commit('SET_AGENTS', response.data.data)
      commit('SET_PAGINATION', response.data.pagination)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async fetchAgent({ commit }, id) {
    try {
      const response = await axios.get(`/agents/${id}`)
      commit('SET_CURRENT_AGENT', response.data)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async createAgent({ commit }, agentData) {
    try {
      const response = await axios.post('/agents', agentData)
      commit('ADD_AGENT', response.data)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async updateAgent({ commit }, { id, ...agentData }) {
    try {
      const response = await axios.put(`/agents/${id}`, agentData)
      commit('UPDATE_AGENT', response.data)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async deleteAgent({ commit }, id) {
    try {
      await axios.delete(`/agents/${id}`)
      commit('REMOVE_AGENT', id)
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

