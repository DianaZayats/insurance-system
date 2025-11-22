<template>
  <div class="clients-view">
    <div class="header">
      <h1>Clients</h1>
      <button @click="showModal = true" class="btn-primary">Add Client</button>
    </div>
    
    <div class="filters">
      <input v-model="filters.name" placeholder="Search by name..." @input="fetchClients" />
      <input v-model="filters.phone" placeholder="Search by phone..." @input="fetchClients" />
      <input v-model="filters.email" placeholder="Search by email..." @input="fetchClients" />
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Phone</th>
          <th>Email</th>
          <th>Address</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="client in clients" :key="client.clientId">
          <td>{{ client.clientId }}</td>
          <td>{{ client.lastName }}, {{ client.firstName }} {{ client.middleName || '' }}</td>
          <td>{{ client.phone || '-' }}</td>
          <td>{{ client.email || '-' }}</td>
          <td>{{ client.address || '-' }}</td>
          <td>
            <button @click="editClient(client)" class="btn-edit">Edit</button>
            <button @click="viewContracts(client.clientId)" class="btn-view">Contracts</button>
            <button @click="deleteClient(client.clientId)" class="btn-delete">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="pagination">
      <button @click="changePage(-1)" :disabled="pagination.page === 1">Previous</button>
      <span>Page {{ pagination.page }} of {{ pagination.totalPages }}</span>
      <button @click="changePage(1)" :disabled="pagination.page >= pagination.totalPages">Next</button>
    </div>

    <!-- Modal for Add/Edit -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h2>{{ editingClient ? 'Edit' : 'Add' }} Client</h2>
        <form @submit.prevent="saveClient">
          <div class="form-group">
            <label>Last Name *</label>
            <input v-model="form.lastName" required />
          </div>
          <div class="form-group">
            <label>First Name *</label>
            <input v-model="form.firstName" required />
          </div>
          <div class="form-group">
            <label>Middle Name</label>
            <input v-model="form.middleName" />
          </div>
          <div class="form-group">
            <label>Address</label>
            <input v-model="form.address" />
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input v-model="form.phone" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="form.email" type="email" />
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
  name: 'Clients',
  data() {
    return {
      filters: { name: '', phone: '', email: '' },
      showModal: false,
      editingClient: null,
      form: { lastName: '', firstName: '', middleName: '', address: '', phone: '', email: '' }
    }
  },
  computed: {
    ...mapGetters('clients', ['allClients']),
    clients() {
      return this.allClients
    },
    pagination() {
      return this.$store.state.clients.pagination
    }
  },
  async mounted() {
    await this.fetchClients()
  },
  methods: {
    ...mapActions('clients', ['fetchClients', 'createClient', 'updateClient', 'deleteClient']),
    async fetchClients() {
      await this.$store.dispatch('clients/fetchClients', {
        ...this.filters,
        page: this.pagination.page,
        limit: this.pagination.limit
      })
    },
    editClient(client) {
      this.editingClient = client
      this.form = { ...client }
      this.showModal = true
    },
    async saveClient() {
      try {
        if (this.editingClient) {
          await this.updateClient({ id: this.editingClient.clientId, ...this.form })
        } else {
          await this.createClient(this.form)
          // Reset to page 1 to show newly created client
          this.$store.commit('clients/SET_PAGINATION', { ...this.pagination, page: 1 })
        }
        this.closeModal()
        await this.fetchClients()
      } catch (error) {
        alert(error.error?.message || 'Error saving client')
      }
    },
    closeModal() {
      this.showModal = false
      this.editingClient = null
      this.form = { lastName: '', firstName: '', middleName: '', address: '', phone: '', email: '' }
    },
    async deleteClient(id) {
      if (confirm('Are you sure you want to delete this client?')) {
        try {
          await this.$store.dispatch('clients/deleteClient', id)
          await this.fetchClients()
        } catch (error) {
          alert(error.error?.message || 'Error deleting client')
        }
      }
    },
    viewContracts(clientId) {
      this.$router.push({ path: '/contracts', query: { clientId } })
    },
    changePage(delta) {
      this.$store.commit('clients/SET_PAGINATION', {
        ...this.pagination,
        page: this.pagination.page + delta
      })
      this.fetchClients()
    }
  }
}
</script>

<style scoped>
.clients-view {
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
}

.filters input {
  padding: 0.5rem;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  flex: 1;
  background-color: #3c3c3c;
  color: #cccccc;
}

.filters input:focus {
  outline: none;
  border-color: #007acc;
}

.filters input::placeholder {
  color: #858585;
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

.btn-primary, .btn-edit, .btn-view, .btn-delete, .btn-secondary {
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

.btn-delete {
  background-color: #c0392b;
  color: white;
}

.btn-delete:hover {
  background-color: #e74c3c;
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

.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  background-color: #3c3c3c;
  color: #cccccc;
}

.form-group input:focus {
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

