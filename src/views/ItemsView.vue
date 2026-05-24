<script setup>
import { computed, onMounted, ref } from 'vue'
import { categoryApi, itemApi, supplierApi, transactionApi } from '@/services/api'

const items = ref([])
const suppliers = ref([])
const categories = ref([])
const editingId = ref(null)
const error = ref('')
const success = ref('')
const imageInput = ref(null)
const selectedImageName = ref('')
const selectedImagePreview = ref('')
const previewItem = ref(null)
const isPreparingImage = ref(false)
const isItemModalOpen = ref(false)
const isStockModalOpen = ref(false)
const stockTarget = ref(null)
const stockQuantity = ref(1)
const selectedCategoryId = ref('')
const searchTerm = ref('')
const sortKey = ref('id')
const sortDirection = ref('asc')
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const maxImageDimension = 1280
const imageQuality = 0.82
const form = ref({
  barcode: '',
  name: '',
  price: '',
  stock: '',
  minStock: '',
  categoryId: '',
  supplierId: '',
  imageUrl: '',
  imageFile: '',
})

const formImagePreview = computed(() => selectedImagePreview.value || form.value.imageUrl || '')
const categoryOptions = computed(() =>
  categories.value.map((category) => ({
    id: String(category.id),
    name: category.name,
  })),
)
const categoryNameById = computed(() => {
  const names = new Map()

  for (const category of categories.value) {
    names.set(String(category.id), category.name)
  }

  return names
})
const supplierNameById = computed(() => {
  const names = new Map()

  for (const supplier of suppliers.value) {
    names.set(String(supplier.id), supplier.name)
  }

  return names
})
const visibleItems = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()
  const filtered = items.value.filter((item) => {
    const matchesCategory = selectedCategoryId.value
      ? String(item.categoryId || '') === selectedCategoryId.value
      : true
    const matchesSearch = keyword
      ? [item.name, item.barcode, categoryLabel(item), supplierLabel(item)]
          .join(' ')
          .toLowerCase()
          .includes(keyword)
      : true

    return matchesCategory && matchesSearch
  })

  return filtered.sort((a, b) => {
    const result = compareItems(a, b, sortKey.value)
    return sortDirection.value === 'asc' ? result : -result
  })
})
const itemStats = computed(() => {
  const outOfStock = items.value.filter((item) => Number(item.stock) <= 0).length
  const lowStock = items.value.filter(
    (item) => Number(item.stock) > 0 && Number(item.stock) <= Number(item.minStock),
  ).length

  return {
    total: items.value.length,
    categoryCount: categories.value.length,
    lowStock,
    outOfStock,
  }
})

async function loadData() {
  error.value = ''

  const [itemsResult, suppliersResult, categoriesResult] = await Promise.allSettled([
    itemApi.list(),
    supplierApi.list(),
    categoryApi.list(),
  ])

  if (itemsResult.status === 'fulfilled') {
    items.value = itemsResult.value
  } else {
    error.value = itemsResult.reason.message
  }

  if (suppliersResult.status === 'fulfilled') {
    suppliers.value = suppliersResult.value
  }

  if (categoriesResult.status === 'fulfilled') {
    categories.value = categoriesResult.value
  } else if (!error.value) {
    error.value = categoriesResult.reason.message
  }
}

function resetForm() {
  editingId.value = null
  form.value = {
    barcode: '',
    name: '',
    price: '',
    stock: '',
    minStock: '',
    categoryId: '',
    supplierId: '',
    imageUrl: '',
    imageFile: '',
  }
  selectedImageName.value = ''
  selectedImagePreview.value = ''
  isPreparingImage.value = false
  if (imageInput.value) imageInput.value.value = ''
}

function openCreateModal() {
  error.value = ''
  success.value = ''
  resetForm()
  isItemModalOpen.value = true
}

function closeItemModal() {
  isItemModalOpen.value = false
  resetForm()
}

function startEdit(item) {
  error.value = ''
  success.value = ''
  editingId.value = item.id
  form.value = {
    barcode: item.barcode,
    name: item.name,
    price: item.price,
    stock: item.stock,
    minStock: item.minStock,
    categoryId: item.categoryId ? String(item.categoryId) : '',
    supplierId: item.supplierId ? String(item.supplierId) : '',
    imageUrl: item.imageUrl || '',
    imageFile: '',
  }
  selectedImageName.value = item.imageUrl ? 'Gambar tersimpan' : ''
  selectedImagePreview.value = ''
  isPreparingImage.value = false
  isItemModalOpen.value = true
  if (imageInput.value) imageInput.value.value = ''
}

