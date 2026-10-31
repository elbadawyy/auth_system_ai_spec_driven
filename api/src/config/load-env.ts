import { config as loadDotenv } from 'dotenv';
import { resolve } from 'node:path';

/**
 * Load environment variables from api/.env via the dotenv package.
 * Import this module before Nest bootstraps.
 */
loadDotenv({ path: resolve(process.cwd(), '.env') });
