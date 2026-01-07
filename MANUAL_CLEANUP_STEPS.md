# Manual Git History Cleanup Steps

Since BFG has memory issues and we only have 2 commits, here's the simplest approach:

## Step 1: Commit All Current Changes

All your security fixes are currently uncommitted. Let's commit them:

```powershell
cd "C:\Users\User\Downloads\Enterprise Website Pages"

# Add all changes
git add .

# Commit with a message
git commit -m "Security: Remove all hardcoded passwords and use environment variables"
```

## Step 2: Use Git Filter-Branch (Simple Method)

Since the password is only in the initial commit, we can use a simple filter-branch:

```powershell
# Replace password in all commits
git filter-branch --force --index-filter `
    "git ls-files | ForEach-Object { `$content = Get-Content `$_ -Raw; if (`$content -match 'EyJGzEPcYZECQLKdVfcGUFOlMpIVHEKv') { `$content -replace 'EyJGzEPcYZECQLKdVfcGUFOlMpIVHEKv', 'REMOVED_SECRET' | Set-Content `$_ -NoNewline; git add `$_ } }" `
    --prune-empty --tag-name-filter cat -- --all
```

**OR** simpler approach - just rewrite the initial commit:

```powershell
# Interactive rebase to edit the initial commit
git rebase -i --root

# In the editor, change 'pick' to 'edit' for the first commit
# Then when it stops, manually edit files to remove password
# Then: git add . && git commit --amend && git rebase --continue
```

## Step 3: Alternative - Fresh Start (Easiest)

Since you only have 2 commits and the password is in the first one:

```powershell
# Create a new orphan branch (no history)
git checkout --orphan clean-main

# Add all current files
git add .

# Make initial commit
git commit -m "Initial commit: Enterprise Website Pages (cleaned)"

# Delete old main branch
git branch -D main

# Rename current branch to main
git branch -m main

# Force push (this replaces everything)
git push --force origin main
```

## Step 4: Verify

```powershell
# Check if password is gone
git log --all --full-history --source -S "EyJGzEPcYZECQLKdVfcGUFOlMpIVHEKv"

# Should return nothing
```

## Recommendation

**For your situation (only 2 commits), I recommend Option 3 (Fresh Start)** - it's the simplest and cleanest.

Would you like me to guide you through the Fresh Start method?