function triggerImageInput() {
  imageInput.value?.click()
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Gambar gagal dibaca'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Gambar gagal diproses'))
    image.src = src
  })
}

async function optimizeImage(file) {
  const source = await readFileAsDataUrl(file)

  if (file.type === 'image/gif') {
    return source
  }

  const image = await loadImage(source)
  const scale = Math.min(1, maxImageDimension / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  canvas.width = width
  canvas.height = height
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)

  return canvas.toDataURL('image/jpeg', imageQuality)
}

async function handleImageUpload(event) {
  const file = event.target.files?.[0]
  error.value = ''

  if (!file) return

  if (!allowedImageTypes.includes(file.type)) {
    error.value = 'Format gambar harus JPG, PNG, WEBP, atau GIF'
    event.target.value = ''
    return
  }

  try {
    isPreparingImage.value = true
    selectedImageName.value = 'Menyiapkan gambar...'
    const imageData = await optimizeImage(file)
    selectedImageName.value = file.name
    selectedImagePreview.value = imageData
    form.value.imageFile = imageData
    form.value.imageUrl = ''
  } catch (err) {
    error.value = err.message
    event.target.value = ''
  } finally {
    isPreparingImage.value = false
  }
}

function clearImage() {
  form.value.imageFile = ''
  form.value.imageUrl = ''
  selectedImageName.value = ''
  selectedImagePreview.value = ''
  isPreparingImage.value = false
  if (imageInput.value) imageInput.value.value = ''
}

function openImagePreview(item) {
  if (!item.imageUrl) return
  previewItem.value = item
}

function closeImagePreview() {
  previewItem.value = null
}

function categoryLabel(item) {
  if (!item.categoryId) return 'Tanpa kategori'
  return categoryNameById.value.get(String(item.categoryId)) || `Kategori ${item.categoryId}`
}

function supplierLabel(item) {
  if (!item.supplierId) return 'Tanpa supplier'
  return item.supplierName || supplierNameById.value.get(String(item.supplierId)) || `Supplier ${item.supplierId}`
}

function stockStatus(item) {
  if (Number(item.stock) <= 0) return { label: 'Habis', tone: 'danger' }
  if (Number(item.stock) <= Number(item.minStock)) return { label: 'Stok rendah', tone: 'warning' }
  return { label: 'Aman', tone: 'ok' }
}

function sortValue(item, key) {
  if (key === 'category') return categoryLabel(item)
  if (key === 'supplier') return supplierLabel(item)
  if (key === 'status') return stockStatus(item).label
  if (key === 'image') return item.imageUrl ? 1 : 0
  return item[key]
}

function compareItems(first, second, key) {
  const firstValue = sortValue(first, key)
  const secondValue = sortValue(second, key)

  if (typeof firstValue === 'number' && typeof secondValue === 'number') {
    return firstValue - secondValue
  }

  return String(firstValue ?? '').localeCompare(String(secondValue ?? ''), 'id-ID', {
    numeric: true,
    sensitivity: 'base',
  })
}

function changeSort(key) {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }

  sortKey.value = key
  sortDirection.value = 'asc'
}

function sortIndicator(key) {
  if (sortKey.value !== key) return ''
  return sortDirection.value === 'asc' ? 'ASC' : 'DESC'
}

function formatCurrency(value) {
  return `Rp ${Number(value).toLocaleString('id-ID')}`
}

function normalizedPayload() {
  const imageFile = form.value.imageFile || selectedImagePreview.value || null

  return {
    barcode: form.value.barcode,
    name: form.value.name,
    price: Number(form.value.price),
    stock: Number(form.value.stock),
    minStock: Number(form.value.minStock),
    categoryId: form.value.categoryId ? Number(form.value.categoryId) : null,
    supplierId: form.value.supplierId ? Number(form.value.supplierId) : null,
    imageUrl: imageFile ? null : form.value.imageUrl || null,
    imageFile,
  }
}

async function submit() {
  error.value = ''
  success.value = ''
  if (isPreparingImage.value) {
    error.value = 'Tunggu sampai gambar selesai disiapkan'
    return
  }

  try {
    if (editingId.value) {
      await itemApi.update(editingId.value, normalizedPayload())
      success.value = 'Barang berhasil diperbarui.'
    } else {
      await itemApi.create(normalizedPayload())
      success.value = 'Barang berhasil ditambahkan.'
    }
    closeItemModal()
    await loadData()
  } catch (err) {
    error.value = err.message
  }
}

