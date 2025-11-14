# CLAUDE.md

Guidance for Claude Code when contributing to 12-Step Tracker. Keep this doc handy—most review feedback happens when one of these requirements gets skipped.

---

## 1. MCP Usage Rules (Non-Negotiable)

1. Run ToolHive’s `find_tool` **before** solving any task (log the attempt even if the server is unreachable).
2. Prefer MCP servers over manual inspection—Serena for code navigation/edits, Expo MCP for framework help, Brave for research, Fetch for raw content.
3. Use Memory Keeper to capture progress, architectural decisions, and test outcomes; create checkpoints before you hit context limits.
4. If a tool seems missing, query `mcp__MCP_DOCKER__mcp-find` and (re-)add the needed server.
5. Call out in your final response whenever an expected MCP server could not be reached.

### MCP Toolbox

| Server | Purpose | Go-to Tools |
| --- | --- | --- |
| ToolHive (`mcp__toolhive-mcp-optimizer__*`) | Discover the best tool for a task | `find_tool`, `list_tools` |
| Serena (`mcp__serena__*`) | Semantic navigation & edits | `find_symbol`, `search_for_pattern`, `replace_symbol_body` |
| Memory Keeper (`mcp__memory-keeper__*`) | Session context & checkpoints | `context_save`, `context_checkpoint`, `context_get` |
| Expo MCP (`mcp__expo-mcp__*`) | Expo-specific development help | `search_documentation`, `add_library` |
| Brave Search (`mcp__MCP_DOCKER__brave_*`) | Web/news/image research | `brave_web_search`, `brave_news_search`, `brave_image_search` |
| Fetch (`mcp__MCP_DOCKER__fetch`) | Pull + convert web content | `fetch` |
| Sequential Thinking (`mcp__sequential-thinking__*`) | Plan multi-step solutions | `think_step`, `revise_plan` |
| MCP Management (`mcp__MCP_DOCKER__mcp-*`) | Add/remove/config servers | `mcp-find`, `mcp-add`, `mcp-remove` |

**Workflow loop:** ToolHive → specialized MCP tool(s) → Serena edits → Memory Keeper checkpoint → report tests & decisions.

---

## 2. Project Snapshot

- **App**: Expo 54 · React Native 0.81.5 · React 19 companion app for AA sponsors/sponsees.
- **Backend**: Supabase (Postgres + Row Level Security) with typed client in `lib/supabase.ts`.
- **Routing**: Expo Router v6 (`app/_layout.tsx` enforces login → onboarding → authenticated tabs).
- **Auth Providers**: Email/password, Google OAuth, Facebook Sign In (live). Apple Sign In design lives in `docs/plans/2025-11-12-apple-signin-design.md`.
- **Observability**: Production-only Sentry with privacy scrubbing, source-map upload, navigation instrumentation.
- **Storage**: SecureStore on native, localStorage on web; abstracted in Supabase client.
- **Testing Stack**: Jest, React Native Testing Library, MSW, Maestro (80% coverage gate).
- **CI/CD**: GitHub Actions + pnpm cache + lint/typecheck/tests/web build + EAS Android/iOS (preview profile) + Claude review.

---

## 3. Architecture Cheat Sheet

```
12-Step-Tracker/
├── app/                Expo Router entry; `(tabs)` gated behind auth
├── contexts/           AuthContext (Supabase session + OAuth), ThemeContext
├── components/         Shared UI
├── lib/supabase.ts     Typed Supabase client + platform storage adapter
├── supabase/migrations Schema + RLS (source of truth)
├── types/database.ts   Generated DB types
└── docs/               Testing, CI/CD, feature designs
```

- **Navigation flow**: unauthenticated → `/login`; missing profile/role → `/onboarding`; complete profile → `/(tabs)`.
- **Key tables**: `profiles`, `sponsor_sponsee_relationships`, `tasks`, `messages`, `steps_content`, `notifications`, `invite_codes`, `relapses` (all locked with RLS).
- **Contexts**: `AuthContext` exposes `session`, `user`, `profile`, `loading`, auth helpers; `ThemeContext` exposes palette + `isDark`.

