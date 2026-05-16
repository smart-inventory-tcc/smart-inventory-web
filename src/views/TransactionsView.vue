<script setup>
import { ref } from 'vue'
import { itemApi, transactionApi } from '@/services/api'

const barcode = ref('')
const quantity = ref(1)
const item = ref(null)
const loading = ref(false)
const error = ref('')
const success = ref('')

async function findItem() {
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    item.value = await itemApi.getByBarcode(barcode.value.trim())
  } catch (err) {
    item.value = null
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function submit(type) {
  if (!item.value) return
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    if (type === 'in') {
      await transactionApi.stockIn(item.value.id, Number(quantity.value))
    } else {
      await transactionApi.stockOut(item.value.id, Number(quantity.value))
    }
    item.value = await itemApi.getByBarcode(item.value.barcode)
    success.value = `Transaksi ${type.toUpperCase()} berhasil dicatat.`
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Transaksi Stok</p>
        <h2>Alur yang sama seperti aplikasi mobile</h2>
      </div>
    </header>

    <section class="split-layout">
      <form class="panel form-panel" @submit.prevent="findItem">
        <h3>Cari Barang</h3>
        <label>Barcode<input v-model="barcode" required /></label>
        <button :disabled="loading">Cari</button>
      </form>

      <section class="panel">
        <div class="panel-heading">
          <h3>Barang Terpilih</h3>
          <span v-if="item">Stok: {{ item.stock }}</span>
        </div>

        <p v-if="!item" class="muted">Masukkan barcode untuk memulai transaksi.</p>

        <template v-else>
          <p><strong>{{ item.name }}</strong></p>
          <p class="muted">Barcode {{ item.barcode }} · Minimum stok {{ item.minStock }}</p>
          <label>Jumlah<input v-model="quantity" type="number" min="1" required /></label>
          <div class="button-row">
            <button :disabled="loading" @click="submit('in')">Barang Masuk</button>
            <button :disabled="loading" class="warning" @click="submit('out')">Barang Keluar</button>
          </div>
        </template>

        <p v-if="error" class="feedback error">{{ error }}</p>
        <p v-if="success" class="feedback success">{{ success }}</p>
      </section>
    </section>
  </div>
</template>
