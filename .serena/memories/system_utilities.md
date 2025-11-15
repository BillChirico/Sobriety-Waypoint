# System Utilities (Darwin/macOS)

This project is developed on **Darwin** (macOS) systems. Below are common system utilities and commands used in development.

## File Operations

### Directory Listing

```bash
ls -la                 # List all files with details
ls -lh                 # List with human-readable sizes
find . -name "*.ts"    # Find TypeScript files recursively
```

### File Search and Content

```bash
grep -r "pattern" .    # Search for pattern recursively
cat file.txt           # Display file contents
head -n 20 file.txt    # Show first 20 lines
tail -n 20 file.txt    # Show last 20 lines
tail -f logs.txt       # Follow file updates (logs)
```

### File Management

```bash
cp -r source dest      # Copy directory recursively
mv source dest         # Move/rename files
rm -rf directory       # Remove directory recursively (careful!)
mkdir -p path/to/dir   # Create directory with parent dirs
```

## Git Commands (Restricted)

**IMPORTANT**: This project uses **GitButler** for version control.

### Allowed Commands (Read-only)

```bash
git status             # Check working tree status
git log                # View commit history
git log --oneline      # Compact commit history
git diff               # Show unstaged changes
git diff --staged      # Show staged changes
git branch -v          # List branches with last commit
```

### Prohibited Commands

**DO NOT USE** (must use GitButler interface instead):

```bash
git commit             # ❌ Use GitButler
git checkout           # ❌ Use GitButler
git rebase             # ❌ Use GitButler
git cherry-pick        # ❌ Use GitButler
git merge              # ❌ Use GitButler
```

## Process Management

```bash
ps aux | grep expo     # Find running Expo processes
kill -9 PID            # Force kill process by PID
lsof -i :8081          # Check what's using port 8081 (Metro)
pkill -f "expo"        # Kill all expo processes
```

## Network Utilities

```bash
curl https://api.example.com              # Make HTTP request
curl -X POST -d '{}' https://api.com      # POST request
ping google.com                           # Test connectivity
netstat -an | grep LISTEN                 # Show listening ports
```

## macOS-Specific

### Xcode and iOS Development

```bash
xcodebuild -version                       # Check Xcode version
xcrun simctl list devices                 # List iOS simulators
open -a Simulator                         # Open iOS Simulator
```

### Android Development

```bash
adb devices                               # List connected Android devices
adb logcat                                # View Android logs
emulator -list-avds                       # List Android Virtual Devices
```

### System Information

```bash
sw_vers                                   # macOS version
uname -a                                  # System information
which node                                # Find Node.js location
node --version                            # Node.js version
pnpm --version                            # pnpm version
```

## Package Management

### pnpm Commands

```bash
pnpm install                              # Install dependencies
pnpm add package-name                     # Add new dependency
pnpm remove package-name                  # Remove dependency
pnpm outdated                             # Check for outdated packages
pnpm why package-name                     # Why is package installed?
```

### Cache Management

```bash
pnpm store prune                          # Clean unused packages
watchman watch-del-all                    # Clear Watchman cache (if issues)
rm -rf node_modules && pnpm install       # Fresh install
```

## Environment and Path

```bash
echo $PATH                                # Show PATH variable
export VAR=value                          # Set environment variable
env                                       # Show all environment variables
source ~/.zshrc                           # Reload shell config (zsh)
```

## Darwin-Specific Notes

- Default shell is **zsh** (not bash) on modern macOS
- Case-insensitive filesystem by default (HFS+/APFS)
- Uses BSD variants of some commands (slightly different from GNU/Linux)
- `ls` command doesn't have `--color` flag (use `-G` instead)
- `sed` requires `-i ''` for in-place edits (different from Linux)

## Troubleshooting Commands

### Clear Metro Bundler Cache

```bash
watchman watch-del-all
rm -rf node_modules/.cache
pnpm dev -- --clear
```

### Reset iOS Simulator

```bash
xcrun simctl erase all                    # Reset all simulators
```

### Reset Android Emulator

```bash
adb shell pm clear com.billchirico.twelvesteptracker
```

### Check Ports

```bash
lsof -i :8081                             # Metro bundler
lsof -i :19000                            # Expo DevTools
lsof -i :19001                            # Expo DevTools (alternative)
```
