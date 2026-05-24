# Deploy Web ke Google Cloud Run

Panduan ini untuk deploy `smart-inventory-web` memakai Cloud Run dan CI/CD Cloud Build Trigger dari Google Cloud Console.

## Prasyarat

1. Billing Google Cloud aktif.
2. Enable API:
   - Cloud Run Admin API
   - Cloud Build API
   - Artifact Registry API
3. Backend sudah deploy dan punya URL public untuk:
   - Identity service
   - Inventory service
   - Intelligence service
4. Buat Artifact Registry Docker repository, contoh:
   - Region: `asia-southeast2`
   - Name: `smart-inventory`

   `cloudbuild.yaml` juga akan mencoba membuat repository ini otomatis jika belum ada. Jika step tersebut gagal karena permission, buat repository manual lewat Artifact Registry > Repositories > Create Repository.

## Cloud Build Trigger

Di Google Cloud Console:

1. Buka Cloud Build > Triggers.
2. Connect repository GitHub.
3. Create trigger:
   - Event: Push to branch
   - Branch: `^main$`
   - Included files: kosongkan, atau isi `**`
   - Configuration type: Cloud Build configuration file
   - Location: Repository
   - Cloud Build config file location: `cloudbuild.yaml`
4. Tambahkan substitution variables:

```text
_REGION=asia-southeast2
_AR_REPO=smart-inventory
_SERVICE_NAME=smart-inventory-web
_VITE_IDENTITY_API_URL=https://identity-service-url.run.app
_VITE_INVENTORY_API_URL=https://inventory-service-url.run.app
_VITE_INTELLIGENCE_API_URL=https://intelligence-service-url.run.app
```

5. Simpan trigger.
6. Klik Run untuk test deploy pertama.

## Catatan

Variabel `VITE_*` dibaca saat `npm run build`, jadi nilai URL API harus diisi di Cloud Build Trigger sebelum build berjalan.

Cloud Run service akan listen di port `8080` melalui Nginx. Konfigurasi Nginx juga sudah mendukung refresh langsung di route Vue seperti `/items`, `/categories`, dan `/audit`.

Jika deploy gagal dengan pesan `Repository "smart-inventory" not found`, pastikan:

1. Artifact Registry API sudah aktif.
2. `_REGION` sama dengan lokasi repository.
3. `_AR_REPO` sama dengan nama repository.
4. Cloud Build service account punya akses membuat/menulis Artifact Registry, atau repository sudah dibuat manual.
