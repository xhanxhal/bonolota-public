# 🔐 ShobdoSetu / Bonolota — Access-Key Licensing & Admin Setup Guide

Your system is configured and connected to your **Upstash Redis** database (**`bonolota-db`**). You do **NOT** need to generate or configure any password hashes.

---

## ⚡ Quick Access Details

- **Private Admin Portal URL**: `https://<YOUR-DOMAIN>/x-admin-arifa`
- **Admin Password**: `Chanchal11@@`
- **Connected Database**: `bonolota-db` (Upstash Redis)
- **Database REST URL**: `https://unique-sunbeam-240324.upstash.io`

*(Note: There is NO admin button or link anywhere on the public website. Simply type `/x-admin-arifa` at the end of your website URL in your browser address bar).*

---

## 🌐 Vercel Environment Variables (Already default in code, also add in Vercel for 100% guarantee)

In your Vercel Dashboard (**Project → Settings → Environment Variables**), you can optionally confirm or add these:

| Key | Value |
|---|---|
| `UPSTASH_REDIS_REST_URL` | `https://unique-sunbeam-240324.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | `gQAAAAAAA6rEAAIgcDIyMWQ1OGQ2YzE1NTc0Y2FkODVjZDFkZDcxYmZhOWViZg` |
| `ADMIN_PASSWORD` | `Chanchal11@@` |
| `ADMIN_ROUTE_SECRET` | `x-admin-arifa` |

---

## 📋 How to Sell and Issue an Access Key to a Customer

1. **Payment Confirmation**: Customer pays you via bKash / Nagad / Rocket / Bank and contacts you on WhatsApp or Telegram.
2. **Open Admin Portal**: Open your browser and go to `https://your-domain.vercel.app/x-admin-arifa`.
3. **Login**: Enter password: `Chanchal11@@` and click **"লগইন করুন"**.
4. **Generate Key**:
   - Go to the **"নতুন কি তৈরি করুন"** tab.
   - Select subscription duration (30 days, 90 days, 180 days, 365 days, or custom days).
   - Add a note (e.g. `Tanvir - 017xxxxxxxx - bKash TrxID #8A92B1`).
   - Click **"অ্যাক্সেস কি জেনারেট করুন"**.
5. **Copy & Send**: Click **"কপি করুন"** to copy the generated key (`SHOBDO-XXXX-XXXX-XXXX`) and send it to your customer.
6. **Customer Activates**:
   - The customer visits your website home page, pastes their key into the activation box, and clicks **"অ্যাক্টিভেট করে প্রবেশ করুন"**.
   - All 50 units and 1,000 words unlock immediately!
   - Their key is atomically bound to their browser installation so it cannot be shared with friends.

---

## 🔄 Resetting Browser Binding (When Customer Changes Device)

If a customer changes their phone or clears browser cookies and sees the *"Already bound to another browser"* notice:
1. Open `https://your-domain.vercel.app/x-admin-arifa` and log in.
2. Go to **"লাইসেন্স তালিকা"** (Licenses).
3. Find the customer's key or note.
4. Click the teal **"রিসেট" (Reset)** button.
5. The customer can now enter their key on their new device and continue using their remaining subscription period!

---

## 🧪 Testing

1. Go to `https://<YOUR-DEV-OR-PROD-URL>/x-admin-arifa`
2. Enter password `Chanchal11@@`
3. Generate a 30-day key.
4. Open an Incognito window, visit the home page, and activate the key.
5. All 50 units unlock instantly!
