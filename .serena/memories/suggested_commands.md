# Suggested Commands

## Development Commands

### Start Development Server
```bash
npm run dev
```
Starts the Expo development server with telemetry disabled.

### Type Checking
```bash
npm run typecheck
```
Runs TypeScript type checking across the codebase.

### Linting
```bash
npm run lint
```
Runs ESLint to check code quality and style.

### Build for Web
```bash
npm run build:web
```
Creates a production web build.

## Git Usage with GitButler

**IMPORTANT**: This project is managed by GitButler.

**DO NOT** run the following git commands:
- `git commit`
- `git checkout`
- `git rebase`
- `git cherry-pick`

All commits and branch operations must be done through the GitButler interface.

You **MAY** run git commands that provide information:
- `git status`
- `git log`
- `git diff`
- `git branch -v`

## Platform Notes

- Development works across iOS, Android, and Web
- Use platform-specific testing when making UI changes
- Web uses Metro bundler with single bundle output