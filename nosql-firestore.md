# Dokumentasi Database NoSQL (Google Cloud Firestore)

Dokumen ini berisi spesifikasi struktur data (*schema*) koleksi Firestore yang digunakan dalam proyek **Smart Inventory**, lengkap dengan tipe data, contoh dokumen, serta panduan kode integrasi (*code snippet*) untuk Tim Web Developer (Frontend).

---

## 1. Daftar Koleksi Firestore (Collections Overview)

| Nama Koleksi | Tujuan Utama | Trigger Penggunaan |
| :--- | :--- | :--- |
| **`notifications`** | Push Notifikasi Stok Kritis | Ditulis oleh Backend saat transaksi keluar membuat stok $\le$ minimal. Dibaca real-time oleh Web Owner. |
| **`temp_scan_sessions`** | Sinkronisasi Barcode Scanner HP | Ditulis oleh HP Staff saat memindai barcode. Dibaca real-time oleh form transaksi Web Owner. |
| **`user_activity_logs`** | Log Audit Jejak Pengguna | Ditulis oleh Backend setiap kali terjadi aktivitas user (login, register, ganti password). |
| **`stock_cache`** | Cache Kecepatan Membaca Stok | Diperbarui secara asinkron oleh Backend. Dibaca instan oleh Katalog Mobile Staff. |
| **`system_config`** | Pengaturan Global Dinamis | Dokumen `global` berisi saklar sistem (On/Off notifikasi, Maintenance mode). |

---

## 2. Rincian Struktur Dokumen (Collection Details)

### A. Koleksi `notifications`
Menyimpan data alert real-time ketika stok produk berada di bawah batas minimum.

* **Path Dokumen:** `/notifications/{auto_id}`
* **Struktur Fields:**
  * `type` (String): Tipe alert, default: `"LOW_STOCK"`
  * `itemId` (Number): ID barang (berelasi dengan tabel SQL `items.id`)
  * `itemName` (String): Nama barang
  * `barcode` (String): Nomor barcode barang
  * `message` (String): Deskripsi pesan peringatan
  * `level` (String): Tingkat bahaya (`"warning"` jika stok $\le$ min_stock, `"danger"` jika stok $\le$ setengah dari min_stock)
  * `minStock` (Number): Batas minimal stok barang
  * `currentStock` (Number): Jumlah sisa stok saat ini
  * `isRead` (Boolean): Status dibaca oleh Owner (default: `false`)
  * `createdAt` (Timestamp): Waktu terjadinya alert (Firestore Server Timestamp)

* **Contoh Dokumen JSON:**
```json
{
  "type": "LOW_STOCK",
  "itemId": 42,
  "itemName": "Susu UHT Cokelat 250ml",
  "barcode": "8991234567890",
  "message": "Low stock alert for Susu UHT Cokelat 250ml. Current stock: 3",
  "level": "danger",
  "minStock": 10,
  "currentStock": 3,
  "isRead": false,
  "createdAt": "2026-05-25T15:26:29.973Z"
}
```

---

### B. Koleksi `temp_scan_sessions`
Digunakan untuk menjembatani komunikasi barcode scanner dari aplikasi mobile staff ke browser komputer kasir Owner.

* **Path Dokumen:** `/temp_scan_sessions/{sessionId}` (menggunakan ID Sesi yang dibuat oleh Web)
* **Struktur Fields:**
  * `scanSessionId` (String): ID Sesi transaksi aktif
  * `itemId` (Number): ID barang hasil scan
  * `barcode` (String): Kode barcode barang hasil scan
  * `userId` (Number): ID staff yang men-scan barang
  * `quantity` (Number): Jumlah barang yang di-scan
  * `status` (String): Status sesi (`"PENDING"`, `"PROCESSED"`)
  * `updatedAt` (Timestamp): Waktu pemindaian terakhir

* **Contoh Dokumen JSON:**
```json
{
  "scanSessionId": "sess-992123",
  "itemId": 15,
  "barcode": "8998765432109",
  "userId": 5,
  "quantity": 1,
  "status": "PENDING",
  "updatedAt": "2026-05-25T15:30:15.000Z"
}
```

---

### C. Koleksi `system_config`
Koleksi konfigurasi sistem global yang memengaruhi seluruh alur bisnis aplikasi.

* **Path Dokumen:** `/system_config/global` (dokumen tunggal bernama `global`)
* **Struktur Fields:**
  * `alerts` (Map):
    * `lowStockEnabled` (Boolean): Saklar global notifikasi stok menipis (`true`/`false`)
  * `updatedAt` (Timestamp): Waktu perubahan konfigurasi terakhir

* **Contoh Dokumen JSON:**
```json
{
  "alerts": {
    "lowStockEnabled": true
  },
  "updatedAt": "2026-05-25T15:26:29.973Z"
}
```

---

### D. Koleksi `user_activity_logs`
Menyimpan jejak aktivitas keamanan user (audit trail) untuk mencegah kecurangan.

* **Path Dokumen:** `/user_activity_logs/{auto_id}`
* **Struktur Fields:**
  * `userId` (Number): ID user yang melakukan aktivitas
  * `username` (String): Username pelaku
  * `action` (String): Jenis aktivitas (`"LOGIN_SUCCESS"`, `"REGISTER_SUCCESS"`, `"PASSWORD_CHANGED"`, `"USER_DELETED"`)
  * `metadata` (Map): Informasi tambahan (misal role, pelaku penghapusan)
  * `createdAt` (Timestamp): Waktu kejadian

---

## 3. Panduan Integrasi Firebase JS SDK untuk Web Developer

### A. Melakukan Inisialisasi Firebase di Frontend
```javascript
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  projectId: "inspiring-rite-489103-t0" // Sesuai Project ID GCP kita
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

### B. Mendengarkan Notifikasi Stok Menipis (Real-time Listener)
```javascript
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

const q = query(
  collection(db, "notifications"), 
  where("isRead", "==", false)
);

// Pasang Listener Real-Time
onSnapshot(q, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === "added") {
      const notif = change.doc.data();
      console.log("Notifikasi Baru Masuk:", notif);
      
      // LOGIKA FRONTEND: Tampilkan pop-up / alert merah di layar Web Owner
      showSwalAlert(notif.itemName, notif.currentStock, notif.minStock);
    }
  });
});
```

### C. Mengubah Saklar Global Notifikasi (On/Off) dari Web Settings
```javascript
import { doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

async function setLowStockNotification(isEnabled) {
  const configRef = doc(db, "system_config", "global");
  
  await updateDoc(configRef, {
    "alerts.lowStockEnabled": isEnabled,
    updatedAt: serverTimestamp()
  });
  console.log(`Pusat Notifikasi diubah menjadi: ${isEnabled}`);
}
```
