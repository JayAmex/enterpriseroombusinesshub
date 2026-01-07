# BFG Repo-Cleaner Step-by-Step Guide

## Prerequisites Checklist
- [ ] BFG downloaded (bfg.jar file)
- [ ] Java installed (to run .jar files)
- [ ] Git repository ready
- [ ] All changes committed

## Step-by-Step Instructions

### Step 1: Verify Java is Installed
```powershell
java -version
```
If not installed, download from: https://www.java.com/download/

### Step 2: Create Passwords File
```powershell
cd "C:\Users\User\Downloads\Enterprise Website Pages"
echo "EyJGzEPcYZECQLKdVfcGUFOlMpIVHEKv" > passwords.txt
```

### Step 3: Clone Fresh Copy (BFG Requirement)
BFG needs a fresh clone to work properly:

```powershell
# Go to parent directory
cd C:\Users\User\Downloads

# Clone a fresh copy
git clone "C:\Users\User\Downloads\Enterprise Website Pages" "Enterprise Website Pages-clean"

# Or if you have a remote repository:
# git clone https://github.com/your-username/your-repo.git "Enterprise Website Pages-clean"
```

### Step 4: Place BFG in Accessible Location
```powershell
# Option A: Place bfg.jar in the clean repository
# Copy bfg.jar to: C:\Users\User\Downloads\Enterprise Website Pages-clean\

# Option B: Place in a tools directory
# Copy bfg.jar to: C:\tools\bfg.jar
```

### Step 5: Copy passwords.txt to Clean Repository
```powershell
copy "C:\Users\User\Downloads\Enterprise Website Pages\passwords.txt" "C:\Users\User\Downloads\Enterprise Website Pages-clean\passwords.txt"
```

### Step 6: Run BFG
```powershell
cd "C:\Users\User\Downloads\Enterprise Website Pages-clean"

# If bfg.jar is in the same directory:
java -jar bfg.jar --replace-text passwords.txt

# OR if bfg.jar is in C:\tools\:
# java -jar C:\tools\bfg.jar --replace-text passwords.txt
```

### Step 7: Clean Up Git
```powershell
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Step 8: Verify Password is Removed
```powershell
git log --all --full-history --source -S "EyJGzEPcYZECQLKdVfcGUFOlMpIVHEKv"
```
Should return no results if successful.

### Step 9: Force Push to Remote
⚠️ **WARNING: This will overwrite remote history!**

```powershell
# Make sure you're ready - this is irreversible!
git push --force --all
git push --force --tags
```

### Step 10: Replace Original Repository
After verifying everything works:

```powershell
# Backup original (optional)
Rename-Item "C:\Users\User\Downloads\Enterprise Website Pages" "Enterprise Website Pages-backup"

# Rename clean version
Rename-Item "C:\Users\User\Downloads\Enterprise Website Pages-clean" "Enterprise Website Pages"
```

## Troubleshooting

### "Java is not recognized"
- Install Java from https://www.java.com/download/
- Restart PowerShell after installation

### "bfg.jar not found"
- Make sure bfg.jar is in the correct location
- Use full path: `java -jar C:\full\path\to\bfg.jar --replace-text passwords.txt`

### "Updates were rejected"
- You need to force push: `git push --force --all`

### Still seeing password?
- Make sure you ran cleanup on ALL branches
- Check tags: `git push --force --tags`

## After Cleanup

1. ✅ Verify password removed from history
2. ✅ Test that repository still works
3. ✅ Notify collaborators (if any)
4. ✅ Update original repository location

---

**Ready?** Let me know when BFG is downloaded and we'll proceed step-by-step!

