<template>
  <div class="login-container">
    <div class="login-card">
      <h2>Insurance System Login</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Email</label>
          <input v-model="email" type="email" required />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="password" type="password" required />
        </div>
        <div v-if="error" class="error-message">{{ error }}</div>
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'Login',
  data() {
    return {
      email: '',
      password: '',
      error: '',
      loading: false
    }
  },
  methods: {
    ...mapActions('auth', ['login']),
    async handleLogin() {
      this.error = ''
      this.loading = true
      try {
        await this.login({ email: this.email, password: this.password })
        this.$router.push('/dashboard')
      } catch (err) {
        this.error = err.error?.message || 'Login failed'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #1e1e1e;
}

.login-card {
  background: #252526;
  padding: 2.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  width: 100%;
  max-width: 400px;
  border: 1px solid #3e3e42;
}

.login-card h2 {
  margin-bottom: 1.5rem;
  text-align: center;
  color: #ffffff;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #cccccc;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  font-size: 1rem;
  background-color: #3c3c3c;
  color: #cccccc;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #007acc;
  background-color: #3c3c3c;
}

.form-group input::placeholder {
  color: #858585;
}

.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background-color: #007acc;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  font-weight: 500;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0e639c;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #3e3e42;
}

.error-message {
  color: #f48771;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: #3a1d1d;
  border-radius: 4px;
  border: 1px solid #5a1f1f;
  font-size: 0.9rem;
}
</style>

