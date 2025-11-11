/**
 * MSW handlers index
 * Combines all API handlers for mocking
 */

import { supabaseHandlers } from './supabase';
import { authHandlers } from './auth';

export const handlers = [...authHandlers, ...supabaseHandlers];
