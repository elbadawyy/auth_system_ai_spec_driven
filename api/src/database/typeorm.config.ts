import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * TypeORM + MongoDB connection options.
 * `mongodbUri` must come from `MONGODB_URI` in `.env` (loaded via dotenv in `src/config/load-env.ts`).
 */
export const typeOrmConfig = (mongodbUri: string): TypeOrmModuleOptions => ({
  type: 'mongodb',
  url: mongodbUri,
  autoLoadEntities: true,
  synchronize: true,
});
