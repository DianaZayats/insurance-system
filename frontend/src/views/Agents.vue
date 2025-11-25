<template>
  <div class="agents-view">
    <div class="header">
      <h1>Agents</h1>
      <button v-if="canEditAgents" @click="showModal = true" class="btn-primary">Add Agent</button>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Full Name</th>
          <th>Phone</th>
          <th>Email</th>
          <th>Hire Date</th>
          <th>Branch</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="agent in agents" :key="agent.agentId">
          <td>{{ agent.agentId }}</td>
          <td>{{ agent.fullName }}</td>
          <td>{{ agent.phone || '-' }}</td>
          <td>{{ agent.email || '-' }}</td>
          <td>{{ formatDate(agent.hireDate) }}</td>
          <td>{{ agent.branchName || '-' }}</td>
          <td>
            <button 
              v-if="canEditAgents"
              @click="editAgent(agent)" 
              class="btn-edit"
              :disabled="isSystemAccount(agent)"
              :title="isSystemAccount(agent) ? 'System accounts cannot be modified' : ''"
            >
              Edit
            </button>
            <button 
              v-if="canEditAgents"
              @click="deleteAgent(agent.agentId)" 
              class="btn-delete"
              :disabled="isSystemAccount(agent)"
              :title="isSystemAccount(agent) ? 'System accounts cannot be deleted' : ''"
            >
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Модальне вікно для створення/редагування -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h2>{{ editingAgent ? 'Edit' : 'Add' }} Agent</h2>
        <form @submit.prevent="saveAgent">
          <div class="form-group">
            <label>Full Name *</label>
            <input v-model="form.fullName" required />
          </div>
          <div class="form-group">
            <label>Hire Date *</label>
            <input v-model="form.hireDate" type="date" required />
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input v-model="form.phone" type="tel" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="form.email" type="email" />
          </div>
          <div class="form-group">
            <label>Branch</label>
            <select v-model.number="form.branchId">
              <option :value="null">None</option>
              <option v-for="branch in branches" :key="branch.branchId" :value="branch.branchId">
                {{ branch.name }}
              </option>
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

export default {
  name: 'Agents',
  data() {
    return {
      showModal: false,
      editingAgent: null,
      form: { fullName: '', phone: '', email: '', hireDate: '', branchId: null }
    }
  },
  computed: {
    ...mapGetters('agents', ['allAgents']),
    ...mapGetters('branches', ['allBranches']),
    ...mapGetters('auth', ['userRole']),
    agents() {
      return this.allAgents
    },
    branches() {
      return this.allBranches
    },
    pagination() {
      return this.$store.state.agents.pagination
    },
    canEditAgents() {
      // Лише адміністратор може створювати, редагувати та видаляти агентів
      return this.userRole === 'Admin'
    }
  },
  async mounted() {
    await this.fetchAgents()
    await this.fetchBranches()
  },
  methods: {
    ...mapActions('agents', ['fetchAgents', 'createAgent', 'updateAgent', 'deleteAgent']),
    ...mapActions('branches', ['fetchBranches']),
    editAgent(agent) {
      this.editingAgent = agent
      this.form = {
        fullName: agent.fullName || '',
        phone: agent.phone || '',
        email: agent.email || '',
        hireDate: agent.hireDate ? agent.hireDate.split('T')[0] : '',
        branchId: agent.branchId || null
      }
      this.showModal = true
    },
    async saveAgent() {
      try {
        if (this.editingAgent) {
          await this.updateAgent({
            id: this.editingAgent.agentId,
            ...this.form
          })
        } else {
          await this.createAgent(this.form)
          // Повертаємось на першу сторінку, щоб побачити нового агента
          this.$store.commit('agents/SET_PAGINATION', { ...this.pagination, page: 1 })
        }
        this.closeModal()
        await this.fetchAgents()
      } catch (error) {
        alert(error.error?.message || 'Error saving agent')
      }
    },
    closeModal() {
      this.showModal = false
      this.editingAgent = null
      this.form = {
        fullName: '',
        phone: '',
        email: '',
        hireDate: '',
        branchId: null
      }
    },
    async deleteAgent(id) {
      if (confirm('Are you sure you want to delete this agent?')) {
        try {
          await this.$store.dispatch('agents/deleteAgent', id)
          await this.fetchAgents()
        } catch (error) {
          alert(error.error?.message || 'Error deleting agent')
        }
      }
    },
    formatDate(date) {
      if (!date) return '-'
      return new Date(date).toLocaleDateString()
    },
    isSystemAccount(agent) {
      // Перевіряємо, чи це системний обліковий запис із логіном «agent» або «client»
      if (!agent.userEmail) return false
      const email = agent.userEmail.toLowerCase()
      // Email може бути точним збігом «agent»/«client» або починатися з «agent@»/«client@»
      return email === 'agent' || email === 'client' || 
             email.startsWith('agent@') || email.startsWith('client@')
    }
  }
}
</script>

<style scoped>
.agents-view {
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
  align-items: center;
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

.btn-primary, .btn-edit, .btn-delete {
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

.btn-delete {
  background-color: #c0392b;
  color: white;
}

.btn-delete:hover {
  background-color: #e74c3c;
}

.btn-edit:disabled,
.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #3e3e42;
}

.btn-edit:disabled:hover,
.btn-delete:disabled:hover {
  background-color: #3e3e42;
}

.btn-secondary {
  background-color: #3e3e42;
  color: white;
}

.btn-secondary:hover {
  background-color: #4a4a4a;
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
  max-height: 90vh;
  overflow-y: auto;
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

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}
</style>

