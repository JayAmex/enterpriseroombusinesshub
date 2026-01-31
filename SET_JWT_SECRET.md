# Set JWT_SECRET (Remove the Warning)

The warning **"JWT_SECRET not set in environment variables"** appears because your `.env` file is missing `JWT_SECRET`.

## Fix (local development)

1. **Open your `.env` file** in the project root (same folder as `server.js`).  
   If it doesn’t exist, copy `.env.example` and rename the copy to `.env`.

2. **Add or edit this line** (use your own long, random secret):
   ```
   JWT_SECRET=your-long-random-secret-at-least-32-characters
   ```

3. **Generate a strong secret** (optional). In PowerShell or terminal:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output and set it as `JWT_SECRET` in `.env`, for example:
   ```
   JWT_SECRET=a1b2c3d4e5f6...paste-the-full-output-here
   ```

4. **Restart the server** (`Ctrl+C`, then `npm run dev`).  
   The warning should disappear.

## Production (e.g. Vercel)

- In Vercel: **Project → Settings → Environment Variables**
- Add `JWT_SECRET` with the same value you use in `.env` (or a new strong secret).
- Redeploy so the new variable is used.

**Important:** Never commit `.env` to Git. It should stay in `.gitignore`.
