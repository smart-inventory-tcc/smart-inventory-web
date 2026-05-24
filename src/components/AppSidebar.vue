<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

function handleLogout() {
  auth.logout()
  router.replace('/login')
}
</script>

<template>
  <aside class="sidebar">
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
  </aside>
</template>
