<script setup>
import { computed, onMounted, ref } from 'vue'
import { analyticsApi, categoryApi, itemApi, transactionApi } from '@/services/api'

const summary = ref(null)
const items = ref([])
const categories = ref([])
const transactions = ref([])
const loading = ref(true)
const error = ref('')

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

const activeItems = computed(() => items.value.filter((item) => item.isActive !== false))
const totalStockUnits = computed(() =>
  activeItems.value.reduce((total, item) => total + Number(item.stock || 0), 0),
)
const inventoryValue = computed(() =>
  activeItems.value.reduce(
    (total, item) => total + Number(item.price || 0) * Number(item.stock || 0),
    0,
  ),
)
const lowStockItems = computed(() =>
  activeItems.value
    .filter((item) => Number(item.stock || 0) <= Number(item.minStock || 0))
    .sort(
      (a, b) =>
        Number(a.stock || 0) -
        Number(a.minStock || 0) -
        (Number(b.stock || 0) - Number(b.minStock || 0)),
    )
    .slice(0, 6),
)
const outOfStockCount = computed(
  () => activeItems.value.filter((item) => Number(item.stock || 0) <= 0).length,
)
const healthyStockCount = computed(() =>
  Math.max(
    0,
    activeItems.value.length - (summary.value?.lowStockCount ?? lowStockItems.value.length),
  ),
)
const lowStockPercent = computed(() => {
  if (!activeItems.value.length) return 0
  return Math.round(
    ((summary.value?.lowStockCount ?? lowStockItems.value.length) / activeItems.value.length) * 100,
  )
})
const movementTotal = computed(
  () => Number(summary.value?.todayIn || 0) + Number(summary.value?.todayOut || 0),
)
const netMovement = computed(
  () => Number(summary.value?.todayIn || 0) - Number(summary.value?.todayOut || 0),
)
const linkedSupplierCount = computed(
  () => new Set(activeItems.value.map((item) => item.supplierId).filter(Boolean)).size,
)
const categoryNameById = computed(() => {
  const names = new Map()

  for (const category of categories.value) {
    names.set(String(category.id), category.name)
  }

  return names
})
const categoryCount = computed(() => {
  const activeCategoryIds = new Set(activeItems.value.map((item) => item.categoryId).filter(Boolean))
  return categories.value.filter((category) => activeCategoryIds.has(category.id)).length
})
const topStockItems = computed(() =>
  [...activeItems.value].sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0)).slice(0, 5),
)
const recentTransactions = computed(() =>
  [...transactions.value]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5),
)
const stockHealthStatus = computed(() => {
  if (!activeItems.value.length) return 'Belum ada data barang'
  if (lowStockPercent.value === 0) return 'Semua stok berada di atas batas minimum'
  if (lowStockPercent.value < 20) return 'Mayoritas stok masih aman'
  return 'Perlu restock untuk beberapa barang prioritas'
})

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0))
}

function formatDate(value) {
  if (!value) return '-'
  return dateFormatter.format(new Date(value))
}

function transactionTypeLabel(type) {
  return String(type || '').toUpperCase() === 'IN' ? 'Masuk' : 'Keluar'
}

function categoryLabel(item) {
  if (!item.categoryId) return 'Tanpa kategori'
  return categoryNameById.value.get(String(item.categoryId)) || `Kategori ${item.categoryId}`
}

