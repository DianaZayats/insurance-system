import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import axios from 'axios'

// Configure axios
// In dev: use relative path to leverage Vite proxy
// In prod: use full URL from env or default
const apiBase = import.meta.env.VITE_API_BASE 
  ? `${import.meta.env.VITE_API_BASE}/api/v1`
  : (import.meta.env.DEV ? '/api/v1' : 'http://localhost:3000/api/v1')
axios.defaults.baseURL = apiBase
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

const app = createApp(App)
app.use(store)
app.use(router)
app.mount('#app')

