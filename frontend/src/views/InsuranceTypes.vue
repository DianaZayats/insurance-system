<template>
  <div class="insurance-types-view">
    <div class="header">
      <h1>Insurance Types</h1>
      <button @click="showModal = true" class="btn-primary">Add Type</button>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Base Rate</th>
          <th>Payout Coeff</th>
          <th>Agent %</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="type in insuranceTypes" :key="type.insuranceTypeId">
          <td>{{ type.insuranceTypeId }}</td>
          <td>{{ type.name }}</td>
          <td>{{ (type.baseRate * 100).toFixed(2) }}%</td>
          <td>{{ type.payoutCoeff }}</td>
          <td>{{ (type.agentPercentDefault * 100).toFixed(2) }}%</td>
          <td>
            <button @click="editType(type)" class="btn-edit">Edit</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Модальне вікно для створення/редагування -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h2>{{ editingType ? 'Edit' : 'Add' }} Insurance Type</h2>
        <form @submit.prevent="saveType">
          <div class="form-group">
            <label>Name *</label>
            <input v-model="form.name" required />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="form.description" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>Base Rate (0-1) *</label>
            <input 
              v-model.number="form.baseRate" 
              type="number" 
              step="0.0001" 
              min="0" 
              max="1" 
              required 
            />
            <small class="form-hint">Example: 0.01 = 1%</small>
          </div>
          <div class="form-group">
            <label>Payout Coefficient (> 0) *</label>
            <input 
              v-model.number="form.payoutCoeff" 
              type="number" 
              step="0.0001" 
              min="0.0001" 
              required 
            />
            <small class="form-hint">Must be greater than 0</small>
          </div>
          <div class="form-group">
            <label>Agent Percent Default (0-1) *</label>
            <input 
              v-model.number="form.agentPercentDefault" 
              type="number" 
              step="0.0001" 
              min="0" 
              max="1" 
              required 
            />
            <small class="form-hint">Example: 0.1 = 10%</small>
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
  name: 'InsuranceTypes',
  data() {
    return {
      showModal: false,
      editingType: null,
      form: {
        name: '',
        description: '',
        baseRate: 0.01,
        payoutCoeff: 0.8,
        agentPercentDefault: 0.1
      }
    }
  },
  computed: {
    ...mapGetters('insuranceTypes', ['allInsuranceTypes']),
    insuranceTypes() {
      return this.allInsuranceTypes
    }
  },
  async mounted() {
    await this.fetchInsuranceTypes()
  },
  methods: {
    ...mapActions('insuranceTypes', ['fetchInsuranceTypes', 'createInsuranceType', 'updateInsuranceType']),
    editType(type) {
      this.editingType = type
      this.form = {
        name: type.name || '',
        description: type.description || '',
        baseRate: type.baseRate || 0.01,
        payoutCoeff: type.payoutCoeff || 0.8,
        agentPercentDefault: type.agentPercentDefault || 0.1
      }
      this.showModal = true
    },
    async saveType() {
      try {
        if (this.editingType) {
          await this.updateInsuranceType({
            id: this.editingType.insuranceTypeId,
            ...this.form
          })
        } else {
          await this.createInsuranceType(this.form)
        }
        this.closeModal()
        await this.fetchInsuranceTypes()
      } catch (error) {
        alert(error.error?.message || 'Error saving insurance type')
      }
    },
    closeModal() {
      this.showModal = false
      this.editingType = null
      this.form = {
        name: '',
        description: '',
        baseRate: 0.01,
        payoutCoeff: 0.8,
        agentPercentDefault: 0.1
      }
    }
  }
}
</script>

<style scoped>
.insurance-types-view {
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

.btn-primary, .btn-edit {
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
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  background-color: #3c3c3c;
  color: #cccccc;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #007acc;
}

.form-group textarea {
  resize: vertical;
  min-height: 60px;
}

.form-hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #858585;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}
</style>

