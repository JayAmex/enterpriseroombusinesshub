# Vercel Deployment Checklist - Enterprise Room Business Hub

**Deployment Day Guide** – Follow this step-by-step to host your site on Vercel.

---

## Before You Start

- [ ] **Vercel-ready code is committed and pushed to GitHub** (includes `api/index.js`, `vercel.json`, and updated `server.js`)
- [ ] You have a Vercel account (sign up at https://vercel.com if needed)
- [ ] Your GitHub repo is ready (e.g. `JayAmex/enterpriseroombusinesshub`)
- [ ] Railway MySQL database is running and you have connection details

**If you just added Vercel support**, run:
```powershell
cd "c:\Users\User\Downloads\Enterprise Website Pages"
git add api/ vercel.json server.js VERCEL_DEPLOYMENT_CHECKLIST.md
git commit -m "Add Vercel deployment support"
git push origin main
```

---

## Part 1: Prepare Environment Variables

### 1.1 Gather Your Values

From your **Railway** (or current) MySQL setup, collect:

| Variable       | Where to find it        | Example (do not use real values here) |
|----------------|-------------------------|----------------------------------------|
| `DB_HOST`      | Railway MySQL host      | `containers-us-west-xxx.railway.app`   |
| `DB_PORT`      | Railway MySQL port      | `3306`                                 |
| `DB_USER`      | Railway MySQL user      | `root`                                 |
| `DB_PASSWORD`  | Railway MySQL password  | (your password)                        |
| `DB_NAME`      | Database name           | `railway` or your DB name              |
| `DB_SSL`       | If Railway uses SSL     | `true` (often needed for Railway)      |
| `JWT_SECRET`   | Your secret key         | Long random string (e.g. 32+ chars)    |

### 1.2 Generate a Strong JWT Secret (if needed)

- Use a long random string (e.g. 32+ characters).
- You can generate one at https://randomkeygen.com/ (CodeIgniter Encryption Keys) or run in terminal:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

---

## Part 2: Deploy to Vercel

### 2.1 Import Project

1. Go to **https://vercel.com** and log in.
2. Click **Add New…** → **Project**.
3. **Import** your GitHub repository (`enterpriseroombusinesshub` or your repo name).
4. If prompted, authorize Vercel to access your GitHub account.
5. Select the repository and click **Import**.

### 2.2 Configure Project (Vercel project settings)

On the import screen:

- **Framework Preset:** Other (or leave as detected).
- **Root Directory:** Leave as `.` (root).
- **Build Command:** Leave empty or `npm install` (Vercel will install dependencies).
- **Output Directory:** Leave empty (we use a serverless function).
- **Install Command:** Leave as `npm install`.

Do **not** click Deploy yet – add environment variables first.

### 2.3 Add Environment Variables

1. Expand **Environment Variables**.
2. Add each variable (name and value). Select **Production**, and optionally **Preview** and **Development** if you use those.

Add these (use your real values):

| Name          | Value              | Notes                    |
|---------------|--------------------|--------------------------|
| `DB_HOST`     | (your DB host)     | From Railway             |
| `DB_PORT`     | `3306`             | Or your DB port          |
| `DB_USER`     | (your DB user)     | From Railway             |
| `DB_PASSWORD` | (your DB password) | From Railway             |
| `DB_NAME`     | (your DB name)     | From Railway             |
| `DB_SSL`      | `true`             | Use if Railway uses SSL  |
| `JWT_SECRET`  | (your long secret) | Same as local if you want |
| `SITE_URL`    | `https://your-project.vercel.app` | Your live Vercel URL (for verification/welcome links) |
| `MAIL_FROM`   | `register@enterpriserm.com` | Verification emails from |
| `SMTP_HOST`   | `smtp.ionos.co.uk`  | Same as local |
| `SMTP_PORT`   | `587`              | Same as local |
| `SMTP_SECURE` | `false`            | Same as local |
| `SMTP_USER`   | `register@enterpriserm.com` | Verification mailbox |
| `SMTP_PASS`   | (mailbox password) | Verification mailbox |
| `NOREPLY_MAIL_FROM` | `no_reply@enterpriserm.com` | Welcome emails from |
| `NOREPLY_SMTP_USER` | `no_reply@enterpriserm.com` | No-reply mailbox |
| `NOREPLY_SMTP_PASS` | (mailbox password) | No-reply mailbox |

3. Click **Deploy** and wait for the build to finish.

---

## Part 3: After First Deploy

### 3.1 Check Build and Logs

- [ ] Build completes without errors (green check).
- [ ] If it fails, open the **Deployment** → **Building** / **Functions** logs and fix the reported error (often a missing env var or Node version).

### 3.2 Get Your Live URL

- [ ] After success, Vercel shows a URL like:  
  `https://your-project-name.vercel.app`
- [ ] Open this URL in a browser.

### 3.3 Quick Smoke Test

- [ ] Homepage loads (`/` or `/index.html`).
- [ ] Navigate to **Login** and try logging in (tests API + DB).
- [ ] Open **Blog** or **Events** (tests API).
- [ ] If anything fails, check **Vercel** → **Project** → **Logs** (Runtime Logs / Function Logs).

---

## Part 4: Railway / Database

### 4.1 Allow External Connections (if needed)

- Railway usually allows connections from anywhere.
- If your DB is elsewhere, ensure it allows connections from Vercel’s IPs (or 0.0.0.0/0 if acceptable for your setup).

### 4.2 SSL for MySQL

- If you use Railway MySQL, set **`DB_SSL`** = **`true`** in Vercel environment variables.
- Restart/redeploy after changing env vars if needed.

---

## Part 5: Optional – Custom Domain

1. In Vercel: **Project** → **Settings** → **Domains**.
2. Add your domain (e.g. `yourapp.com`).
3. Follow Vercel’s instructions to add the DNS records they show (at your domain registrar).
4. Wait for DNS to propagate; Vercel will issue SSL automatically.

---

## Part 6: Important Notes for This Project

### File Uploads on Vercel

- On Vercel, the app uses **`/tmp`** for uploads (blog images, avatars).
- **Uploads are ephemeral:** they can disappear when the serverless function is recycled.
- For production you may later want to use **cloud storage** (e.g. Vercel Blob, AWS S3, Cloudinary) and keep using this checklist for the rest of the deployment.

### Cold Starts

- The first request after a period of inactivity may be slower (cold start).
- Later requests are faster while the function is “warm.”

### Timeouts

- In `vercel.json`, the API function has `maxDuration: 60` (seconds). Adjust in project settings if needed.

---

## Quick Reference – Commands

### Redeploy

- Push to your connected branch (e.g. `main`); Vercel will auto-deploy.
- Or: Vercel dashboard → **Deployments** → **Redeploy**.

### Update Environment Variables

1. **Project** → **Settings** → **Environment Variables**.
2. Add or edit variables.
3. **Redeploy** the latest deployment for changes to apply.

### View Logs

- **Project** → **Deployments** → select a deployment → **Logs** / **Function Logs**.

---

## Checklist Summary

- [ ] Environment variables added in Vercel (DB_*, JWT_SECRET, SITE_URL, SMTP/NOREPLY for email)
- [ ] Project imported from GitHub and first deploy successful
- [ ] Live URL opens and homepage loads
- [ ] Login works (API + DB)
- [ ] At least one other feature tested (e.g. Blog, Events)
- [ ] (Optional) Custom domain added and DNS set
- [ ] (Optional) Plan for persistent file uploads (e.g. Vercel Blob / S3) noted for later

---

## If Something Fails

1. **Build fails:** Check build logs; ensure all env vars are set and that `api/index.js` and `vercel.json` are in the repo.
2. **Runtime/500 errors:** Check **Function Logs**; often DB connection (check `DB_*`, `DB_SSL`) or missing `JWT_SECRET`.
3. **Login/API not working:** Confirm `JWT_SECRET` is set and matches what you use locally if needed; confirm DB is reachable from Vercel (Railway usually is).

---

**You’re ready for deployment day. Go through each part in order, and you’ll have the site live on Vercel.**
