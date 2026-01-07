# PowerShell script to clean Git history using filter-branch
# This replaces the compromised password in Git history

Write-Host "🧹 Cleaning Git History..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in a git repository
if (-not (Test-Path .git)) {
    Write-Host "❌ Error: Not a git repository!" -ForegroundColor Red
    exit 1
}

# The password to remove
$oldPassword = "EyJGzEPcYZECQLKdVfcGUFOlMpIVHEKv"
$replacement = "REMOVED_SECRET"

Write-Host "📋 Replacing password in Git history..." -ForegroundColor Yellow
Write-Host "   Old: $oldPassword"
Write-Host "   New: $replacement"
Write-Host ""

# Use git filter-branch to replace the password
# This rewrites all commits
git filter-branch --force --tree-filter `
    "if (Test-Path .) { Get-ChildItem -Recurse -File | ForEach-Object { (Get-Content `$_.FullName -Raw) -replace [regex]::Escape('$oldPassword'), '$replacement' | Set-Content `$_.FullName -NoNewline } }" `
    --prune-empty --tag-name-filter cat -- --all

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Git history cleaned!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Verify: git log --all -S '$oldPassword' (should return nothing)"
    Write-Host "   2. Force push: git push --force --all"
    Write-Host "   3. Clean up: Remove .git/refs/original/ if it exists"
} else {
    Write-Host ""
    Write-Host "❌ Error cleaning history" -ForegroundColor Red
    Write-Host "   Try the manual method in SIMPLE_GIT_CLEANUP.md"
}

