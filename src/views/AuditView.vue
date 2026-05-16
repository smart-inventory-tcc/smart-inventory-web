<script setup>
import { onMounted, ref } from 'vue'
import { transactionApi } from '@/services/api'

const transactions = ref([])
const error = ref('')

async function loadData() {
  try {
    transactions.value = await transactionApi.history()
  } catch (err) {
    error.value = err.message
  }
}

onMounted(loadData)
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Audit Report</p>
        <h2>Riwayat transaksi stok</h2>
      </div>
    </header>

    <p v-if="error" class="feedback error">{{ error }}</p>

    <section class="panel">
        <div class="panel-heading">
          <h3>Riwayat Transaksi</h3>
          <span>{{ transactions.length }} catatan</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Barang ID</th>
                <th>User ID</th>
                <th>Tipe</th>
                <th>Jumlah</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="transaction in transactions" :key="transaction.id">
                <td>#{{ transaction.id }}</td>
                <td>{{ transaction.itemName || transaction.itemId }}</td>
                <td>{{ transaction.userName || transaction.userId }}</td>
                <td>
                  <span :class="['badge', transaction.type.toLowerCase()]">{{ transaction.type }}</span>
                </td>
                <td>{{ transaction.quantity }}</td>
                <td>{{ new Date(transaction.createdAt).toLocaleString('id-ID') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
  </div>
</template>
