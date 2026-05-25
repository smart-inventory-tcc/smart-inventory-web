# Real-Time Notification Setup Guide

## Overview
This guide explains how to set up and use the real-time stock alert notification system in Smart Inventory Web.

## Features
- ✅ Real-time Firestore listener for low stock alerts
- 🔊 Audio notification (beep) when new alerts arrive
- 🎯 Two alert levels: warning (orange) and danger (red)
- 📱 Responsive mobile design
- ✅ Mark as read functionality
- 🚀 WebSocket connection via Firestore

## Installation

### 1. Install Dependencies
```bash
cd smart-inventory-web
npm install
```

This will install Firebase SDK v10.8.0 and other required dependencies.

### 2. Configure Environment Variables

Create a `.env.local` file in the `smart-inventory-web` directory by copying from `.env.example`:

```bash
cp .env.example .env.local
```

Then fill in your Firebase configuration values:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

**Where to find these values:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click ⚙️ Settings (Project Settings)
4. Go to "General" tab
5. Scroll down to "Your apps" section
6. Click on your web app (or create one if it doesn't exist)
7. Copy the configuration values

### 3. Firestore Security Rules

Ensure your Firestore has appropriate security rules. Here's a recommended configuration:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Notifications collection - read-only for users
    match /notifications/{doc=**} {
      allow read, update: if request.auth != null;
      allow create, delete: if request.auth.token.admin == true;
    }
    
    // Stock alerts history - read-only for users
    match /stock_alerts_history/{doc=**} {
      allow read: if request.auth != null;
      allow create, delete: if request.auth.token.admin == true;
    }
    
    // Temp scan sessions - read/write for users
    match /temp_scan_sessions/{doc=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Usage

### Automatic Initialization
The notification system automatically initializes when a user is authenticated in the application. Simply:

1. Open the Smart Inventory app
2. Log in with your credentials
3. The real-time listener will automatically start
4. Any low stock alerts from Firestore will appear as pop-up notifications in the top-right corner

### Component Architecture

#### NotificationAlert.vue
The main visual component that displays alerts:
- Shows the highest priority alert (danger > warning)
- Displays "+ N more" if there are additional alerts in queue
- Allows dismissing individual alerts
- Responsive design for mobile and desktop

#### notification.js (Service)
Manages the Firestore real-time listener:
- `startNotificationListener()` - Starts listening to new alerts
- `stopNotificationListener()` - Stops the listener
- `markNotificationAsRead(notificationId)` - Marks an alert as read
- `playNotificationSound()` - Plays audio notification

#### notification.js (Store)
Pinia store managing notification state:
- `notifications` - Array of current alerts
- `dangerNotifications` - Filtered danger-level alerts
- `warningNotifications` - Filtered warning-level alerts
- `totalCount` - Total number of alerts
- `hasNotifications` - Boolean flag
- Methods: `addNotification()`, `removeNotification()`, `updateNotification()`, etc.

## How It Works

### Flow Diagram
```
1. Staff Transaction OUT → Stok ≤ minStock
   ↓
2. Backend (inventory-service) triggers transaction
   ↓
3. Backend writes to Firestore:
   - notifications collection (real-time)
   - stock_alerts_history collection (audit trail)
   ↓
4. Frontend Firestore listener detects new notification
   ↓
5. Sound plays + Alert popup appears
   ↓
6. Owner clicks "Dismiss" → Mark as read
```

### Alert Levels

| Level | Condition | Color | Sound |
|-------|-----------|-------|-------|
| **WARNING** | Stock <= minStock | Orange | Beep |
| **DANGER** | Stock <= minStock/2 | Red | Beep |

## Testing

### Manual Testing Steps

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Log in to the application**

3. **Create a low stock scenario:**
   - Use the POSTMAN_GUIDE.md to trigger a stock OUT transaction
   - Set the quantity so final stock becomes <= minStock
   - Example: Item with minStock=10, current stock=15, OUT quantity=10 → final stock=5

4. **Watch the notification:**
   - Check if the alert popup appears in the top-right corner
   - Verify sound plays (if not muted)
   - Check the notification content
   - Click "Dismiss" to clear it

### Firestore Verification

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Firestore Database
4. Check the `notifications` collection
5. You should see documents with:
   - `type: "LOW_STOCK"`
   - `itemId, itemName, barcode`
   - `level: "warning" | "danger"`
   - `currentStock, minStock`
   - `isRead: false`

## Troubleshooting

### Notifications Not Appearing

**Issue:** No alerts show up even after stock transaction

**Solutions:**
1. Check browser console for errors (F12 > Console tab)
2. Verify Firebase credentials in `.env.local`
3. Ensure user is logged in (`auth.isAuthenticated` should be true)
4. Check Firestore security rules allow read access
5. Verify Firestore database has data in `notifications` collection

### Sound Not Playing

**Issue:** No beep sound on new alerts

**Solutions:**
1. Check browser volume and mute status
2. Check browser console for audio context errors
3. Some browsers require user interaction before allowing audio
4. Try a different browser

### Listener Not Starting

**Issue:** `startNotificationListener` not called automatically

**Solutions:**
1. Clear browser cache and reload
2. Check if user is properly authenticated
3. Verify Firebase initialization in `.env.local`
4. Check browser console for Firebase errors

### Firestore Connection Issues

**Issue:** Permission denied or connection errors

**Solutions:**
1. Verify `VITE_FIREBASE_PROJECT_ID` matches your project
2. Check Firestore security rules allow authenticated users to read
3. Ensure GCP service account has Firestore permissions (backend)
4. Verify Firebase credentials file location on backend

## Performance Optimization

### Query Optimization
The listener only watches unread notifications:
```javascript
const q = query(notificationsRef, where('isRead', '==', false))
```

This reduces:
- Firestore read operations
- Network bandwidth
- Processing overhead

### Memory Management
- Listener is automatically stopped when user logs out
- Notifications are removed after marking as read
- Component cleanup on unmount

## Security Considerations

1. **Firestore Rules:** Users can only read their own notifications (via security rules)
2. **API Access:** Backend service account handles all writes
3. **Data Validation:** Backend validates item stock before writing alerts
4. **Error Handling:** Sensitive errors are logged but not exposed to UI

## Next Steps

### Optional Enhancements
- [ ] Add notification sound selection/preferences
- [ ] Add notification history page (read alerts)
- [ ] Add email notifications via Cloud Functions
- [ ] Add mobile push notifications via FCM
- [ ] Add notification filtering by item category
- [ ] Add bulk action for multiple alerts

### Integration Points
- Inventory Service API for fetching item details
- Auth Store for user context
- Router for navigation when clicking alerts

## Support

For issues or questions:
1. Check this guide's Troubleshooting section
2. Review console errors (F12 > Console)
3. Check Firestore data in Firebase Console
4. Verify backend logs show transaction processing
