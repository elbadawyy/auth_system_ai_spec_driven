import { TypeOrmModuleOptions } from '@nestjs/typeorm';

const DEFAULT_MONGODB_URI = 'mongodb://localhost:27017/auth_system';

/**
 * TypeORM + MongoDB connection options.
 * Prefer MONGODB_URI from env (loaded via dotenv in src/config/load-env.ts).
 */
export const typeOrmConfig = (
  mongodbUri = DEFAULT_MONGODB_URI,
): TypeOrmModuleOptions => ({
  type: 'mongodb',
  url: mongodbUri,
  autoLoadEntities: true,
  synchronize: true,
});
