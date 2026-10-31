import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // TypeORM + MongoDB will be enabled when the database is available:
    // TypeOrmModule.forRootAsync({ ... use typeOrmConfig from ./database/typeorm.config })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