onMounted(async () => {
  try {
    const [summaryData, itemData, categoryData, transactionData] = await Promise.all([
      analyticsApi.summary(),
      itemApi.list(),
      categoryApi.list(),
      transactionApi.history(),
    ])
    summary.value = summaryData
    items.value = itemData
    categories.value = categoryData
    transactions.value = transactionData
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page">
    <header class="dashboard-hero">
      <div>
        <p class="eyebrow">Dashboard Analitik</p>
        <h2>Ringkasan inventori hari ini</h2>
        <p class="muted">
          Pantau pergerakan stok, nilai persediaan, dan barang yang perlu ditindaklanjuti.
        </p>
      </div>
      <div v-if="summary" class="hero-summary">
        <span>Pergerakan bersih</span>
        <strong>{{ netMovement >= 0 ? '+' : '' }}{{ netMovement }}</strong>
        <small>{{ movementTotal }} transaksi hari ini</small>
      </div>
    </header>

    <section v-if="loading" class="panel dashboard-loading">
      <strong>Memuat dashboard...</strong>
      <span class="muted">Mengambil ringkasan, stok barang, dan transaksi terbaru.</span>
    </section>
    <p v-else-if="error" class="feedback error">{{ error }}</p>

    <template v-else>
      <section class="dashboard-stats">
        <article class="stat-card featured">
          <span>Total Barang</span>
          <strong>{{ summary.totalItems }}</strong>
          <small>{{ totalStockUnits.toLocaleString('id-ID') }} unit tersimpan</small>
        </article>
        <article class="stat-card">
          <span>Total Supplier</span>
          <strong>{{ summary.totalSuppliers }}</strong>
          <small>{{ linkedSupplierCount }} supplier terhubung ke barang</small>
        </article>
        <article class="stat-card">
          <span>Barang Masuk Hari Ini</span>
          <strong>{{ summary.todayIn }}</strong>
          <small
            >{{ movementTotal ? Math.round((summary.todayIn / movementTotal) * 100) : 0 }}% dari
            transaksi harian</small
          >
        </article>
        <article class="stat-card">
          <span>Barang Keluar Hari Ini</span>
          <strong>{{ summary.todayOut }}</strong>
          <small
            >{{ movementTotal ? Math.round((summary.todayOut / movementTotal) * 100) : 0 }}% dari
            transaksi harian</small
          >
        </article>
        <article class="stat-card danger">
          <span>Stok Menipis</span>
          <strong>{{ summary.lowStockCount }}</strong>
          <small>{{ outOfStockCount }} barang habis</small>
        </article>
      </section>

      <section class="dashboard-grid">
        <article class="panel health-panel">
          <div class="panel-heading">
            <div>
              <h3>Kesehatan Stok</h3>
              <p class="muted">{{ stockHealthStatus }}</p>
            </div>
            <span class="health-score">{{ 100 - lowStockPercent }}%</span>
          </div>
          <div class="health-bar" aria-hidden="true">
            <span :style="{ width: `${Math.max(0, 100 - lowStockPercent)}%` }"></span>
          </div>
          <div class="health-metrics">
            <div>
              <span>Aman</span>
              <strong>{{ healthyStockCount }}</strong>
            </div>
            <div>
              <span>Menipis</span>
              <strong>{{ summary.lowStockCount }}</strong>
            </div>
            <div>
              <span>Kategori</span>
              <strong>{{ categoryCount }}</strong>
            </div>
          </div>
        </article>

        <article class="panel value-panel">
          <span>Estimasi Nilai Persediaan</span>
          <strong>{{ formatCurrency(inventoryValue) }}</strong>
          <p class="muted">Berdasarkan harga dan stok aktif saat ini.</p>
        </article>
      </section>

      <section class="dashboard-grid detail-grid">
        <article class="panel">
          <div class="panel-heading">
            <h3>Prioritas Restock</h3>
            <span>{{ lowStockItems.length }} barang</span>
          </div>
          <div v-if="lowStockItems.length" class="item-list">
            <div v-for="item in lowStockItems" :key="item.id" class="inventory-row">
              <div>
                <strong>{{ item.name }}</strong>
                <span class="muted">Minimum {{ item.minStock }} unit</span>
              </div>
              <span class="stock-pill danger">{{ item.stock }} tersisa</span>
            </div>
          </div>
          <p v-else class="muted">Tidak ada barang yang berada di bawah batas minimum.</p>
        </article>

        <article class="panel">
          <div class="panel-heading">
            <h3>Transaksi Terbaru</h3>
            <span>{{ transactions.length }} total</span>
          </div>
          <div v-if="recentTransactions.length" class="item-list">
            <div
              v-for="transaction in recentTransactions"
              :key="transaction.id"
              class="inventory-row"
            >
              <div>
                <strong>{{ transaction.itemName || `Barang #${transaction.itemId}` }}</strong>
                <span class="muted">{{ formatDate(transaction.createdAt) }}</span>
              </div>
              <span :class="['stock-pill', transaction.type === 'IN' ? 'in' : 'out']">
                {{ transactionTypeLabel(transaction.type) }} {{ transaction.quantity }}
              </span>
            </div>
          </div>
          <p v-else class="muted">Belum ada transaksi yang tercatat.</p>
        </article>
      </section>

      <section class="panel">
        <div class="panel-heading">
          <h3>Stok Terbesar</h3>
          <span>{{ activeItems.length }} barang aktif</span>
        </div>
        <div class="stock-ranking">
          <div v-for="item in topStockItems" :key="item.id" class="ranking-row">
            <div>
              <strong>{{ item.name }}</strong>
              <span class="muted">{{ categoryLabel(item) }}</span>
            </div>
            <div class="ranking-meter">
              <span
                :style="{
                  width: `${Math.min(100, (item.stock / Math.max(topStockItems[0]?.stock || 1, 1)) * 100)}%`,
                }"
              ></span>
            </div>
            <strong>{{ item.stock }}</strong>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.dashboard-hero {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 1rem;
}

.dashboard-hero h2 {
  margin-bottom: 0.35rem;
}

.dashboard-hero .muted {
  margin: 0;
  max-width: 620px;
}

.hero-summary,
.value-panel {
  border: 1px solid var(--line);
  border-radius: 1.25rem;
  padding: 1.1rem;
  background: var(--primary);
  color: var(--surface);
  box-shadow: var(--shadow);
}

.hero-summary {
  min-width: 220px;
  display: grid;
  align-content: center;
  gap: 0.2rem;
}

.hero-summary span,
.hero-summary small,
.value-panel span,
.value-panel p {
  color: rgba(255, 255, 255, 0.78);
}

.hero-summary strong {
  font-size: 2rem;
}

.dashboard-loading {
  display: grid;
  gap: 0.25rem;
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 1rem;
}

.stat-card {
  min-height: 128px;
}

.stat-card small {
  color: var(--muted);
}

.stat-card.featured {
  background: var(--card);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(280px, 0.8fr);
  gap: 1rem;
}

.detail-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.health-panel .panel-heading {
  margin-bottom: 1.25rem;
}

.health-panel p {
  margin: 0.3rem 0 0;
}

.health-score {
  border-radius: 999px;
  padding: 0.4rem 0.7rem;
  color: var(--surface);
  background: var(--secondary);
  font-weight: 800;
}

.health-bar {
  height: 0.85rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--card);
}

.health-bar span,
.ranking-meter span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--primary);
}

