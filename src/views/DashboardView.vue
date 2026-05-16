<script setup>
import { onMounted, ref } from 'vue'
import { analyticsApi } from '@/services/api'

const summary = ref(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    summary.value = await analyticsApi.summary()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Dashboard Analitik</p>
        <h2>Ringkasan inventori hari ini</h2>
      </div>
    </header>

    <p v-if="loading">Memuat ringkasan...</p>
    <p v-else-if="error" class="feedback error">{{ error }}</p>

    <template v-else>
      <section class="stats-grid">
        <article class="stat-card">
          <span>Total Barang</span>
          <strong>{{ summary.totalItems }}</strong>
        </article>
        <article class="stat-card">
          <span>Total Supplier</span>
          <strong>{{ summary.totalSuppliers }}</strong>
        </article>
        <article class="stat-card">
          <span>Barang Masuk Hari Ini</span>
          <strong>{{ summary.todayIn }}</strong>
        </article>
        <article class="stat-card">
          <span>Barang Keluar Hari Ini</span>
          <strong>{{ summary.todayOut }}</strong>
        </article>
        <article class="stat-card danger">
          <span>Stok Menipis</span>
          <strong>{{ summary.lowStockCount }}</strong>
        </article>
      </section>
    </template>
  </div>
</template>
