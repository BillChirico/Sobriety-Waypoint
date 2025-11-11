# Task Completion Checklist

When completing a coding task, follow these steps to ensure quality and consistency:

## 1. Type Checking

```bash
pnpm typecheck
```

- Ensure no TypeScript errors
- All types should be properly defined
- No `any` types unless absolutely necessary

## 2. Linting

```bash
pnpm lint
```

- Fix all linting errors
- Address warnings where possible
- Maintain consistent code style

## 3. Code Formatting

```bash
pnpm format:check
```

- Ensure code is properly formatted with Prettier
- Run `pnpm format` to auto-fix formatting issues
- Check formatting before committing

## 4. Cross-Platform Testing (if UI changes)

- Test on both mobile and web when making UI changes
- Verify responsive design on different screen sizes
- Check theme switching (light/dark) works correctly
- Test tab navigation if routes were modified

## 5. Database Changes (if applicable)

- Verify RLS (Row Level Security) policies are correct
- Test data access permissions for different user roles
- Ensure migrations are properly structured
- Update TypeScript types in `types/database.ts`

## 6. Authentication Flow (if modified)

- Test login/signup flows
- Verify onboarding redirects work correctly
- Check session persistence across app restarts
- Test Google OAuth if auth changes were made

## 7. Git Considerations

**IMPORTANT**: This project uses GitButler

- **DO NOT** run `git commit`, `git checkout`, or `git rebase`
- All commits must be made through GitButler interface
- You can run informational commands like `git status`, `git diff`, `git log`

## 8. Environment Variables

- Ensure no sensitive data is hardcoded
- Verify `.env` file is properly configured (not committed to git)
- Check that Supabase URL and anon key are properly set

## 9. Code Review Checklist

- [ ] Code follows established patterns from `code_style.md`
- [ ] Uses `@/` path aliases for imports
- [ ] Theme usage via `useTheme()` hook
- [ ] Proper error handling for async operations
- [ ] TypeScript strict mode compliance
- [ ] No console warnings or errors
- [ ] Platform-specific code properly abstracted
- [ ] RLS policies handle security (no manual auth checks)

## 10. Performance Considerations

- Avoid reading entire files unnecessarily
- Use symbolic tools for targeted code exploration
- Minimize re-renders in React components
- Optimize images and assets for mobile

## 11. Documentation

- Update CLAUDE.md if architectural changes were made
- Add comments for complex business logic
- Document new environment variables if added
- Update memory files if significant patterns changed