.health-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-top: 1rem;
}

.health-metrics div {
  border: 1px solid var(--line);
  border-radius: 0.9rem;
  padding: 0.9rem;
  background: var(--surface-soft);
}

.health-metrics span,
.value-panel span {
  display: block;
  margin-bottom: 0.2rem;
  font-size: 0.84rem;
}

.health-metrics strong,
.value-panel strong {
  font-size: 1.6rem;
}

.value-panel {
  display: grid;
  align-content: center;
  gap: 0.35rem;
}

.value-panel p {
  margin: 0;
}

.item-list {
  display: grid;
  gap: 0.75rem;
}

.inventory-row,
.ranking-row {
  display: grid;
  align-items: center;
  gap: 1rem;
}

.inventory-row {
  grid-template-columns: minmax(0, 1fr) auto;
  border-bottom: 1px solid var(--line);
  padding-bottom: 0.75rem;
}

.inventory-row:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.inventory-row div,
.ranking-row div:first-child {
  min-width: 0;
  display: grid;
  gap: 0.2rem;
}

.stock-pill {
  border-radius: 999px;
  padding: 0.3rem 0.65rem;
  color: var(--surface);
  background: var(--primary);
  font-size: 0.78rem;
  font-weight: 800;
  white-space: nowrap;
}

.stock-pill.danger {
  background: var(--danger);
}

.stock-pill.in {
  background: var(--primary);
}

.stock-pill.out {
  background: var(--secondary);
}

.stock-ranking {
  display: grid;
  gap: 0.9rem;
}

.ranking-row {
  grid-template-columns: minmax(160px, 1fr) minmax(160px, 2fr) auto;
}

.ranking-meter {
  height: 0.6rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--card);
}

@media (max-width: 1100px) {
  .dashboard-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .dashboard-hero {
    flex-direction: column;
  }

  .dashboard-stats,
  .health-metrics,
  .ranking-row {
    grid-template-columns: 1fr;
  }
}
</style>
