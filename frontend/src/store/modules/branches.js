import axios from 'axios'

const state = {
  branches: []
}

const getters = {
  allBranches: state => state.branches
}

const mutations = {
  SET_BRANCHES(state, branches) {
    state.branches = branches
  }
}

const actions = {
  async fetchBranches({ commit }) {
    try {
      const response = await axios.get('/branches', { params: { limit: 100 } })
      commit('SET_BRANCHES', response.data.data)
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

