/**
 * MSW server setup for Node.js (Jest) testing
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Create MSW server instance with all handlers
export const server = setupServer(...handlers);
