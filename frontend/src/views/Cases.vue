<template>
  <div class="cases-view">
    <div class="header">
      <h1>Insurance Cases</h1>
      <button @click="openAddModal" class="btn-primary">Add Case</button>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Contract ID</th>
          <th>Case Date</th>
          <th>Act Number</th>
          <th>Damage Level</th>
          <th>Accrued Payment</th>
          <th>Payment Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="caseItem in cases" :key="caseItem.caseId">
          <td>{{ caseItem.caseId }}</td>
          <td>{{ caseItem.contractId }}</td>
          <td>{{ formatDate(caseItem.caseDate) }}</td>
          <td>{{ caseItem.actNumber }}</td>
          <td>{{ (caseItem.damageLevel * 100).toFixed(1) }}%</td>
          <td>${{ caseItem.accruedPayment?.toLocaleString() }}</td>
          <td>{{ formatDate(caseItem.paymentDate) }}</td>
          <td>
            <button @click="editCase(caseItem)" class="btn-edit">Edit</button>
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
        <h2>{{ editingCase ? 'Edit' : 'Add' }} Insurance Case</h2>
        <form @submit.prevent="saveCase">
          <div class="form-group">
            <label>Contract *</label>
            <select v-model.number="form.contractId" required>
              <option :value="null">Select a contract</option>
              <option v-for="contract in contracts" :key="contract.contractId" :value="contract.contractId">
                {{ contract.contractId }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Case Date *</label>
            <input v-model="form.caseDate" type="date" required />
          </div>
          <div class="form-group">
            <label>Act Number *</label>
            <input v-model="form.actNumber" required />
          </div>
          <div class="form-group">
            <label>Damage Level (0-1) *</label>
            <input v-model.number="form.damageLevel" type="number" step="0.01" min="0" max="1" required />
          </div>
          <div class="form-group">
            <label>Payment Date</label>
            <input v-model="form.paymentDate" type="date" />
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

export default {
  name: 'Cases',
  data() {
    return {
      showModal: false,
      editingCase: null,
      form: {
        contractId: null,
        caseDate: '',
        actNumber: '',
        damageLevel: null,
        paymentDate: ''
      }
    }
  },
  computed: {
    ...mapGetters('cases', ['allCases']),
    ...mapGetters('contracts', ['allContracts']),
    cases() {
      return this.allCases
    },
    contracts() {
      return this.allContracts || []
    },
    pagination() {
      return this.$store.state.cases.pagination
    }
  },
  async mounted() {
    await this.fetchCases()
  },
  methods: {
    ...mapActions('cases', ['fetchCases', 'createCase', 'updateCase']),
    ...mapActions('contracts', ['fetchContracts']),
    async fetchCases() {
      await this.$store.dispatch('cases/fetchCases', {
        page: this.pagination.page,
        limit: this.pagination.limit
      })
    },
    async openAddModal() {
      // Ensure contracts are loaded before opening modal
      if (this.contracts.length === 0) {
        try {
          await this.fetchContracts({ limit: 100, page: 1 })
        } catch (error) {
          console.error('Error fetching contracts:', error)
          if (error.error?.code !== 'VALIDATION') {
            alert('Failed to load contracts: ' + (error.error?.message || 'Unknown error'))
          }
        }
      }
      this.showModal = true
    },
    async editCase(caseItem) {
      this.editingCase = caseItem
      this.form = {
        ...caseItem,
        caseDate: caseItem.caseDate?.split('T')[0],
        paymentDate: caseItem.paymentDate?.split('T')[0] || ''
      }
      // Ensure contracts are loaded before opening modal
      if (this.contracts.length === 0) {
        try {
          await this.fetchContracts({ limit: 100, page: 1 })
        } catch (error) {
          console.error('Error fetching contracts:', error)
        }
      }
      this.showModal = true
    },
    async saveCase() {
      try {
        if (this.editingCase) {
          await this.updateCase({ id: this.editingCase.caseId, ...this.form })
        } else {
          await this.createCase(this.form)
          // Reset to page 1 to show newly created case
          this.$store.commit('cases/SET_PAGINATION', { ...this.pagination, page: 1 })
        }
        this.closeModal()
        await this.fetchCases()
      } catch (error) {
        alert(error.error?.message || 'Error saving case')
      }
    },
    closeModal() {
      this.showModal = false
      this.editingCase = null
      this.form = {
        contractId: null,
        caseDate: '',
        actNumber: '',
        damageLevel: null,
        paymentDate: ''
      }
    },
    changePage(delta) {
      this.$store.commit('cases/SET_PAGINATION', {
        ...this.pagination,
        page: this.pagination.page + delta
      })
      this.fetchCases()
    },
    formatDate(date) {
      if (!date) return '-'
      return new Date(date).toLocaleDateString()
    }
  }
}
</script>

<style scoped>
.cases-view {
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

.data-table {
  width: 100%;
  background: #252526;
  border-collapse: collapse;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  border: 1px solid #3e3e42;
}

.data-table th,
.data-table td {
  padding: 1rem;
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
  max-width: 500px;
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
  font-family: inherit;
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

.btn-primary, .btn-edit, .btn-secondary {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
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

