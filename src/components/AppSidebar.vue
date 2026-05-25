<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSidebarStore } from '@/stores/sidebar'

const auth = useAuthStore()
const sidebar = useSidebarStore()
const router = useRouter()

function handleLogout() {
  auth.logout()
  router.replace('/login')
}
</script>

<template>
  <aside class="sidebar" :class="{ closed: !sidebar.isOpen }">
    <button class="sidebar-toggle" type="button" @click="sidebar.toggleSidebar" aria-label="Toggle sidebar">
      <svg v-if="sidebar.isOpen" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </button>

    <div class="sidebar-content">
      <div>
        <p class="eyebrow">Smart Inventory</p>
        <h1>Control Center</h1>
      </div>

      <nav>
        <RouterLink to="/">Dashboard</RouterLink>
        <RouterLink to="/suppliers">Supplier</RouterLink>
        <RouterLink to="/items">Barang</RouterLink>
        <RouterLink to="/categories">Kategori</RouterLink>
        <RouterLink v-if="auth.user?.role === 'OWNER'" to="/accounts">Manajemen Akun</RouterLink>
        <RouterLink to="/audit">Audit Report</RouterLink>
      </nav>

      <footer>
        <strong>{{ auth.user?.username }}</strong>
        <span>{{ auth.user?.role }}</span>
        <button type="button" @click="handleLogout">Keluar</button>
      </footer>
    </div>
  </aside>
</template>
