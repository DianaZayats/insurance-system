<template>
  <div class="reports-view">
    <h1>Reports</h1>
    
    <div class="reports-grid">
      <div class="report-card">
        <h3>Max Contribution Month</h3>
        <p v-if="maxMonth">{{ maxMonth.month }}: ${{ maxMonth.totalContributions?.toLocaleString() }}</p>
        <button @click="loadMaxMonth" class="btn-primary">Load</button>
        <button @click="exportReport('max-contribution-month')" class="btn-export">Export CSV</button>
      </div>

      <div class="report-card">
        <h3>Agent Income (Previous Month)</h3>
        <input v-model="incomeMonth" type="month" placeholder="YYYY-MM" />
        <button @click="loadAgentIncome" class="btn-primary">Load</button>
        <button @click="exportReport('agent-income', { month: incomeMonth })" class="btn-export">Export CSV</button>
        <div v-if="agentIncome" class="report-data">
          <div v-for="item in agentIncome.data" :key="item.agentId" class="report-item">
            {{ item.fullName }}: ${{ item.totalIncome?.toLocaleString() }}
          </div>
        </div>
      </div>

      <div class="report-card">
        <h3>Most Demanded Type Per Client</h3>
        <button @click="loadMostDemanded" class="btn-primary">Load</button>
        <button @click="exportReport('most-demanded-type-per-client')" class="btn-export">Export CSV</button>
        <div v-if="mostDemanded" class="report-data">
          <div v-for="item in mostDemanded.data.slice(0, 10)" :key="item.clientId" class="report-item">
            {{ item.lastName }}, {{ item.firstName }}: {{ item.typeName }}
          </div>
        </div>
      </div>

      <div class="report-card">
        <h3>Active Contracts</h3>
        <input v-model="activeClientId" type="number" placeholder="Client ID" />
        <button @click="loadActiveContracts" class="btn-primary">Load</button>
        <button @click="exportReport('active-contracts', { clientId: activeClientId })" class="btn-export">Export CSV</button>
        <div v-if="activeContracts" class="report-data">
          <div v-for="item in activeContracts.data" :key="item.contractId" class="report-item">
            Contract {{ item.contractId }}: ${{ item.insuranceAmount?.toLocaleString() }}
          </div>
        </div>
      </div>

      <div class="report-card">
        <h3>Case Extremes</h3>
        <select v-model="caseMode">
          <option value="most">Most Cases</option>
          <option value="zero">Zero Cases</option>
        </select>
        <button @click="loadCaseExtremes" class="btn-primary">Load</button>
        <button @click="exportReport('case-extremes', { mode: caseMode })" class="btn-export">Export CSV</button>
        <div v-if="caseExtremes" class="report-data">
          <div v-for="item in caseExtremes.data.slice(0, 10)" :key="item.clientId" class="report-item">
            {{ item.lastName }}, {{ item.firstName }}: {{ item.caseCount }} cases
          </div>
        </div>
      </div>

      <div class="report-card">
        <h3>All Types Used Clients</h3>
        <button @click="loadAllTypesUsed" class="btn-primary">Load</button>
        <button @click="exportReport('all-types-used-clients')" class="btn-export">Export CSV</button>
        <div v-if="allTypesUsed" class="report-data">
          <div v-for="item in allTypesUsed.data" :key="item.clientId" class="report-item">
            {{ item.lastName }}, {{ item.firstName }}: {{ item.typesUsed }} types
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'Reports',
  data() {
    return {
      maxMonth: null,
      incomeMonth: '',
      agentIncome: null,
      mostDemanded: null,
      activeClientId: '',
      activeContracts: null,
      caseMode: 'most',
      caseExtremes: null,
      allTypesUsed: null
    }
  },
  methods: {
    ...mapActions('reports', [
      'fetchMaxContributionMonth',
      'fetchAgentIncome',
      'fetchMostDemandedTypePerClient',
      'fetchActiveContracts',
      'fetchCaseExtremes',
      'fetchAllTypesUsedClients',
      'exportReport'
    ]),
    async loadMaxMonth() {
      try {
        this.maxMonth = await this.fetchMaxContributionMonth()
      } catch (error) {
        alert(error.error?.message || 'Error loading report')
      }
    },
    async loadAgentIncome() {
      if (!this.incomeMonth) {
        alert('Please select a month')
        return
      }
      try {
        this.agentIncome = await this.fetchAgentIncome(this.incomeMonth)
      } catch (error) {
        alert(error.error?.message || 'Error loading report')
      }
    },
    async loadMostDemanded() {
      try {
        this.mostDemanded = await this.fetchMostDemandedTypePerClient()
      } catch (error) {
        alert(error.error?.message || 'Error loading report')
      }
    },
    async loadActiveContracts() {
      if (!this.activeClientId) {
        alert('Please enter a client ID')
        return
      }
      try {
        this.activeContracts = await this.fetchActiveContracts(this.activeClientId)
      } catch (error) {
        alert(error.error?.message || 'Error loading report')
      }
    },
    async loadCaseExtremes() {
      try {
        this.caseExtremes = await this.fetchCaseExtremes(this.caseMode)
      } catch (error) {
        alert(error.error?.message || 'Error loading report')
      }
    },
    async loadAllTypesUsed() {
      try {
        this.allTypesUsed = await this.fetchAllTypesUsedClients()
      } catch (error) {
        alert(error.error?.message || 'Error loading report')
      }
    },
    async exportReport(name, params = {}) {
      try {
        await this.$store.dispatch('reports/exportReport', { name, params })
      } catch (error) {
        alert(error.error?.message || 'Error exporting report')
      }
    }
  }
}
</script>

<style scoped>
.reports-view {
  padding: 2rem;
}

.reports-view h1 {
  color: #ffffff;
  font-weight: 600;
  margin-bottom: 1rem;
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.report-card {
  background: #252526;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  border: 1px solid #3e3e42;
}

.report-card h3 {
  margin-bottom: 1rem;
  color: #ffffff;
  font-weight: 600;
}

.report-card input,
.report-card select {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  background-color: #3c3c3c;
  color: #cccccc;
}

.report-card input:focus,
.report-card select:focus {
  outline: none;
  border-color: #007acc;
}

.report-card select {
  cursor: pointer;
}

.report-card button {
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}

.report-data {
  margin-top: 1rem;
  max-height: 300px;
  overflow-y: auto;
  background-color: #1e1e1e;
  border-radius: 4px;
  padding: 0.5rem;
  border: 1px solid #3e3e42;
}

.report-item {
  padding: 0.5rem;
  border-bottom: 1px solid #3e3e42;
  font-size: 0.9rem;
  color: #cccccc;
}

.report-item:last-child {
  border-bottom: none;
}

.btn-primary, .btn-export {
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

.btn-export {
  background-color: #27ae60;
  color: white;
}

.btn-export:hover {
  background-color: #2ecc71;
}
</style>

