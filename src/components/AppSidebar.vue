<script setup>
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
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
      <RouterLink to="/transactions">Transaksi</RouterLink>
      <RouterLink to="/audit">Audit Report</RouterLink>
    </nav>

    <footer>
      <strong>{{ auth.user?.username }}</strong>
      <span>{{ auth.user?.role }}</span>
      <button type="button" @click="auth.logout()">Keluar</button>
    </footer>
  </aside>
</template>
