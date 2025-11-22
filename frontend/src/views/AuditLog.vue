<template>
  <div class="audit-log-view">
    <div class="header">
      <h1>Audit Log</h1>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>Changed At</th>
          <th>Entity</th>
          <th>Action</th>
          <th>Entity ID</th>
          <th>Changed By</th>
          <th>Payload</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="log in auditLogs" :key="log.logId">
          <td>{{ log.changedAt }}</td>
          <td>{{ log.entity }}</td>
          <td>{{ log.action }}</td>
          <td>{{ log.entityId }}</td>
          <td>{{ log.changedBy || '-' }}</td>
          <td class="payload-cell">{{ formatPayload(log.payload) }}</td>
        </tr>
        <tr v-if="auditLogs.length === 0">
          <td colspan="6" class="no-data">No audit log entries found</td>
        </tr>
      </tbody>
    </table>

    <div class="pagination">
      <button @click="changePage(-1)" :disabled="pagination.page === 1">Previous</button>
      <span>Page {{ pagination.page }} of {{ pagination.totalPages }}</span>
      <button @click="changePage(1)" :disabled="pagination.page >= pagination.totalPages">Next</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'AuditLog',
  data() {
    return {
      auditLogs: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1
      }
    }
  },
  async mounted() {
    await this.fetchAuditLogs()
  },
  methods: {
    async fetchAuditLogs() {
      try {
        const params = {
          page: this.pagination.page,
          limit: this.pagination.limit
        }

        const response = await axios.get('/audit-logs', { params })
        this.auditLogs = response.data.data
        this.pagination = response.data.pagination
      } catch (error) {
        // Safely extract error message without circular references
        let errorMessage = 'Error loading audit logs'
        try {
          if (error.response?.status === 403) {
            errorMessage = 'Access denied. Admin role required.'
          } else if (error.response?.data?.error?.message) {
            errorMessage = String(error.response.data.error.message)
          } else if (error.message) {
            errorMessage = String(error.message)
          }
        } catch (e) {
          // If error extraction fails, use default message
          console.error('Error parsing error response:', e)
        }
        alert(errorMessage)
      }
    },
    changePage(delta) {
      this.pagination.page += delta
      this.fetchAuditLogs()
    },
    formatPayload(payload) {
      if (!payload) return '-'
      try {
        // If payload is already a string, try to parse and format it
        if (typeof payload === 'string') {
          try {
            const parsed = JSON.parse(payload)
            return JSON.stringify(parsed, null, 2)
          } catch {
            // If parsing fails, return as-is
            return payload
          }
        }
        // If payload is an object, stringify it (with circular reference protection)
        const seen = new WeakSet()
        return JSON.stringify(payload, (key, val) => {
          if (val != null && typeof val === 'object') {
            if (seen.has(val)) {
              return '[Circular]'
            }
            seen.add(val)
          }
          return val
        }, 2)
      } catch (err) {
        // Fallback: return string representation
        return String(payload)
      }
    }
  }
}
</script>

<style scoped>
.audit-log-view {
  padding: 2rem;
}

.header {
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
  font-size: 0.9rem;
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
  position: sticky;
  top: 0;
}

.data-table tr:hover {
  background-color: #2a2d2e;
}

.payload-cell {
  max-width: 300px;
  word-break: break-all;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  white-space: pre-wrap;
}

.no-data {
  text-align: center;
  color: #858585;
  font-style: italic;
  padding: 2rem;
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
  font-size: 0.9rem;
}

.pagination button:hover:not(:disabled) {
  background-color: #4a4a4a;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

