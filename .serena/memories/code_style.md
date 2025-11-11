# Code Style and Conventions

## TypeScript Configuration

### Strict Mode

- TypeScript strict mode is **enabled**
- All code must be fully typed
- No implicit `any` types
- Null safety enforced

### Path Aliases

```typescript
"@/*": ["./*"]  // Root-level imports
```

**Usage**:

```typescript
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
```

## Key Code Patterns

### 1. Authentication Guards

- **Centralized** in root layout (`app/_layout.tsx`)
- Individual screens don't need auth checks
- Automatic navigation based on auth state

```typescript
// Don't do this in individual screens:
if (!session) router.push('/login');

// Auth logic is handled centrally in _layout.tsx
```

### 2. Theme Usage

Always use the `useTheme()` hook for consistent cross-platform theming:

```typescript
import { useTheme } from '@/contexts/ThemeContext'

function MyComponent() {
  const { colors, isDark } = useTheme()

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Hello</Text>
    </View>
  )
}
```

### 3. Supabase Queries

- Import typed client from `@/lib/supabase`
- Use type definitions from `@/types/database`
- RLS policies handle security automatically

```typescript
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';

const { data, error } = await supabase.from('profiles').select('*').single();
```

### 4. Platform-Specific Storage

Use the adapter pattern for cross-platform storage:

```typescript
// Platform detection
import { Platform } from 'react-native';

// Conditional imports
const SecureStore = Platform.OS !== 'web' ? require('expo-secure-store') : null;
```

### 5. Row Level Security

- **No additional auth checks needed** in client code
- RLS policies enforce data isolation
- Trust the database security model

```typescript
// RLS handles access control automatically
const { data } = await supabase.from('tasks').select('*'); // Only returns tasks user can access
```

## Naming Conventions

### Files

- **Screens**: `kebab-case.tsx` (e.g., `login.tsx`, `onboarding.tsx`)
- **Components**: `PascalCase.tsx` (e.g., `TaskCard.tsx`)
- **Utilities**: `camelCase.ts` (e.g., `supabase.ts`)
- **Types**: `database.ts`, `index.ts`

### Variables and Functions

- **camelCase** for variables and functions
- **PascalCase** for components and types
- **UPPER_SNAKE_CASE** for constants

### Database

- **snake_case** for table names and columns
- Matches PostgreSQL conventions

## Component Structure

```typescript
import { View, Text } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'

interface MyComponentProps {
  title: string
  onPress?: () => void
}

export default function MyComponent({ title, onPress }: MyComponentProps) {
  const { colors } = useTheme()

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>{title}</Text>
    </View>
  )
}
```

## Error Handling

```typescript
const { data, error } = await supabase.from('profiles').select('*');

if (error) {
  console.error('Error fetching profile:', error);
  // Handle error appropriately
  return;
}

// Use data safely
```

## Async/Await

- Prefer `async/await` over promise chains
- Always handle errors with try/catch or conditional checks
- Use TypeScript to ensure proper error types

## Comments and Documentation

- Use JSDoc for function documentation when logic is complex
- Keep comments concise and meaningful
- Prefer self-documenting code over excessive comments
- Document non-obvious business logic