function openStockModal(item) {
  error.value = ''
  success.value = ''
  stockTarget.value = item
  stockQuantity.value = 1
  isStockModalOpen.value = true
}

function closeStockModal() {
  isStockModalOpen.value = false
  stockTarget.value = null
  stockQuantity.value = 1
}

async function submitStockIn() {
  if (!stockTarget.value) return

  error.value = ''
  success.value = ''
  try {
    await transactionApi.stockIn(stockTarget.value.id, Number(stockQuantity.value))
    success.value = `Stok ${stockTarget.value.name} berhasil ditambah.`
    closeStockModal()
    await loadData()
  } catch (err) {
    error.value = err.message
  }
}

async function remove(id) {
  error.value = ''
  success.value = ''
  try {
    await itemApi.remove(id)
    success.value = 'Barang berhasil diarsipkan.'
    await loadData()
  } catch (err) {
    error.value = err.message
  }
}

onMounted(loadData)
</script>

<template>
  <div class="page">
    <header class="page-header inventory-header">
      <div>
        <p class="eyebrow">Manajemen Barang</p>
        <h2>Daftar dan perubahan barang</h2>
      </div>
      <button type="button" class="primary-action" @click="openCreateModal">Tambah Barang</button>
    </header>

    <p v-if="error && !isItemModalOpen && !isStockModalOpen" class="feedback error">{{ error }}</p>
    <p v-if="success && !isItemModalOpen && !isStockModalOpen" class="feedback success">{{ success }}</p>

    <section class="panel inventory-list">
      <div class="inventory-summary" aria-label="Ringkasan barang">
        <div>
          <span>Total barang</span>
          <strong>{{ itemStats.total }}</strong>
        </div>
        <div>
          <span>Kategori</span>
          <strong>{{ itemStats.categoryCount }}</strong>
        </div>
        <div>
          <span>Stok rendah</span>
          <strong>{{ itemStats.lowStock }}</strong>
        </div>
        <div>
          <span>Stok habis</span>
          <strong>{{ itemStats.outOfStock }}</strong>
        </div>
      </div>

      <div class="panel-heading inventory-toolbar">
        <div>
          <h3>Daftar Barang</h3>
          <span class="muted">{{ visibleItems.length }} dari {{ items.length }} barang aktif</span>
        </div>
        <div class="list-tools">
          <label>
            Cari
            <input v-model="searchTerm" placeholder="Nama, barcode, kategori" />
          </label>
          <label>
            Kategori
            <select v-model="selectedCategoryId">
              <option value="">Semua kategori</option>
              <option v-for="category in categoryOptions" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </label>
        </div>
      </div>

      <div class="table-wrap">
        <table class="inventory-table">
          <thead>
            <tr>
              <th>
                <button class="sort-button" type="button" @click="changeSort('name')">
                  Barang <span>{{ sortIndicator('name') }}</span>
                </button>
              </th>
              <th>
                <button class="sort-button" type="button" @click="changeSort('category')">
                  Kategori <span>{{ sortIndicator('category') }}</span>
                </button>
              </th>
              <th>
                <button class="sort-button" type="button" @click="changeSort('supplier')">
                  Supplier <span>{{ sortIndicator('supplier') }}</span>
                </button>
              </th>
              <th>
                <button class="sort-button" type="button" @click="changeSort('stock')">
                  Stok <span>{{ sortIndicator('stock') }}</span>
                </button>
              </th>
              <th>
                <button class="sort-button" type="button" @click="changeSort('status')">
                  Status <span>{{ sortIndicator('status') }}</span>
                </button>
              </th>
              <th>
                <button class="sort-button" type="button" @click="changeSort('price')">
                  Harga <span>{{ sortIndicator('price') }}</span>
                </button>
              </th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in visibleItems" :key="item.id">
              <td class="product-cell">
                <div class="product-info">
                  <button
                    class="product-thumb"
                    type="button"
                    :disabled="!item.imageUrl"
                    @click="openImagePreview(item)"
                  >
                    <img v-if="item.imageUrl" :src="item.imageUrl" alt="" />
                    <span v-else>{{ item.name.slice(0, 1).toUpperCase() }}</span>
                  </button>
                  <div>
                    <strong>{{ item.name }}</strong>
                    <small>{{ item.barcode }}</small>
                  </div>
                </div>
              </td>
              <td>{{ categoryLabel(item) }}</td>
              <td>{{ supplierLabel(item) }}</td>
              <td>
                <strong>{{ item.stock }}</strong>
                <small>Min {{ item.minStock }}</small>
              </td>
              <td>
                <span class="status-badge" :class="stockStatus(item).tone">
                  {{ stockStatus(item).label }}
                </span>
              </td>
              <td>{{ formatCurrency(item.price) }}</td>
              <td>
                <div class="action-group">
                  <button class="table-action action-main" @click="openStockModal(item)">Tambah Stok</button>
                  <div>
                    <button class="table-action" @click="startEdit(item)">Ubah</button>
                    <button class="table-action danger" @click="remove(item.id)">Arsipkan</button>
                  </div>
                </div>
              </td>
            </tr>
            <tr v-if="visibleItems.length === 0">
              <td colspan="7" class="empty-table">Tidak ada barang untuk filter ini</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="isItemModalOpen" class="modal-backdrop" role="presentation" @click.self="closeItemModal">
      <form class="image-modal item-modal" role="dialog" aria-modal="true" @submit.prevent="submit">
        <div class="modal-heading">
          <h3>{{ editingId ? 'Ubah Barang' : 'Tambah Barang' }}</h3>
          <button type="button" class="secondary" @click="closeItemModal">Tutup</button>
        </div>

        <div class="item-form-layout">
          <div class="modal-form-grid">
            <label>Barcode<input v-model="form.barcode" required :disabled="Boolean(editingId)" /></label>
            <label>Nama<input v-model="form.name" required /></label>
            <label>Harga<input v-model="form.price" type="number" min="0" required /></label>
            <label>Stok Awal<input v-model="form.stock" type="number" min="0" required :disabled="Boolean(editingId)" /></label>
            <label>Minimal Stok<input v-model="form.minStock" type="number" min="0" required /></label>
            <label>
              Kategori
              <select v-model="form.categoryId">
                <option value="">Tanpa kategori</option>
                <option v-for="category in categoryOptions" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </label>
            <label>
              Supplier
              <select v-model="form.supplierId">
                <option value="">Tanpa supplier</option>
                <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">
                  {{ supplier.name }}
                </option>
              </select>
            </label>
          </div>

          <label class="upload-label">
            Gambar Barang
            <input ref="imageInput" class="sr-only" type="file" accept="image/*" @change="handleImageUpload" />
            <button class="image-upload" type="button" :disabled="isPreparingImage" @click="triggerImageInput">
              <span v-if="formImagePreview" class="image-thumb">
                <img :src="formImagePreview" alt="" />
              </span>
              <span v-else class="image-placeholder">Pilih gambar</span>
              <strong>{{ selectedImageName || 'Upload gambar barang' }}</strong>
            </button>
          </label>
        </div>

        <button v-if="formImagePreview" type="button" class="secondary clear-image" :disabled="isPreparingImage" @click="clearImage">
          Hapus gambar
        </button>
        <p v-if="error" class="feedback error">{{ error }}</p>
        <div class="button-row">
          <button :disabled="isPreparingImage">{{ editingId ? 'Simpan Perubahan' : 'Tambah Barang' }}</button>
          <button type="button" class="secondary" @click="closeItemModal">Batal</button>
        </div>
      </form>
    </div>

    <div v-if="isStockModalOpen" class="modal-backdrop" role="presentation" @click.self="closeStockModal">
      <form class="image-modal stock-modal" role="dialog" aria-modal="true" @submit.prevent="submitStockIn">
        <div class="modal-heading">
          <h3>Tambah Stok</h3>
          <button type="button" class="secondary" @click="closeStockModal">Tutup</button>
        </div>
        <div v-if="stockTarget" class="stock-summary">
          <strong>{{ stockTarget.name }}</strong>
          <span>Stok saat ini: {{ stockTarget.stock }}</span>
        </div>
        <label>Jumlah<input v-model="stockQuantity" type="number" min="1" required /></label>
        <p v-if="error" class="feedback error">{{ error }}</p>
        <div class="button-row">
          <button>Tambah Stok</button>
          <button type="button" class="secondary" @click="closeStockModal">Batal</button>
        </div>
      </form>
    </div>

    <div v-if="previewItem" class="modal-backdrop" role="presentation" @click.self="closeImagePreview">
      <section class="image-modal" role="dialog" aria-modal="true" :aria-label="`Gambar ${previewItem.name}`">
        <div class="modal-heading">
          <h3>{{ previewItem.name }}</h3>
          <button type="button" class="secondary" @click="closeImagePreview">Tutup</button>
        </div>
        <img :src="previewItem.imageUrl" :alt="`Gambar ${previewItem.name}`" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.inventory-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.primary-action {
  min-width: 9.5rem;
}

