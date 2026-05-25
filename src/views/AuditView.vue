<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { transactionApi, itemApi, userApi } from '@/services/api'

const transactions = ref([])
const items = ref([])
const users = ref([])
const error = ref('')
const currentPage = ref(1)
const pageSize = 25

const itemsMap = computed(() => {
  const map = {}
  for (const item of items.value) {
    map[item.id] = item
  }
  return map
})

const usersMap = computed(() => {
  const map = {}
  for (const user of users.value) {
    map[user.id] = user
  }
  return map
})

const pageCount = computed(() => Math.max(1, Math.ceil(transactions.value.length / pageSize)))
const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return transactions.value.slice(start, start + pageSize)
})
const pageRangeText = computed(() => {
  if (transactions.value.length === 0) return '0 catatan'

  const start = (currentPage.value - 1) * pageSize + 1
  const end = Math.min(currentPage.value * pageSize, transactions.value.length)
  return `${start}-${end} dari ${transactions.value.length} catatan`
})

function getBarcode(itemId) {
  return itemsMap.value[itemId]?.barcode || '-'
}

function getUsername(userId) {
  return usersMap.value[userId]?.username || userId
}

async function loadData() {
  try {
    const [txData, itemData, userData] = await Promise.all([
      transactionApi.history(),
      itemApi.list(),
      userApi.list()
    ])
    transactions.value = txData
    items.value = itemData
    users.value = userData
  } catch (err) {
    error.value = err.message
  }
}

function goToPage(page) {
  currentPage.value = Math.min(Math.max(page, 1), pageCount.value)
}

watch(pageCount, (nextPageCount) => {
  if (currentPage.value > nextPageCount) {
    currentPage.value = nextPageCount
  }
})

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
      <div class="panel-heading audit-heading">
        <div>
          <h3>Riwayat Transaksi</h3>
          <span class="muted">{{ pageRangeText }}</span>
        </div>
        <div v-if="pageCount > 1" class="pagination-tabs" role="tablist" aria-label="Halaman audit">
          <button type="button" class="secondary" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
            Sebelumnya
          </button>
          <button
            v-for="page in pageCount"
            :key="page"
            type="button"
            role="tab"
            :aria-selected="currentPage === page"
            :class="{ active: currentPage === page }"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
          <button type="button" class="secondary" :disabled="currentPage === pageCount" @click="goToPage(currentPage + 1)">
            Selanjutnya
          </button>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Barcode Barang</th>
              <th>User</th>
              <th>Tipe</th>
              <th>Jumlah</th>
              <th>Waktu</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="transaction in paginatedTransactions" :key="transaction.id">
              <td>#{{ transaction.id }}</td>
              <td>{{ getBarcode(transaction.itemId) }}</td>
              <td>{{ getUsername(transaction.userId) }}</td>
              <td>
                <span :class="['badge', transaction.type.toLowerCase()]">{{ transaction.type }}</span>
              </td>
              <td>{{ transaction.quantity }}</td>
              <td>{{ new Date(transaction.createdAt).toLocaleString('id-ID') }}</td>
            </tr>
            <tr v-if="paginatedTransactions.length === 0">
              <td colspan="6" class="empty-table">Belum ada riwayat transaksi</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.audit-heading {
  align-items: flex-start;
}

.audit-heading > div:first-child {
  display: grid;
  gap: 0.25rem;
}

.pagination-tabs {
  display: flex;
  justify-content: flex-end;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.pagination-tabs button {
  min-width: 2.5rem;
  padding: 0.55rem 0.75rem;
}

.pagination-tabs button.active {
  background: var(--brand-dark);
}

.pagination-tabs button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.empty-table {
  color: var(--muted);
  text-align: center;
}

@media (max-width: 760px) {
  .audit-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .pagination-tabs {
    justify-content: flex-start;
  }
}
</style>
