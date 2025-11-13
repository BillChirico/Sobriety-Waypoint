# Slip-Up Aware Days Sober Calculation

**Date:** 2025-11-12
**Status:** Approved
**Author:** Claude Code

## Overview

Update the days sober calculation to account for slip-ups (previously called relapses). When a user records a slip-up, their "days sober" counter should reset to count from the `recovery_restart_date` of their most recent slip-up, while preserving the original `sobriety_date` for historical reference.

## Goals

- Calculate days sober from the most recent recovery restart date when slip-ups exist
- Preserve original sobriety date for journey context
- Display both dates with clear labels to users
- Apply the same logic to sponsor/sponsee relationship views
- Create reusable, consistent logic across all screens

## Non-Goals

- Modifying the database schema (existing tables are sufficient)
- Adding new slip-up tracking features
- Changing how slip-ups are recorded

## Current State

**Database Schema:**

- `profiles.sobriety_date`: Original recovery start date
- `slip_ups.slip_up_date`: When the slip-up occurred
- `slip_ups.recovery_restart_date`: When recovery restarted after slip-up

**Current Implementation:**
Days sober is calculated directly from `profile.sobriety_date` in multiple locations:

- `app/(tabs)/profile.tsx` - `getDaysSober()` function (lines 117-122)
- `app/(tabs)/index.tsx` - `getDaysSober()` function (lines 154-159)
- `app/(tabs)/profile.tsx` - Inline calculations for sponsor/sponsee relationships (lines 703-707, 783-787)

**Problem:**
The current implementation ignores slip-ups entirely, so users who have slip-ups see days counted from their original sobriety date rather than their current streak.

## Proposed Solution

### Architecture

Create a custom React hook `hooks/useDaysSober.ts` that:

- Accepts an optional `userId` parameter (defaults to current authenticated user)
- Queries the `slip_ups` table for the most recent slip-up
- Returns calculated days sober plus metadata for display

**Hook Interface:**

```typescript
interface DaysSoberResult {
  daysSober: number; // Current streak in days
  journeyStartDate: string | null; // Original sobriety_date
  currentStreakStartDate: string | null; // recovery_restart_date or sobriety_date
  hasSlipUps: boolean; // Whether any slip-ups exist
  loading: boolean; // Loading state
  error: any; // Error state
}

function useDaysSober(userId?: string): DaysSoberResult;
```

### Calculation Logic

1. **With slip-ups**: Use `recovery_restart_date` from the most recent slip-up (ordered by `slip_up_date DESC`)
2. **Without slip-ups**: Use profile's `sobriety_date`
3. **Formula**: `Math.floor((today - startDate) / (1000 * 60 * 60 * 24))`

### Database Query

```typescript
const { data: slipUps } = await supabase
  .from('slip_ups')
  .select('*')
  .eq('user_id', targetUserId)
  .order('slip_up_date', { ascending: false })
  .limit(1);
```

Uses the most recent slip-up's `recovery_restart_date` if found, otherwise falls back to `sobriety_date`.

### UI Changes

#### Profile Screen (`app/(tabs)/profile.tsx`)

Display both dates with clear labels:

**With slip-ups:**

```
Journey started: March 15, 2024
Current streak: 45 days (since January 10, 2025)
```

**Without slip-ups:**

```
Journey started: March 15, 2024
45 days sober
```

#### Home/Dashboard Screen (`app/(tabs)/index.tsx`)

- Large number showing current streak days
- Smaller text: "Since [currentStreakStartDate]"
- Keep the visual design simple and focused on the current streak

#### Relationships Lists

For sponsor/sponsee cards:

```typescript
const { daysSober } = useDaysSober(sponsee.id);
```

Display: `"45 days sober"` (simple format for list views)

### Implementation Strategy

**Phase 1: Create Hook**

- Build `hooks/useDaysSober.ts` with all calculation logic
- Add comprehensive unit tests
- Handle all edge cases

**Phase 2: Replace Existing Logic**

- Remove local `getDaysSober()` functions from screens
- Replace with `useDaysSober()` hook calls
- Update UI to show both dates

**Phase 3: Update Relationships**

- Modify sponsor/sponsee list rendering
- Pass user IDs to hook for accurate calculations
- Test with multiple users/relationships

## Edge Cases & Error Handling

### Edge Cases

1. **No sobriety_date set**: Return 0 days, show "Set your sobriety date to track progress"
2. **Future dates**: Return 0 days (prevent negative numbers)
3. **Multiple slip-ups same day**: Use first returned by query (already ordered)
4. **Missing profile data**: Handle gracefully, return null values
5. **Database connection errors**: Return error state, show fallback UI

### Loading States

- Show skeleton/loading indicator while fetching slip-ups
- For relationship lists, show "..." or spinner
- Ensure smooth transitions to avoid UI flicker

### Caching

- Use `useMemo` to cache calculations within render cycles
- Consider 1-2 minute cache for slip-up queries (they change infrequently)
- Invalidate cache when user records new slip-up

## Testing Strategy

### Unit Tests (`hooks/useDaysSober.test.ts`)

- ✅ No slip-ups: Returns days from sobriety_date
- ✅ With slip-ups: Returns days from most recent recovery_restart_date
- ✅ Multiple slip-ups: Uses the most recent one only
- ✅ No sobriety_date: Returns 0 days
- ✅ Future dates: Returns 0 days
- ✅ Database errors: Returns error state
- ✅ Different user IDs: Fetches correct user data

### Integration Tests

- ✅ Profile screen displays journey start and current streak correctly
- ✅ Home screen shows accurate days counter
- ✅ Relationships list shows accurate sponsee/sponsor streaks
- ✅ Recording a slip-up updates the calculation immediately

### Database Tests

- ✅ Query returns most recent slip-up correctly
- ✅ RLS policies allow users to see own slip-ups
- ✅ RLS policies allow sponsors to see sponsees' slip-ups

### Manual Testing Scenarios

1. User with no slip-ups sees correct calculation from sobriety_date
2. User records first slip-up, days reset correctly
3. User records multiple slip-ups, most recent one is used
4. Sponsor views sponsee with slip-ups, sees accurate streak
5. Edge case: User with future sobriety_date shows 0 days

## Files to Modify

### New Files

- `hooks/useDaysSober.ts` - Main hook implementation
- `hooks/__tests__/useDaysSober.test.ts` - Unit tests

### Modified Files

- `app/(tabs)/index.tsx` - Replace getDaysSober() with hook
- `app/(tabs)/profile.tsx` - Replace getDaysSober() and inline calculations with hook
- `app/(tabs)/journey.tsx` - Update if it uses sobriety calculations

### Updated Type Definitions

- Ensure `types/database.ts` has complete SlipUp interface (already exists)

## Success Criteria

- [ ] Hook correctly calculates days from recovery_restart_date when slip-ups exist
- [ ] Hook falls back to sobriety_date when no slip-ups exist
- [ ] All screens show both journey start date and current streak
- [ ] Sponsor/sponsee relationships show accurate streak data
- [ ] All edge cases handled gracefully
- [ ] Unit test coverage ≥ 80%
- [ ] Integration tests pass
- [ ] No performance regressions (queries are efficient)

## Future Enhancements (Out of Scope)

- Add analytics/charts showing streak history over time
- Add celebrations/notifications for milestone days
- Add ability to see all historical slip-ups and recovery periods
- Add streak statistics (longest streak, average streak length, etc.)
