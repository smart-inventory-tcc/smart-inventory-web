import { defineStore } from 'pinia'
import { authApi } from '@/services/api'

const tokenKey = 'smart_inventory_token'
const userKey = 'smart_inventory_user'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(tokenKey),
    user: JSON.parse(localStorage.getItem(userKey) || 'null'),
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
  },
  actions: {
    async login(credentials) {
      const data = await authApi.login(credentials)
      this.token = data.token
      this.user = data.user
      localStorage.setItem(tokenKey, data.token)
      localStorage.setItem(userKey, JSON.stringify(data.user))
    },
    async refreshProfile() {
      this.user = await authApi.profile()
      localStorage.setItem(userKey, JSON.stringify(this.user))
    },
    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem(tokenKey)
      localStorage.removeItem(userKey)
    },
  },
})
