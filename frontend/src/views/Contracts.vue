<template>
  <div class="contracts-view">
    <div class="header">
      <h1>Contracts</h1>
      <button @click="showModal = true" class="btn-primary">Add Contract</button>
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
            <label>Client ID *</label>
            <input v-model.number="form.clientId" type="number" required />
          </div>
          <div class="form-group">
            <label>Agent ID *</label>
            <input v-model.number="form.agentId" type="number" required />
          </div>
          <div class="form-group">
            <label>Insurance Type ID *</label>
            <input v-model.number="form.insuranceTypeId" type="number" required />
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
    contracts() {
      return this.allContracts
    },
    pagination() {
      return this.$store.state.contracts.pagination
    }
  },
  async mounted() {
    await this.fetchStatusOptions()
    await this.fetchContracts()
  },
  methods: {
    ...mapActions('contracts', ['fetchContracts', 'createContract', 'updateContract']),
    async fetchStatusOptions() {
      const response = await axios.get('/status-options')
      this.statusOptions = response.data
    },
    async fetchContracts() {
      const params = { ...this.filters, page: this.pagination.page, limit: this.pagination.limit }
      Object.keys(params).forEach(key => !params[key] && delete params[key])
      await this.$store.dispatch('contracts/fetchContracts', params)
    },
    editContract(contract) {
      this.editingContract = contract
      this.form = {
        ...contract,
        startDate: contract.startDate?.split('T')[0],
        endDate: contract.endDate?.split('T')[0]
      }
      this.showModal = true
    },
    async saveContract() {
      try {
        if (this.editingContract) {
          await this.updateContract({ id: this.editingContract.contractId, ...this.form })
        } else {
          await this.createContract(this.form)
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

