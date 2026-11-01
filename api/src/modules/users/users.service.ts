import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ObjectId } from 'typeorm';
import { ApiMessage } from '../../common/enums/api-message.enum';
import { SignInDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtTokenService } from './jwt-token.service';
import { PasswordHasher } from './password.hasher';
import { UsersRepository } from './users.repository';

export type AuthUserResponse = {
  id: string;
  email: string;
  name: string;
};

export type AuthSuccessResponse = {
  message: string;
  accessToken: string;
  user: AuthUserResponse;
};

export type SignupResponse = AuthSuccessResponse;

const MONGO_DUPLICATE_KEY_CODE = 11000;

function isDuplicateKeyError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const withCode = error as { code?: number | string };
  return withCode.code === MONGO_DUPLICATE_KEY_CODE || withCode.code === '11000';
}

function toUserId(id: ObjectId | string): string {
  return typeof id === 'string' ? id : id.toHexString();
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  async signup(dto: SignupDto): Promise<AuthSuccessResponse> {
    const email = dto.email.trim().toLowerCase();
    const name = dto.name.trim();

    const existing = await this.usersRepository.findByEmail(email);
    if (existing) {
      throw new ConflictException(ApiMessage.USER_EMAIL_ALREADY_EXISTS);
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const user = this.usersRepository.create({
      email,
      name,
      passwordHash,
    });

    try {
      const saved = await this.usersRepository.save(user);
      const userId = toUserId(saved.id);
      const accessToken = this.jwtTokenService.signAccessToken({
        userId,
        email: saved.email,
      });

      return {
        message: ApiMessage.USER_SIGNUP_SUCCESS,
        accessToken,
        user: {
          id: userId,
          email: saved.email,
          name: saved.name,
        },
      };
    } catch (error: unknown) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException(ApiMessage.USER_EMAIL_ALREADY_EXISTS);
      }

      this.logger.error('Failed to persist user during signup');
      throw new InternalServerErrorException(ApiMessage.INTERNAL_SERVER_ERROR);
    }
  }

  async signin(dto: SignInDto): Promise<AuthSuccessResponse> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException(ApiMessage.USER_INVALID_CREDENTIALS);
    }

    const passwordMatches = await this.passwordHasher.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException(ApiMessage.USER_INVALID_CREDENTIALS);
    }

    const userId = toUserId(user.id);
    const accessToken = this.jwtTokenService.signAccessToken({
      userId,
      email: user.email,
    });

    return {
      message: ApiMessage.USER_SIGNIN_SUCCESS,
      accessToken,
      user: {
        id: userId,
        email: user.email,
        name: user.name,
      },
    };
  }

  async getMe(userId: string): Promise<AuthUserResponse> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(ApiMessage.USER_NOT_FOUND);
    }

    return {
      id: toUserId(user.id),
      email: user.email,
      name: user.name,
    };
  }
}
