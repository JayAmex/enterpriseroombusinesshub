# 🧹 Git History Cleanup Guide

## Overview

This guide will help you remove the compromised password `EyJGzEPcYZECQLKdVfcGUFOlMpIVHEKv` from your Git history.

## ⚠️ Important Warnings

1. **This rewrites Git history** - All commit hashes will change
2. **All collaborators must re-clone** the repository after this
3. **Force push required** - This will overwrite remote history
4. **Backup first** - Make sure you have a backup of your repository

## Prerequisites

- Git installed
- Access to the repository
- All changes committed (or stashed)

## Method 1: Using BFG Repo-Cleaner (Recommended - Easier)

### Step 1: Install BFG

**Windows:**
1. Download BFG from: https://rtyley.github.io/bfg-repo-cleaner/
2. Download the JAR file (bfg.jar)
3. Place it in an easy-to-access location (e.g., `C:\tools\bfg.jar`)

**Or use Java:**
```bash
# If you have Java installed
# Download bfg.jar to your project directory
```

### Step 2: Create Password File

Create a file called `passwords.txt` in your project root:

```bash
# In PowerShell
cd "C:\Users\User\Downloads\Enterprise Website Pages"
echo "EyJGzEPcYZECQLKdVfcGUFOlMpIVHEKv" > passwords.txt
```

### Step 3: Clone a Fresh Copy (BFG Requirement)

BFG needs a fresh clone:

```bash
# Go to a different directory
cd C:\Users\User\Downloads

# Clone a fresh copy
git clone "C:\Users\User\Downloads\Enterprise Website Pages" "Enterprise Website Pages-clean"

# Or if using remote URL:
# git clone https://github.com/your-username/your-repo.git "your-repo-clean"
```

### Step 4: Run BFG

```bash
cd "C:\Users\User\Downloads\Enterprise Website Pages-clean"

# Run BFG (adjust path to bfg.jar)
java -jar C:\tools\bfg.jar --replace-text passwords.txt

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Step 5: Force Push

```bash
# ⚠️ WARNING: This will overwrite remote history!
git push --force --all
git push --force --tags
```

## Method 2: Using git-filter-repo (Modern Alternative)

### Step 1: Install git-filter-repo

```bash
# Using pip
pip install git-filter-repo

# Or download from: https://github.com/newren/git-filter-repo
```

### Step 2: Run git-filter-repo

```bash
cd "C:\Users\User\Downloads\Enterprise Website Pages"

# Replace password in history
git filter-repo --replace-text <(echo 'EyJGzEPcYZECQLKdVfcGUFOlMpIVHEKv==>REMOVED')

# Force push
git push --force --all
git push --force --tags
```

## Method 3: Manual git filter-branch (More Complex)

```bash
cd "C:\Users\User\Downloads\Enterprise Website Pages"

# Create a script to replace the password
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch -r . && git add ." \
  --prune-empty --tag-name-filter cat -- --all

# Then use sed or similar to replace passwords in history
# This is more complex and error-prone
```

## After Cleaning History

### Step 1: Verify Secrets Are Removed

```bash
# Search Git history for the password
git log --all --full-history --source -S "EyJGzEPcYZECQLKdVfcGUFOlMpIVHEKv"

# Should return no results if successful
```

### Step 2: Notify All Collaborators

**IMPORTANT:** All collaborators must:

1. **Delete their local repository:**
   ```bash
   rm -rf "C:\path\to\your\repo"
   ```

2. **Clone fresh:**
   ```bash
   git clone https://github.com/your-username/your-repo.git
   ```

**OR** reset their local copy:
```bash
cd "C:\path\to\your\repo"
git fetch origin
git reset --hard origin/main
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Step 3: Update Documentation

- Update any documentation that references the old password
- Ensure `.env` file is in `.gitignore`
- Verify no secrets are in current code

## Quick Checklist

- [ ] Backup repository
- [ ] All changes committed
- [ ] Install BFG or git-filter-repo
- [ ] Create passwords.txt file
- [ ] Run cleanup tool
- [ ] Verify password removed from history
- [ ] Force push to remote
- [ ] Notify all collaborators
- [ ] Verify `.env` is in `.gitignore`
- [ ] Test repository after cleanup

## Troubleshooting

### Error: "refs/original/refs/heads/main exists"

```bash
# Remove backup refs
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Error: "Updates were rejected"

You need to force push:
```bash
git push --force --all
```

### Still seeing password in history?

1. Make sure you ran the cleanup on ALL branches
2. Check tags: `git push --force --tags`
3. Verify with: `git log --all -S "password"`

## Important Notes

1. **If repository was public:** Assume secrets were already seen. Changing the password (already done ✅) was the most important step.

2. **GitHub caches:** Even after cleaning, GitHub may have cached the old commits. This is normal and they'll eventually expire.

3. **Backup:** Always keep a backup before rewriting history.

4. **Test:** After cleanup, test that your repository still works correctly.

---

**Ready to proceed?** Choose Method 1 (BFG) for easiest cleanup, or Method 2 (git-filter-repo) for modern approach.

