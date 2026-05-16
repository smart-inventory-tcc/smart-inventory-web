<script setup>
import { onMounted, ref } from 'vue'
import { itemApi, supplierApi } from '@/services/api'

const items = ref([])
const suppliers = ref([])
const editingId = ref(null)
const error = ref('')
const form = ref({
  barcode: '',
  name: '',
  price: '',
  stock: '',
  minStock: '',
  categoryId: '',
  supplierId: '',
  imageUrl: '',
})

async function loadData() {
  ;[items.value, suppliers.value] = await Promise.all([itemApi.list(), supplierApi.list()])
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
  }
}

function startEdit(item) {
  editingId.value = item.id
  form.value = {
    barcode: item.barcode,
    name: item.name,
    price: item.price,
    stock: item.stock,
    minStock: item.minStock,
    categoryId: item.categoryId || '',
    supplierId: item.supplierId || '',
    imageUrl: item.imageUrl || '',
  }
}

function normalizedPayload() {
  return {
    barcode: form.value.barcode,
    name: form.value.name,
    price: Number(form.value.price),
    stock: Number(form.value.stock),
    minStock: Number(form.value.minStock),
    categoryId: form.value.categoryId ? Number(form.value.categoryId) : null,
    supplierId: form.value.supplierId ? Number(form.value.supplierId) : null,
    imageUrl: form.value.imageUrl || null,
  }
}

async function submit() {
  error.value = ''
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
        <label>Kategori ID<input v-model="form.categoryId" type="number" min="1" /></label>
        <label>
          Supplier
          <select v-model="form.supplierId">
            <option value="">Tanpa supplier</option>
            <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">
              {{ supplier.name }}
            </option>
          </select>
        </label>
        <label>URL Gambar<input v-model="form.imageUrl" /></label>
        <p v-if="error" class="feedback error">{{ error }}</p>
        <div class="button-row">
          <button>{{ editingId ? 'Simpan Perubahan' : 'Tambah Barang' }}</button>
          <button v-if="editingId" type="button" class="secondary" @click="resetForm">Batal</button>
        </div>
      </form>

      <section class="panel">
        <div class="panel-heading">
          <h3>Daftar Barang</h3>
          <span>{{ items.length }} barang aktif</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Barcode</th>
                <th>Nama</th>
                <th>Stok</th>
                <th>Harga</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.id">
                <td>{{ item.barcode }}</td>
                <td>{{ item.name }}</td>
                <td>{{ item.stock }}</td>
                <td>Rp {{ Number(item.price).toLocaleString('id-ID') }}</td>
                <td>
                  <button class="table-action" @click="startEdit(item)">Ubah</button>
                  <button class="table-action danger" @click="remove(item.id)">Arsipkan</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>
  </div>
</template>
