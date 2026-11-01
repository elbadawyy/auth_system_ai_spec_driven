import './config/load-env';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeOrmConfig } from './database/typeorm.config';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // .env is loaded by the dotenv package in src/config/load-env.ts
      ignoreEnvFile: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        typeOrmConfig(
          configService.get<string>(
            'MONGODB_URI',
            'mongodb://localhost:27017/auth_system',
          ),
        ),
    }),
    HealthModule,
    // Future feature modules (auth, users, …) are imported here.
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
