# Server Stop Commands - Quick Reference

**Purpose:** Commands to manually stop the Node.js server if the terminal is closed before stopping it.

---

## 🛑 Quick Stop Commands

### Option 1: Stop by Port (Recommended)
```powershell
# Step 1: Find the process using port 3000
netstat -ano | findstr :3000

# Step 2: Note the PID (last number in the output)
# Example output: TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    12345
# PID is: 12345

# Step 3: Kill the process using the PID
taskkill /PID 12345 /F
```

---

### Option 2: Stop All Node.js Processes
```powershell
# ⚠️ WARNING: This stops ALL Node.js processes
# Use with caution if you have other Node apps running
Stop-Process -Name node -Force
```

---

### Option 3: Find and Stop Specific Node Process
```powershell
# Step 1: List all Node processes with their PIDs
Get-Process node | Select-Object Id, ProcessName, StartTime

# Step 2: Stop a specific process by PID
taskkill /PID <process_id> /F
```

---

### Option 4: One-Liner to Stop Server on Port 3000
```powershell
# Find and kill process on port 3000 in one command
$port = 3000; $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess; if ($process) { taskkill /PID $process /F }
```

---

### Option 5: Simplified One-Liner (PowerShell)
```powershell
# Stop process on port 3000 (simplified)
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
```

---

## 📋 Step-by-Step Guide

### If Terminal is Closed and Server is Still Running:

1. **Open PowerShell or Command Prompt**

2. **Find the Process:**
   ```powershell
   netstat -ano | findstr :3000
   ```
   - Look for the line with `LISTENING`
   - Note the last number (PID) - e.g., `12345`

3. **Stop the Process:**
   ```powershell
   taskkill /PID 12345 /F
   ```
   - Replace `12345` with your actual PID
   - `/F` forces the process to stop

---

## 🔍 Verify Server is Stopped

After running the stop command, verify it's stopped:

```powershell
# Check if port 3000 is still in use
netstat -ano | findstr :3000

# If nothing is returned, the server is stopped
```

---

## ⚡ Quick Copy-Paste Commands

### For PowerShell:
```powershell
# Quick stop (one command)
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
```

### For Command Prompt (CMD):
```cmd
REM Find PID
netstat -ano | findstr :3000

REM Stop process (replace 12345 with actual PID)
taskkill /PID 12345 /F
```

---

## 🎯 Most Common Use Case

**If you closed the terminal and the server is still running:**

1. Open PowerShell
2. Run this single command:
   ```powershell
   Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
   ```

That's it! The server will be stopped.

---

## 📝 Notes

- **Port 3000** is the default port for this application
- If you changed the port in `.env`, replace `3000` with your port number
- The `/F` flag forces termination (use if process doesn't stop gracefully)
- Always verify the server is stopped using the verification command

---

## 🆘 Troubleshooting

### If "Access Denied" Error:
- Run PowerShell/CMD as Administrator
- Right-click → "Run as Administrator"

### If Process Not Found:
- Server may already be stopped
- Check with: `netstat -ano | findstr :3000`

### If Multiple Node Processes:
- Use Option 3 to list all processes first
- Stop only the one using port 3000

---

**Last Updated:** 2026-01-15  
**File:** `SERVER_STOP_COMMANDS.md`
