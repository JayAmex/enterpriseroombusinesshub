# How to Use BFG Repo-Cleaner

## Important: BFG is NOT an Installer!

BFG is a **JAR file** (Java application) - you don't "install" it by double-clicking. You run it from the command line.

## Step 1: Find Your BFG File

The file you downloaded should be named something like:
- `bfg.jar`
- `bfg-1.14.0.jar`
- `bfg-repo-cleaner-1.14.0.jar`

**Where to look:**
- Your Downloads folder
- Wherever your browser saves files
- Check your browser's download history

## Step 2: Move BFG to a Good Location

**Option A: Place in your project directory**
```powershell
# Copy bfg.jar to your project
copy "C:\path\to\bfg.jar" "C:\Users\User\Downloads\Enterprise Website Pages\bfg.jar"
```

**Option B: Place in a tools directory (recommended)**
```powershell
# Create tools directory
New-Item -ItemType Directory -Path "C:\tools" -Force

# Copy bfg.jar there
copy "C:\path\to\bfg.jar" "C:\tools\bfg.jar"
```

## Step 3: Test BFG Works

Once you know where bfg.jar is, test it:

```powershell
# If in project directory:
cd "C:\Users\User\Downloads\Enterprise Website Pages"
java -jar bfg.jar --version

# OR if in C:\tools\:
java -jar C:\tools\bfg.jar --version
```

If you see a version number, BFG is working! ✅

## Step 4: Find Your BFG File

**Tell me:**
1. What is the exact filename you downloaded?
2. Where did you save it? (full path)

**OR** I can help you search for it. Just let me know!

