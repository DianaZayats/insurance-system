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
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'InsuranceTypes',
  data() {
    return {
      showModal: false,
      editingType: null
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
    ...mapActions('insuranceTypes', ['fetchInsuranceTypes']),
    editType(type) {
      this.editingType = type
      this.showModal = true
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
</style>