.inventory-list {
  min-width: 0;
  display: grid;
  gap: 1.1rem;
}

.inventory-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}

.inventory-summary div {
  min-height: 4.6rem;
  display: grid;
  align-content: center;
  gap: 0.25rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--line);
  border-radius: 0.8rem;
  background: var(--surface-soft);
}

.inventory-summary span {
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.inventory-summary strong {
  font-size: 1.55rem;
  line-height: 1;
}

.inventory-toolbar {
  align-items: end;
  margin-bottom: 0;
}

.upload-label {
  gap: 0.55rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.image-upload {
  width: 100%;
  min-height: 14.5rem;
  display: grid;
  place-items: center;
  gap: 0.75rem;
  border: 1px dashed var(--brand);
  border-radius: 0.8rem;
  color: var(--ink);
  background: var(--surface-soft);
}

.image-upload:hover {
  color: var(--surface);
}

.image-upload strong {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-placeholder {
  width: 5rem;
  height: 5rem;
  display: grid;
  place-items: center;
  border-radius: 0.8rem;
  border: 1px solid var(--line);
  color: var(--muted);
  background: var(--surface);
}

.image-thumb {
  width: min(100%, 12rem);
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 0.8rem;
  border: 1px solid var(--line);
  background: var(--surface);
}

.image-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.clear-image {
  width: fit-content;
}

.list-tools {
  display: flex;
  align-items: end;
  justify-content: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
}

.list-tools label {
  min-width: 220px;
}

.inventory-table {
  min-width: 980px;
}

.inventory-table th {
  white-space: nowrap;
}

.inventory-table td {
  vertical-align: middle;
}

.sort-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.35rem;
  padding: 0;
  color: var(--muted);
  background: transparent;
  font-size: 0.82rem;
  font-weight: 700;
}

.sort-button:hover {
  color: var(--brand-dark);
  background: transparent;
}

.sort-button span {
  color: var(--brand);
  font-size: 0.68rem;
}

.product-cell {
  min-width: 260px;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.product-thumb {
  width: 3.2rem;
  height: 3.2rem;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  overflow: hidden;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 0.7rem;
  color: var(--muted);
  background: var(--surface-soft);
  font-weight: 800;
}

.product-thumb:hover {
  color: var(--surface);
}

.product-thumb:disabled {
  opacity: 1;
}

.product-thumb:disabled:hover {
  color: var(--muted);
  background: var(--surface-soft);
}

.product-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

td strong,
td small {
  display: block;
}

td small {
  margin-top: 0.2rem;
  color: var(--muted);
  font-size: 0.78rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 1.8rem;
  border-radius: 999px;
  padding: 0.25rem 0.65rem;
  font-size: 0.78rem;
  font-weight: 700;
}

.status-badge.ok {
  color: var(--surface);
  background: var(--primary);
}

.status-badge.warning {
  color: var(--ink);
  background: #f4c55b;
}

.status-badge.danger {
  color: var(--surface);
  background: var(--danger);
}

.action-group {
  min-width: 170px;
  display: grid;
  gap: 0.45rem;
}

.action-group > div {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.action-main {
  width: fit-content;
}

.empty-table {
  color: var(--muted);
  text-align: center;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

button:disabled:hover {
  background: var(--brand);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: rgba(21, 25, 34, 0.55);
}

.image-modal {
  width: min(100%, 720px);
  max-height: min(88vh, 760px);
  display: grid;
  gap: 1rem;
  padding: 1rem;
  overflow: auto;
  border-radius: 1rem;
  background: var(--surface);
  box-shadow: var(--shadow);
}

.item-modal {
  width: min(100%, 860px);
}

.stock-modal {
  width: min(100%, 430px);
}

.item-form-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 1rem;
  align-items: start;
}

.modal-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.modal-heading,
.stock-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.modal-heading h3 {
  margin: 0;
}

.stock-summary {
  align-items: flex-start;
  flex-direction: column;
  gap: 0.25rem;
  color: var(--muted);
}

.stock-summary strong {
  color: var(--ink);
}

.image-modal > img {
  width: 100%;
  max-height: 68vh;
  object-fit: contain;
  border-radius: 0.8rem;
  background: var(--surface-soft);
}

@media (max-width: 760px) {
  .inventory-header,
  .panel-heading,
  .modal-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .inventory-summary,
  .item-form-layout,
  .modal-form-grid {
    grid-template-columns: 1fr;
  }

  .list-tools,
  .list-tools label {
    width: 100%;
  }

  .primary-action {
    width: 100%;
  }
}
</style>
