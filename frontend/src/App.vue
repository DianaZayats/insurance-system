<template>
  <div id="app">
    <nav v-if="isAuthenticated" class="navbar">
      <div class="nav-container">
        <h1 class="nav-title">Insurance System</h1>
        <div class="nav-links">
          <router-link to="/dashboard">Dashboard</router-link>
          <router-link to="/clients">Clients</router-link>
          <router-link to="/agents">Agents</router-link>
          <router-link to="/insurance-types">Insurance Types</router-link>
          <router-link to="/contracts">Contracts</router-link>
          <router-link to="/cases">Cases</router-link>
          <router-link to="/reports">Reports</router-link>
          <router-link to="/audit-log">Audit Log</router-link>
          <span class="user-info">{{ currentUser?.email }} ({{ currentUser?.role }})</span>
          <button @click="logout" class="btn-logout">Logout</button>
        </div>
      </div>
    </nav>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'App',
  computed: {
    ...mapGetters('auth', ['isAuthenticated', 'currentUser'])
  },
  methods: {
    ...mapActions('auth', ['logout'])
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background-color: #1e1e1e;
  color: #cccccc;
  min-height: 100vh;
}

#app {
  min-height: 100vh;
  background-color: #1e1e1e;
}

.navbar {
  background-color: #252526;
  color: #cccccc;
  padding: 1rem 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  border-bottom: 1px solid #3e3e42;
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
}

.nav-links {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.nav-links a {
  color: #cccccc;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.2s;
  font-size: 0.9rem;
}

.nav-links a:hover {
  background-color: #2a2d2e;
}

.nav-links a.router-link-active {
  background-color: #094771;
  color: #ffffff;
}

.user-info {
  margin-left: 1rem;
  font-size: 0.85rem;
  color: #858585;
  padding: 0.5rem 1rem;
}

.btn-logout {
  background-color: #0e639c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.9rem;
}

.btn-logout:hover {
  background-color: #1177bb;
}

.main-content {
  max-width: 1400px;
  margin: 2rem auto;
  padding: 0 2rem;
  min-height: calc(100vh - 80px);
}
</style>

