<template>
  <div class="contracts-view">
    <div class="header">
      <h1>Contracts</h1>
      <button @click="openAddModal" class="btn-primary">Add Contract</button>
    </div>
    
    <div class="filters">
      <input v-model="filters.clientId" placeholder="Client ID" />
      <input v-model="filters.agentId" placeholder="Agent ID" />
      <select v-model="filters.status">
        <option value="">All Statuses</option>
        <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
      </select>
      <button @click="fetchContracts" class="btn-primary">Filter</button>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Client</th>
          <th>Agent</th>
          <th>Type</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Amount</th>
          <th>Contribution</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="contract in contracts" :key="contract.contractId">
          <td>{{ contract.contractId }}</td>
          <td>{{ contract.clientId }}</td>
          <td>{{ contract.agentId }}</td>
          <td>{{ contract.insuranceTypeId }}</td>
          <td>{{ formatDate(contract.startDate) }}</td>
          <td>{{ formatDate(contract.endDate) }}</td>
          <td>${{ contract.insuranceAmount?.toLocaleString() }}</td>
          <td>${{ contract.contributionAmount?.toLocaleString() }}</td>
          <td>{{ contract.status }}</td>
          <td>
            <button @click="editContract(contract)" class="btn-edit">Edit</button>
            <button @click="updateStatus(contract)" class="btn-view">Status</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="pagination">
      <button @click="changePage(-1)" :disabled="pagination.page === 1">Previous</button>
      <span>Page {{ pagination.page }} of {{ pagination.totalPages }}</span>
      <button @click="changePage(1)" :disabled="pagination.page >= pagination.totalPages">Next</button>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h2>{{ editingContract ? 'Edit' : 'Add' }} Contract</h2>
        <form @submit.prevent="saveContract">
          <div class="form-group">
            <label>Client *</label>
            <select v-model.number="form.clientId" required>
              <option :value="null">Select a client</option>
              <option v-for="client in clients" :key="client.clientId" :value="client.clientId">
                {{ client.clientId }} - {{ client.lastName }}, {{ client.firstName }} {{ client.middleName || '' }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Agent *</label>
            <select v-model.number="form.agentId" required>
              <option :value="null">Select an agent</option>
              <option v-for="agent in agents" :key="agent.agentId" :value="agent.agentId">
                {{ agent.agentId }} - {{ agent.fullName }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Insurance Type *</label>
            <select v-model.number="form.insuranceTypeId" required>
              <option :value="null">Select an insurance type</option>
              <option v-for="type in insuranceTypes" :key="type.insuranceTypeId" :value="type.insuranceTypeId">
                {{ type.insuranceTypeId }} - {{ type.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Start Date *</label>
            <input v-model="form.startDate" type="date" required />
          </div>
          <div class="form-group">
            <label>End Date *</label>
            <input v-model="form.endDate" type="date" required />
          </div>
          <div class="form-group">
            <label>Insurance Amount *</label>
            <input v-model.number="form.insuranceAmount" type="number" step="0.01" required />
          </div>
          <div class="form-group">
            <label>Agent Percent</label>
            <input v-model.number="form.agentPercent" type="number" step="0.0001" min="0" max="1" />
          </div>
          <div class="form-group">
            <label>Status</label>
            <select v-model="form.status">
              <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary">Save</button>
            <button type="button" @click="closeModal" class="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import axios from 'axios'

export default {
  name: 'Contracts',
  data() {
    return {
      filters: { clientId: '', agentId: '', status: '' },
      statusOptions: [],
      showModal: false,
      editingContract: null,
      form: {
        clientId: null,
        agentId: null,
        insuranceTypeId: null,
        startDate: '',
        endDate: '',
        insuranceAmount: null,
        agentPercent: null,
        status: 'Draft'
      }
    }
  },
  computed: {
    ...mapGetters('contracts', ['allContracts']),
    ...mapGetters('clients', ['allClients']),
    ...mapGetters('agents', ['allAgents']),
    ...mapGetters('insuranceTypes', ['allInsuranceTypes']),
    contracts() {
      return this.allContracts
    },
    clients() {
      return this.allClients || []
    },
    agents() {
      return this.allAgents
    },
    insuranceTypes() {
      return this.allInsuranceTypes
    },
    pagination() {
      return this.$store.state.contracts.pagination
    }
  },
  async mounted() {
    await this.fetchStatusOptions()
    await this.fetchContracts()
    // Fetch all items for dropdowns (with high limit)
    await this.loadDropdownData()
  },
  methods: {
    ...mapActions('contracts', ['fetchContracts', 'createContract', 'updateContract']),
    ...mapActions('clients', ['fetchClients']),
    ...mapActions('agents', ['fetchAgents']),
    ...mapActions('insuranceTypes', ['fetchInsuranceTypes']),
    async loadDropdownData() {
      try {
        // Use limit 100 (max allowed by validation) and fetch first page
        const clientsResponse = await this.fetchClients({ limit: 100, page: 1 })
        console.log('Clients loaded:', clientsResponse?.data?.length || 0, 'clients')
      } catch (error) {
        console.error('Error fetching clients:', error)
        // Only show alert for critical errors, not validation errors
        if (error.error?.code !== 'VALIDATION') {
          alert('Failed to load clients: ' + (error.error?.message || 'Unknown error'))
        }
      }
      try {
        const agentsResponse = await this.fetchAgents({ limit: 100, page: 1 })
        console.log('Agents loaded:', agentsResponse?.data?.length || 0, 'agents')
      } catch (error) {
        console.error('Error fetching agents:', error)
        if (error.error?.code !== 'VALIDATION') {
          alert('Failed to load agents: ' + (error.error?.message || 'Unknown error'))
        }
      }
      try {
        const typesResponse = await this.fetchInsuranceTypes({ limit: 100, page: 1 })
        console.log('Insurance types loaded:', typesResponse?.data?.length || 0, 'types')
      } catch (error) {
        console.error('Error fetching insurance types:', error)
        if (error.error?.code !== 'VALIDATION') {
          alert('Failed to load insurance types: ' + (error.error?.message || 'Unknown error'))
        }
      }
    },
    async fetchStatusOptions() {
      const response = await axios.get('/status-options')
      this.statusOptions = response.data
    },
    async fetchContracts() {
      const params = { ...this.filters, page: this.pagination.page, limit: this.pagination.limit }
      Object.keys(params).forEach(key => !params[key] && delete params[key])
      await this.$store.dispatch('contracts/fetchContracts', params)
    },
    async editContract(contract) {
      this.editingContract = contract
      this.form = {
        ...contract,
        startDate: contract.startDate?.split('T')[0],
        endDate: contract.endDate?.split('T')[0]
      }
      // Ensure dropdowns are loaded before opening modal
      if (this.clients.length === 0) {
        try {
          await this.fetchClients({ limit: 100, page: 1 })
        } catch (error) {
          console.error('Error fetching clients in editContract:', error)
        }
      }
      if (this.agents.length === 0) {
        try {
          await this.fetchAgents({ limit: 100, page: 1 })
        } catch (error) {
          console.error('Error fetching agents in editContract:', error)
        }
      }
      if (this.insuranceTypes.length === 0) {
        try {
          await this.fetchInsuranceTypes({ limit: 100, page: 1 })
        } catch (error) {
          console.error('Error fetching insurance types in editContract:', error)
        }
      }
      this.showModal = true
    },
    async saveContract() {
      try {
        if (this.editingContract) {
          await this.updateContract({ id: this.editingContract.contractId, ...this.form })
        } else {
          await this.createContract(this.form)
          // Reset to page 1 to show newly created contract
          this.$store.commit('contracts/SET_PAGINATION', { ...this.pagination, page: 1 })
        }
        this.closeModal()
        await this.fetchContracts()
      } catch (error) {
        alert(error.error?.message || 'Error saving contract')
      }
    },
    async updateStatus(contract) {
      const newStatus = prompt('Enter new status:', contract.status)
      if (newStatus && this.statusOptions.includes(newStatus)) {
        try {
          await this.$store.dispatch('contracts/updateContractStatus', {
            id: contract.contractId,
            status: newStatus
          })
          await this.fetchContracts()
        } catch (error) {
          alert(error.error?.message || 'Error updating status')
        }
      }
    },
    async openAddModal() {
      // Ensure dropdowns are loaded before opening modal
      if (this.clients.length === 0) {
        try {
          const response = await this.fetchClients({ limit: 100, page: 1 })
          console.log('Clients fetched in openAddModal:', response?.data?.length || 0)
          console.log('Store clients after fetch:', this.$store.state.clients.clients?.length || 0)
        } catch (error) {
          console.error('Error fetching clients in openAddModal:', error)
          if (error.error?.code !== 'VALIDATION') {
            alert('Failed to load clients: ' + (error.error?.message || error.message || 'Unknown error'))
          }
        }
      }
      if (this.agents.length === 0) {
        try {
          await this.fetchAgents({ limit: 100, page: 1 })
        } catch (error) {
          console.error('Error fetching agents:', error)
          if (error.error?.code !== 'VALIDATION') {
            alert('Failed to load agents: ' + (error.error?.message || 'Unknown error'))
          }
        }
      }
      if (this.insuranceTypes.length === 0) {
        try {
          await this.fetchInsuranceTypes({ limit: 100, page: 1 })
        } catch (error) {
          console.error('Error fetching insurance types:', error)
          if (error.error?.code !== 'VALIDATION') {
            alert('Failed to load insurance types: ' + (error.error?.message || 'Unknown error'))
          }
        }
      }
      // Debug: log current state
      console.log('Opening modal - Clients:', this.clients.length, 'Agents:', this.agents.length, 'Types:', this.insuranceTypes.length)
      this.showModal = true
    },
    closeModal() {
      this.showModal = false
      this.editingContract = null
      this.form = {
        clientId: null,
        agentId: null,
        insuranceTypeId: null,
        startDate: '',
        endDate: '',
        insuranceAmount: null,
        agentPercent: null,
        status: 'Draft'
      }
    },
    changePage(delta) {
      this.$store.commit('contracts/SET_PAGINATION', {
        ...this.pagination,
        page: this.pagination.page + delta
      })
      this.fetchContracts()
    },
    formatDate(date) {
      if (!date) return '-'
      return new Date(date).toLocaleDateString()
    }
  }
}
</script>

<style scoped>
.contracts-view {
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  color: #ffffff;
  font-weight: 600;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: center;
}

.filters input,
.filters select {
  padding: 0.5rem;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  background-color: #3c3c3c;
  color: #cccccc;
}

.filters input:focus,
.filters select:focus {
  outline: none;
  border-color: #007acc;
}

.filters select {
  cursor: pointer;
}

.data-table {
  width: 100%;
  background: #252526;
  border-collapse: collapse;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  font-size: 0.9rem;
  border: 1px solid #3e3e42;
}

.data-table th,
.data-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #3e3e42;
  color: #cccccc;
}

.data-table th {
  background-color: #2d2d30;
  font-weight: 600;
  color: #ffffff;
}

.data-table tr:hover {
  background-color: #2a2d2e;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #252526;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid #3e3e42;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}

.modal-content h2 {
  color: #ffffff;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #cccccc;
  font-size: 0.9rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  background-color: #3c3c3c;
  color: #cccccc;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #007acc;
}

.form-group select {
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn-primary, .btn-edit, .btn-view, .btn-secondary {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 0.5rem;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #007acc;
  color: white;
}

.btn-primary:hover {
  background-color: #0e639c;
}

.btn-edit {
  background-color: #0e639c;
  color: white;
}

.btn-edit:hover {
  background-color: #1177bb;
}

.btn-view {
  background-color: #27ae60;
  color: white;
}

.btn-view:hover {
  background-color: #2ecc71;
}

.btn-secondary {
  background-color: #3e3e42;
  color: white;
}

.btn-secondary:hover {
  background-color: #4a4a4a;
}

.pagination {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  color: #cccccc;
}

.pagination button {
  padding: 0.5rem 1rem;
  background-color: #3e3e42;
  color: #cccccc;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.pagination button:hover:not(:disabled) {
  background-color: #4a4a4a;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

