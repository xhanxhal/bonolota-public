# 🔐 ShobdoSetu / Bonolota — Access-Key Licensing & Admin Setup Guide

Welcome! This guide explains how to connect your managed database (**Upstash Redis**) and configure your private **Administrator Portal** on Vercel so you can create, sell, and manage customer access keys without needing to manage servers or databases.

---

## 📋 Overview of How the System Works

1. **Customer Orders**: A student contacts you on WhatsApp or Telegram to purchase a subscription (e.g., 30 days, 90 days, or 1 year).
2. **Key Generation**: After confirming payment via bKash/Nagad/bank, you open your **secret private admin URL** in your browser, enter your admin password, choose the duration, and click **"Generate Key"**.
3. **One-Time Copy**: You copy the generated key (`SHOBDO-XXXX-XXXX-XXXX`) and send it to the customer.
4. **Activation & Single-Browser Binding**: The customer enters the key on the website. The server validates the fixed expiration date and binds their browser.
5. **Protection**: Only authenticated customers can download units 2–50. If someone tries to share the key with a friend, the second browser is blocked automatically. If the customer changes phones, you can click **"Reset Binding"** with one click in your admin dashboard.

---

## 🚀 Step 1: Create a Free Upstash Redis Database (Takes 2 minutes)

Upstash Redis is a serverless database that requires zero maintenance and is completely free for up to 10,000 commands/day.

1. Go to [https://console.upstash.com](https://console.upstash.com) in your web browser.
2. Sign up or log in (you can click **"Continue with Google"** or **"Continue with GitHub"**).
3. On the Upstash dashboard, click the green button: **"Create Database"**.
4. In the creation form:
   - **Name**: Type `shobdosetu-db` (or any name you like).
   - **Type**: Select **"Regional"**.
   - **Region**: Choose a region close to your users (e.g., `Singapore (ap-southeast-1)` or `Frankfurt (eu-central-1)`).
   - **TLS (SSL)**: Keep it enabled (checked).
5. Click **"Create"**.
6. Once created, scroll down to the section named **"REST API"**:
   - You will see two tabs: **".env"** and **"JavaScript"**. Click on the **".env"** tab.
   - You will see two values:
     - `UPSTASH_REDIS_REST_URL` (starts with `https://...upstash.io`)
     - `UPSTASH_REDIS_REST_TOKEN` (a long secret token)
   - Keep this browser tab open—you will copy these two values into Vercel in Step 3.

---

## 🔑 Step 2: Generate Your Admin Password Hash and Secrets

Run this one-line command on your computer or terminal to generate your secure admin credentials:

```bash
node scripts/generate_admin_hash.js "YourChosenAdminPasswordHere"
```

*(Replace `"YourChosenAdminPasswordHere"` with a strong password of your choice, for example `"ShobdoMaster!2026"`)*

The script will instantly output 4 lines like this:

```env
ADMIN_PASSWORD_HASH="pbkdf2:100000:7a9f...:8c1d..."
ADMIN_SESSION_SECRET="e94c2b810f34..."
LICENSE_PEPPER="d15f8a09bc23..."
ADMIN_ROUTE_SECRET="x-vault-9f82e1c4a73b"
```

Save these 4 lines in a private notepad on your computer.

---

## 🌐 Step 3: Add the Variables to Your Existing Vercel Project

1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard) and log in.
2. Click on your project: **`shobdosetu`** (or your vocabulary website project).
3. Click on the **"Settings"** tab at the top.
4. On the left sidebar, click on **"Environment Variables"**.
5. Add the following 6 variables (type the Key, paste the Value, check all 3 environments: **Production**, **Preview**, and **Development**, then click **Save**):

| Key | Where to get the Value |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Copied from Upstash Console (Step 1) |
| `UPSTASH_REDIS_REST_TOKEN` | Copied from Upstash Console (Step 1) |
| `ADMIN_PASSWORD_HASH` | Output from Step 2 |
| `ADMIN_SESSION_SECRET` | Output from Step 2 |
| `LICENSE_PEPPER` | Output from Step 2 |
| `ADMIN_ROUTE_SECRET` | Output from Step 2 (e.g. `x-vault-9f82e1c4a73b`) |

---

## 🚢 Step 4: Deploy and Verify

1. In Vercel, go to the **"Deployments"** tab.
2. On your latest deployment, click the three dots (`...`) on the right side and select **"Redeploy"** (make sure **"Use existing build cache"** is unchecked so it picks up the new environment variables).
3. Wait 1–2 minutes until the deployment status shows **Ready (green checkmark)**.

