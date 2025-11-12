<template>
  <div class="dashboard">
    <h1>Dashboard</h1>
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Total Clients</h3>
        <p class="stat-value">{{ stats.clients || '-' }}</p>
      </div>
      <div class="stat-card">
        <h3>Active Contracts</h3>
        <p class="stat-value">{{ stats.contracts || '-' }}</p>
      </div>
      <div class="stat-card">
        <h3>Insurance Cases</h3>
        <p class="stat-value">{{ stats.cases || '-' }}</p>
      </div>
      <div class="stat-card">
        <h3>Agents</h3>
        <p class="stat-value">{{ stats.agents || '-' }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Dashboard',
  data() {
    return {
      stats: {}
    }
  },
  async mounted() {
    try {
      // Fetch basic stats
      const [clients, contracts, cases, agents] = await Promise.all([
        axios.get('/clients', { params: { limit: 1 } }),
        axios.get('/contracts', { params: { status: 'Active', limit: 1 } }),
        axios.get('/cases', { params: { limit: 1 } }),
        axios.get('/agents', { params: { limit: 1 } })
      ])
      this.stats = {
        clients: clients.data.pagination.total,
        contracts: contracts.data.pagination.total,
        cases: cases.data.pagination.total,
        agents: agents.data.pagination.total
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error)
    }
  }
}
</script>

<style scoped>
.dashboard {
  padding: 2rem;
}

.dashboard h1 {
  margin-bottom: 2rem;
  color: #ffffff;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: #252526;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  border: 1px solid #3e3e42;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  border-color: #007acc;
}

.stat-card h3 {
  color: #858585;
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 600;
  color: #007acc;
}
</style>

