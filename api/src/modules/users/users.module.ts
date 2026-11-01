import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { StringValue } from 'ms';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtTokenService } from './jwt-token.service';
import { PasswordHasher } from './password.hasher';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

const JWT_SECRET_ENV = 'JWT_SECRET';
const JWT_EXPIRES_IN_ENV = 'JWT_EXPIRES_IN';
const JWT_EXPIRES_IN_DEFAULT: StringValue = '1h';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret = configService.get<string>(JWT_SECRET_ENV);
        if (!secret) {
          throw new Error(
            `${JWT_SECRET_ENV} is required but was not set. Configure it in the environment.`,
          );
        }

        const expiresIn =
          configService.get<string>(JWT_EXPIRES_IN_ENV) ??
          JWT_EXPIRES_IN_DEFAULT;

        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as StringValue,
          },
        };
      },
    }),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    PasswordHasher,
    JwtTokenService,
    JwtAuthGuard,
  ],
  exports: [UsersService],
})
export class UsersModule {}
