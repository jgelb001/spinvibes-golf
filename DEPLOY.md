# SpinVibes Golf — Deployment Guide
## How to publish to SpinVibes.com (Free Hosting via GitHub Pages)

---

## What You're Publishing
A Progressive Web App (PWA) — a website that installs on your iPhone like a real app.
Works fully offline once installed. No App Store needed.

---

## Files in This Folder
```
spinvibes-golf/
├── index.html        ← The entire app (all 4 tabs)
├── sw.js             ← Service worker (enables offline mode)
├── manifest.json     ← App identity (name, icon, theme)
├── icons/
│   ├── icon-192.png  ← App icon (home screen)
│   └── icon-512.png  ← App icon (splash screen)
└── DEPLOY.md         ← This file
```

---

## STEP-BY-STEP: First-Time Setup

### STEP 1 — Create a Free GitHub Account
1. Go to https://github.com
2. Click **Sign up** — use any email
3. Choose the **Free** plan

---

### STEP 2 — Create a New Repository
1. Once logged in, click the **+** button (top right) → **New repository**
2. Repository name: `spinvibes-golf` (exactly this)
3. Set to **Public**
4. Click **Create repository**

---

### STEP 3 — Upload Your Files
1. In your new repository, click **uploading an existing file** (blue link)
2. Drag and drop ALL files from this folder:
   - `index.html`
   - `sw.js`
   - `manifest.json`
   - The `icons/` folder (drag the whole folder)
3. Scroll down, click **Commit changes**

---

### STEP 4 — Enable GitHub Pages
1. In your repository, click **Settings** (top menu)
2. Scroll down to **Pages** (left sidebar)
3. Under **Source**, select **Deploy from a branch**
4. Branch: **main** | Folder: **/ (root)**
5. Click **Save**
6. Wait ~2 minutes — GitHub will show you a URL like:
   `https://yourusername.github.io/spinvibes-golf`
7. Test that URL in your browser — app should work!

---

### STEP 5 — Point SpinVibes.com to GitHub Pages

#### In GitHub (do this first):
1. Go to your repository **Settings → Pages**
2. Under **Custom domain**, type: `spinvibes.com`
3. Click **Save**
4. GitHub will create a file called `CNAME` in your repo automatically

#### In GoDaddy:
1. Log in at https://godaddy.com
2. Go to **My Products** → find SpinVibes.com → click **DNS**
3. Delete any existing **A records** and **CNAME records** for `@` and `www`
4. Add these 4 **A records** (GitHub's IPs):

| Type | Name | Value           |
|------|------|-----------------|
| A    | @    | 185.199.108.153 |
| A    | @    | 185.199.109.153 |
| A    | @    | 185.199.110.153 |
| A    | @    | 185.199.111.153 |

5. Add this **CNAME record**:

| Type  | Name | Value                              |
|-------|------|------------------------------------|
| CNAME | www  | yourusername.github.io             |

6. Click **Save**
7. Wait 15–60 minutes for DNS to propagate (sometimes up to 24 hrs)

---

### STEP 6 — Enable HTTPS (SSL)
1. Back in GitHub → **Settings → Pages**
2. Once your custom domain is verified, check **Enforce HTTPS**
3. Your site will be live at **https://spinvibes.com** 🎉

---

## STEP 7 — Install the App on Your iPhone
1. Open **Safari** on your iPhone (must be Safari, not Chrome)
2. Go to **https://spinvibes.com**
3. Tap the **Share** button (box with arrow pointing up)
4. Scroll down and tap **Add to Home Screen**
5. Name it **SpinVibes Golf** → tap **Add**
6. The app icon appears on your home screen like any other app!
7. Open it — it works fully offline from now on ✅

---

## Updating the App Later
When we create new guides (course management, wedge chart, etc.):
1. Download the updated `index.html` from Claude
2. Go to your GitHub repository
3. Click `index.html` → click the pencil ✏️ edit icon
4. Or drag and drop the new file to replace it
5. Click **Commit changes**
6. Site updates automatically within ~1 minute

---

## Troubleshooting
- **Site not showing:** DNS can take up to 24 hours — be patient
- **Old version showing:** Hard refresh with Ctrl+Shift+R (or clear Safari cache)
- **App not installing:** Must use Safari on iPhone, not Chrome or Firefox
- **Offline not working:** Open the site in Safari first while online, then it caches

---

## Summary
| What | Where | Cost |
|------|-------|------|
| Domain | GoDaddy (you own it) | Already paid |
| Hosting | GitHub Pages | FREE |
| SSL (https) | GitHub Pages | FREE |
| App installation | Safari → Add to Home Screen | FREE |

Total ongoing cost: $0/month 🏆
