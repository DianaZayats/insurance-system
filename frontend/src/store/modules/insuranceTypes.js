import axios from 'axios'

const state = {
  insuranceTypes: [],
  currentType: null
}

const getters = {
  allInsuranceTypes: state => state.insuranceTypes,
  currentType: state => state.currentType
}

const mutations = {
  SET_INSURANCE_TYPES(state, types) {
    state.insuranceTypes = types
  },
  SET_CURRENT_TYPE(state, type) {
    state.currentType = type
  },
  ADD_TYPE(state, type) {
    state.insuranceTypes.push(type)
  },
  UPDATE_TYPE(state, updatedType) {
    const index = state.insuranceTypes.findIndex(t => t.insuranceTypeId === updatedType.insuranceTypeId)
    if (index !== -1) {
      state.insuranceTypes.splice(index, 1, updatedType)
    }
  },
  REMOVE_TYPE(state, typeId) {
    state.insuranceTypes = state.insuranceTypes.filter(t => t.insuranceTypeId !== typeId)
  }
}

const actions = {
  async fetchInsuranceTypes({ commit }, params = {}) {
    try {
      const response = await axios.get('/insurance-types', { params: { ...params, limit: 100 } })
      commit('SET_INSURANCE_TYPES', response.data.data)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async fetchInsuranceType({ commit }, id) {
    try {
      const response = await axios.get(`/insurance-types/${id}`)
      commit('SET_CURRENT_TYPE', response.data)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async createInsuranceType({ commit }, typeData) {
    try {
      const response = await axios.post('/insurance-types', typeData)
      commit('ADD_TYPE', response.data)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async updateInsuranceType({ commit }, { id, ...typeData }) {
    try {
      const response = await axios.put(`/insurance-types/${id}`, typeData)
      commit('UPDATE_TYPE', response.data)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
  async deleteInsuranceType({ commit }, id) {
    try {
      await axios.delete(`/insurance-types/${id}`)
      commit('REMOVE_TYPE', id)
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

