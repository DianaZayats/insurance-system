<template>
  <div class="agents-view">
    <div class="header">
      <h1>Agents</h1>
      <button @click="showModal = true" class="btn-primary">Add Agent</button>
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
            <button @click="editAgent(agent)" class="btn-edit">Edit</button>
            <button @click="deleteAgent(agent.agentId)" class="btn-delete">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
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
    agents() {
      return this.allAgents
    }
  },
  async mounted() {
    await this.fetchAgents()
  },
  methods: {
    ...mapActions('agents', ['fetchAgents', 'createAgent', 'updateAgent', 'deleteAgent']),
    editAgent(agent) {
      this.editingAgent = agent
      this.form = { ...agent, hireDate: agent.hireDate?.split('T')[0] }
      this.showModal = true
    },
    async deleteAgent(id) {
      if (confirm('Delete this agent?')) {
        try {
          await this.$store.dispatch('agents/deleteAgent', id)
          await this.fetchAgents()
        } catch (error) {
          alert(error.error?.message || 'Error')
        }
      }
    },
    formatDate(date) {
      if (!date) return '-'
      return new Date(date).toLocaleDateString()
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
</style>

