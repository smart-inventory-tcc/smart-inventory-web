<script setup>
import { computed, onMounted, ref } from 'vue'
import { categoryApi, itemApi, supplierApi } from '@/services/api'

const items = ref([])
const suppliers = ref([])
const categories = ref([])
const editingId = ref(null)
const error = ref('')
const imageInput = ref(null)
const selectedImageName = ref('')
const selectedImagePreview = ref('')
const previewItem = ref(null)
const isPreparingImage = ref(false)
const selectedCategoryId = ref('')
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
const visibleItems = computed(() => {
  const filtered = selectedCategoryId.value
    ? items.value.filter((item) => String(item.categoryId || '') === selectedCategoryId.value)
    : [...items.value]

  return filtered.sort((a, b) => {
    const result = compareItems(a, b, sortKey.value)
    return sortDirection.value === 'asc' ? result : -result
  })
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

function startEdit(item) {
  editingId.value = item.id
  form.value = {
    barcode: item.barcode,
    name: item.name,
    price: item.price,
    stock: item.stock,
    minStock: item.minStock,
    categoryId: item.categoryId ? String(item.categoryId) : '',
    supplierId: item.supplierId || '',
    imageUrl: item.imageUrl || '',
    imageFile: '',
  }
  selectedImageName.value = item.imageUrl ? 'Gambar tersimpan' : ''
  selectedImagePreview.value = ''
  isPreparingImage.value = false
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

function sortValue(item, key) {
  if (key === 'category') return categoryLabel(item)
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

function normalizedPayload() {
  const imageFile = form.value.imageFile || selectedImagePreview.value || null

  const payload = {
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

  return payload
}

async function submit() {
  error.value = ''
  if (isPreparingImage.value) {
    error.value = 'Tunggu sampai gambar selesai disiapkan'
    return
  }

  try {
    if (editingId.value) {
      await itemApi.update(editingId.value, normalizedPayload())
    } else {
      await itemApi.create(normalizedPayload())
    }
    resetForm()
    await loadData()
  } catch (err) {
    error.value = err.message
  }
}

async function remove(id) {
  await itemApi.remove(id)
  await loadData()
}

onMounted(loadData)
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Manajemen Barang</p>
        <h2>Daftar dan perubahan barang</h2>
      </div>
    </header>

    <section class="split-layout">
      <form class="panel form-panel" @submit.prevent="submit">
        <h3>{{ editingId ? 'Ubah Barang' : 'Tambah Barang' }}</h3>
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
        <button v-if="formImagePreview" type="button" class="secondary clear-image" :disabled="isPreparingImage" @click="clearImage">
          Hapus gambar
        </button>
        <p v-if="error" class="feedback error">{{ error }}</p>
        <div class="button-row">
          <button :disabled="isPreparingImage">{{ editingId ? 'Simpan Perubahan' : 'Tambah Barang' }}</button>
          <button v-if="editingId" type="button" class="secondary" @click="resetForm">Batal</button>
        </div>
      </form>

      <section class="panel">
        <div class="panel-heading">
          <h3>Daftar Barang</h3>
          <div class="list-tools">
            <label>
              Kategori
              <select v-model="selectedCategoryId">
                <option value="">Semua kategori</option>
                <option v-for="category in categoryOptions" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </label>
            <span>{{ visibleItems.length }} dari {{ items.length }} barang aktif</span>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <button class="sort-button" type="button" @click="changeSort('barcode')">
                    Barcode <span>{{ sortIndicator('barcode') }}</span>
                  </button>
                </th>
                <th>
                  <button class="sort-button" type="button" @click="changeSort('name')">
                    Nama <span>{{ sortIndicator('name') }}</span>
                  </button>
                </th>
                <th>
                  <button class="sort-button" type="button" @click="changeSort('category')">
                    Kategori <span>{{ sortIndicator('category') }}</span>
                  </button>
                </th>
                <th>
                  <button class="sort-button" type="button" @click="changeSort('image')">
                    Gambar <span>{{ sortIndicator('image') }}</span>
                  </button>
                </th>
                <th>
                  <button class="sort-button" type="button" @click="changeSort('stock')">
                    Stok <span>{{ sortIndicator('stock') }}</span>
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
                <td>{{ item.barcode }}</td>
                <td>{{ item.name }}</td>
                <td>{{ categoryLabel(item) }}</td>
                <td>
                  <button
                    class="table-action"
                    :disabled="!item.imageUrl"
                    @click="openImagePreview(item)"
                  >
                    Lihat
                  </button>
                </td>
                <td>{{ item.stock }}</td>
                <td>Rp {{ Number(item.price).toLocaleString('id-ID') }}</td>
                <td>
                  <button class="table-action" @click="startEdit(item)">Ubah</button>
                  <button class="table-action danger" @click="remove(item.id)">Arsipkan</button>
                </td>
              </tr>
              <tr v-if="visibleItems.length === 0">
                <td colspan="7" class="empty-table">Tidak ada barang untuk filter ini</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

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
  min-height: 9.5rem;
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
  min-width: 190px;
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
  border-radius: 1rem;
  background: var(--surface);
  box-shadow: var(--shadow);
}

.modal-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.modal-heading h3 {
  margin: 0;
}

.image-modal > img {
  width: 100%;
  max-height: 68vh;
  object-fit: contain;
  border-radius: 0.8rem;
  background: var(--surface-soft);
}

@media (max-width: 640px) {
  .modal-heading {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
