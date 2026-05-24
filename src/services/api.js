const legacyBaseUrl = import.meta.env.VITE_API_URL
const isLegacyApi = Boolean(legacyBaseUrl)

const serviceUrls = {
  identity: import.meta.env.VITE_IDENTITY_API_URL || 'http://localhost:3001',
  inventory: import.meta.env.VITE_INVENTORY_API_URL || 'http://localhost:3002',
  intelligence: import.meta.env.VITE_INTELLIGENCE_API_URL || 'http://localhost:3003',
}

function baseUrlFor(service) {
  return isLegacyApi ? legacyBaseUrl : serviceUrls[service]
}

function token() {
  return localStorage.getItem('smart_inventory_token')
}

async function request(service, path, options = {}) {
  const response = await fetch(`${baseUrlFor(service)}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...options.headers,
    },
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('smart_inventory_token')
      localStorage.removeItem('smart_inventory_user')
    }
    throw new Error(payload.message || payload.error || 'Terjadi kesalahan pada server')
  }

  return payload.data ?? payload
}

function normalizeUser(user) {
  if (!user) return user
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name ?? null,
    email: user.email ?? null,
    createdAt: user.createdAt ?? user.created_at ?? null,
  }
}

function normalizeSupplier(supplier) {
  return {
    id: supplier.id,
    name: supplier.name,
    phone: supplier.phone ?? '',
    address: supplier.address ?? '',
    email: supplier.email ?? '',
    createdAt: supplier.createdAt ?? supplier.created_at ?? null,
  }
}

function normalizeCategory(category) {
  return {
    id: category.id,
    name: category.name ?? category.categoryName ?? category.category_name ?? '',
    description: category.description ?? '',
    itemCount: category.itemCount ?? category.item_count ?? category._count?.items ?? 0,
    createdAt: category.createdAt ?? category.created_at ?? null,
  }
}

function normalizeItem(item) {
  const category = item.category ?? null

  return {
    id: item.id,
    barcode: item.barcode,
    name: item.name,
    price: Number(item.price ?? 0),
    stock: Number(item.stock ?? 0),
    minStock: Number(item.minStock ?? item.min_stock ?? 0),
    categoryId: item.categoryId ?? item.category_id ?? null,
    categoryName:
      item.categoryName ??
      item.category_name ??
      category?.categoryName ??
      category?.category_name ??
      null,
    supplierId: item.supplierId ?? item.supplier_id ?? null,
    supplierName: item.supplierName ?? item.supplier_name ?? item.supplier?.name ?? null,
    imageUrl: item.imageUrl ?? item.image_url ?? null,
    isActive: item.isActive ?? true,
  }
}

function normalizeTransaction(transaction) {
  return {
    id: transaction.id,
    itemId: transaction.itemId ?? transaction.item_id,
    itemName: transaction.itemName ?? transaction.item_name ?? null,
    userId: transaction.userId ?? transaction.user_id,
    userName: transaction.userName ?? transaction.user_name ?? null,
    type: transaction.type,
    quantity: Number(transaction.quantity ?? 0),
    createdAt: transaction.createdAt ?? transaction.created_at,
  }
}

function toItemPayload(body) {
  if (!isLegacyApi) return body

  return {
    barcode: body.barcode,
    name: body.name,
    price: body.price,
    stock: body.stock,
    min_stock: body.minStock,
    category_id: body.categoryId,
    supplier_id: body.supplierId,
    image_url: body.imageUrl,
    image_file: body.imageFile,
  }
}

export const apiMode = isLegacyApi ? 'legacy' : 'microservices'

export const authApi = {
  async register(body) {
    const data = await request('identity', '/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return normalizeUser(data)
  },
  async login(body) {
    const data = await request('identity', '/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return {
      token: data.token,
      user: normalizeUser(data.user),
    }
  },
  async profile() {
    return normalizeUser(await request('identity', '/auth/profile'))
  },
}

export const supplierApi = {
  async list() {
    const data = await request('identity', '/suppliers')
    return data.map(normalizeSupplier)
  },
  async create(body) {
    return normalizeSupplier(
      await request('identity', '/suppliers', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    )
  },
  async update(id, body) {
    return normalizeSupplier(
      await request('identity', `/suppliers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    )
  },
}

export const categoryApi = {
  async list() {
    const data = await request('inventory', '/categories')
    return data.map(normalizeCategory)
  },
  async create(body) {
    return normalizeCategory(
      await request('inventory', '/categories', {
        method: 'POST',
        body: JSON.stringify({
          categoryName: body.name,
          description: body.description,
        }),
      }),
    )
  },
  async update(id, body) {
    return normalizeCategory(
      await request('inventory', `/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          categoryName: body.name,
          description: body.description,
        }),
      }),
    )
  },
  remove: (id) =>
    request('inventory', `/categories/${id}`, {
      method: 'DELETE',
    }),
}

export const itemApi = {
  async list() {
    const data = await request('inventory', '/items')
    return data.map(normalizeItem)
  },
  async getByBarcode(barcode) {
    const path = isLegacyApi ? `/items/${barcode}` : `/items/barcode/${barcode}`
    return normalizeItem(await request('inventory', path))
  },
  async create(body) {
    return normalizeItem(
      await request('inventory', '/items', {
        method: 'POST',
        body: JSON.stringify(toItemPayload(body)),
      }),
    )
  },
  async update(id, body) {
    return normalizeItem(
      await request('inventory', `/items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(toItemPayload(body)),
      }),
    )
  },
  remove: (id) =>
    request('inventory', `/items/${id}`, {
      method: 'DELETE',
    }),
}

export const transactionApi = {
  async history() {
    const data = await request('inventory', '/transactions/history')
    return data.map(normalizeTransaction)
  },
  stockIn: (itemId, quantity) =>
    request('inventory', '/transactions/in', {
      method: 'POST',
      body: JSON.stringify(isLegacyApi ? { item_id: itemId, quantity } : { itemId, quantity }),
    }),
  stockOut: (itemId, quantity) =>
    request('inventory', '/transactions/out', {
      method: 'POST',
      body: JSON.stringify(isLegacyApi ? { item_id: itemId, quantity } : { itemId, quantity }),
    }),
}

export const analyticsApi = {
  async summary() {
    const data = await request('intelligence', '/analytics/summary')

    if (!isLegacyApi) return data

    return {
      totalItems: data.items ?? 0,
      totalSuppliers: data.suppliers ?? 0,
      todayIn: 0,
      todayOut: 0,
      lowStockCount: data.lowStock?.length ?? 0,
    }
  },
}