---

## 4. Development Workflow

1. **Env vars** (`.env`): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_FACEBOOK_APP_ID`, plus Sentry vars for prod builds.
2. **Install + run**
   ```bash
   pnpm install
   pnpm dev          # Expo dev server (web + native)
   pnpm ios|android  # Launch simulators
   pnpm build:web    # Static web build
   ```
3. **Quality gates**: `pnpm typecheck`, `pnpm lint`, `pnpm test -- --coverage`, `pnpm maestro`.
4. **Hooks**: Husky + lint-staged format every staged file (Prettier) and auto-fix TS/JS (ESLint). Hooks skip typecheck—run it yourself.
5. **CI expectations**: push → GitHub Actions run lint/format/typecheck/tests/web build + trigger EAS Android/iOS (preview). Watch Expo dashboard for async native builds.
6. **Secrets for CI**: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_TOKEN` (plus `CODECOV_TOKEN` if private repo).

---

## 5. Testing Strategy

- **Coverage guardrail**: ≥80% for statements/branches/functions/lines.
- **Commands**:
  ```bash
  pnpm test               # all
  pnpm test:watch         # dev loop
  pnpm test -- --coverage # report
  pnpm maestro            # E2E flows
  pnpm maestro:record     # author new flow
  ```
- **Patterns**:
  - Use `renderWithProviders` from `test-utils/render`.
  - Mock Supabase via MSW handlers in `mocks/`.
  - Favor user-centric assertions (React Native Testing Library queries, jest-native matchers).
  - Reuse fixtures from `test-utils/fixtures/`.
  - Document Maestro flows in `.maestro/README.md`; add `testID` props where needed.
- **Templates**: `docs/templates/component.test.template.tsx`, `hook.test.template.ts`, `integration.test.template.tsx`, `maestro-flow.template.yaml`.

---

## 6. CI/CD & Monitoring

1. **Workflow** (`.github/workflows/ci.yml`): lint → format check → typecheck → unit tests → web build → trigger EAS Android/iOS (preview profile, `--no-wait`).
2. **Claude Code Review**: sticky PR comment updating as checks complete; flags types/lint/format/TODO issues.
3. **Build visibility**: GitHub Actions tab for logs + web artifacts (7 days). Expo dashboard for Android/iOS build logs + downloads.
4. **Sentry**: prod-only DSN; ensure `EXPO_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` are set before releases.
5. **EAS profiles** (`eas.json`): `development` (dev client), `preview` (CI/QA, OTA `preview`), `production` (auto version bump, OTA `production`). Project ID: `4652ad8b-2e44-4270-8612-64c4587219d8`.

---

## 7. Contribution Checklist

- □ ToolHive searched + relevant MCP tools used (note gaps if a server is down).
- □ Memory Keeper updated with progress snapshot and architecture/test decisions.
- □ Changes scoped to relevant files; prior user edits preserved.
- □ Tests + lint/typecheck pass locally (or blockers documented).
- □ README/docs updated when behavior or setup changes.
- □ Final response links to affected files, mentions outstanding risks/tests to run, and states MCP availability (especially ToolHive).

---

## 8. Source-of-Truth Docs

- `README.md` – overview, commands, quick links.
- `docs/TESTING.md` – deep testing strategy, coverage enforcement, MSW patterns.
- `docs/SENTRY_SETUP.md` – production observability.
- `GOOGLE_OAUTH_SETUP.md`, `FACEBOOK_SIGNIN_SETUP.md`, `docs/plans/2025-11-12-apple-signin-design.md` – identity providers.
- `.github/CICD.md` – CI/CD behavior + Claude review notes.
- `.github/GIT_HOOKS.md` – Husky/lint-staged troubleshooting.
- `supabase/migrations/` – canonical schema + RLS.
- `.maestro/README.md` – E2E flows + authoring tips.

Stay disciplined with MCP tooling, privacy constraints, and testing so the recovery community’s data stays safe and the developer loop stays fast.
