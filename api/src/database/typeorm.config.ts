import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * TypeORM + MongoDB settings for upcoming features.
 * Wire this into AppModule with TypeOrmModule.forRootAsync when MongoDB is available.
 */
export const typeOrmConfig = (
  mongodbUri = 'mongodb://localhost:27017/auth_system',
): TypeOrmModuleOptions => ({
  type: 'mongodb',
  url: mongodbUri,
  autoLoadEntities: true,
  synchronize: true,
});