---

## 🔒 Step 5: How to Access Your Private Admin Dashboard

Notice: **There is NO admin button or link anywhere on the public website.** Nobody visiting your website can see or guess your admin portal.

To access your admin dashboard:
1. Open your browser address bar.
2. Type your website domain followed by a slash and your `ADMIN_ROUTE_SECRET`.
   For example:
   ```
   https://your-domain.vercel.app/x-vault-9f82e1c4a73b
   ```
3. Press **Enter**.
4. You will see the **Central Admin Vault** login card.
5. Enter your strong admin password that you chose in Step 2.
6. Click **"লগইন করুন" (Login)**.

---

## 🎫 Step 6: How to Generate and Issue a Key to a Customer

1. Inside your private Admin Dashboard, click on the **"নতুন কি তৈরি করুন" (Generate Key)** tab.
2. Choose the duration:
   - **30 দিন (30 Days)**
   - **90 দিন (90 Days)**
   - **180 দিন (6 Months)**
   - **365 দিন (1 Year)**
   - Or click **"কাস্টম দিন"** to enter any number of days.
3. In the **"গ্রাহক রেফারেন্স বা পেমেন্ট নোট"** field, write the customer's name, WhatsApp number, or transaction ID (e.g., `Tanvir - 017xxxxxxxx - bKash TrxID #8A92B1`).
4. Click **"অ্যাক্সেস কি জেনারেট করুন"**.
5. A green box will appear showing your key, for example:
   ```
   SHOBDO-7K9A-M4W2-X8P1
   ```
6. Click **"কপি করুন"** (Copy).
7. Send the key to your customer on WhatsApp or Telegram with this message:
   > *"ধন্যবাদ! আপনার ShobdoSetu অ্যাক্সেস কি: SHOBDO-7K9A-M4W2-X8P1। ওয়েবসাইটে প্রবেশ করে এই কি-টি দিয়ে অ্যাক্টিভেট করে নিন।"*

---

## 🔄 Step 7: How to Reset a Customer's Browser Binding

If a customer says:
> *"আমি নতুন ফোন কিনেছি / আমার ব্রাউজারের হিস্ট্রি ক্লিয়ার করেছি, এখন 'Already Bound' দেখাচ্ছে।"*

You don't have to generate a new key!
1. Log in to your Admin Portal.
2. Go to the **"লাইসেন্স তালিকা" (Licenses)** tab.
3. Search for their name, phone number, or key.
4. Click the teal **"রিসেট" (Reset)** button next to their license.
5. Confirm the prompt.
6. Done! Their previous browser session is immediately invalidated, and the customer can now enter the same key on their new phone or browser to continue using their remaining subscription days!

---

## 🧪 Testing Before You Sell

You can easily test the entire flow yourself:
1. Open your secret Admin URL and log in.
2. Generate a **30-day key** with note: `Self Test 1`.
3. Copy the key.
4. Open an Incognito / Private browser window and visit your website home page (`https://your-domain.vercel.app`).
5. You will see the customer activation screen.
6. Paste the key and click **"অ্যাক্টিভেট করে প্রবেশ করুন"**.
7. The website will unlock all 50 units and 1,000 words!
8. Open another normal browser window and try to paste the same key: it will reject with the message that it is already bound to another browser!
9. Go to your Admin tab, click **"রিসেট"** on the test license.
10. The normal browser window can now activate successfully.

---

## 🛡️ Secret Rotation & Troubleshooting

- **Forgot Admin Password?**
  Run `node scripts/generate_admin_hash.js "MyNewPassword"`, copy the new `ADMIN_PASSWORD_HASH`, update it in Vercel Environment Variables, and redeploy.
- **Want to Change Your Secret Admin URL?**
  Change `ADMIN_ROUTE_SECRET` in Vercel Environment Variables to another random string (e.g., `x-console-7b4d19e8`), then redeploy. Your admin portal will immediately move to the new URL.
- **Customer sees "Too Many Attempts"?**
  The system includes built-in rate limiting (max 10 activation attempts per 15 minutes) to protect against bots trying to guess keys. The customer can try again after 15 minutes.
- **Local Development without Upstash?**
  The codebase includes an automatic in-memory fallback for local development. `npm run dev` works immediately without requiring internet or credentials.
