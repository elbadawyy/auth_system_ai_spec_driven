import './config/load-env';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // .env is loaded by the dotenv package in src/config/load-env.ts
      ignoreEnvFile: true,
    }),
    // TypeORM + MongoDB will be enabled when the database is available:
    // TypeOrmModule.forRootAsync({ ... use typeOrmConfig from ./database/typeorm.config })
    HealthModule,
    // Future feature modules (auth, users, …) are imported here.
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
