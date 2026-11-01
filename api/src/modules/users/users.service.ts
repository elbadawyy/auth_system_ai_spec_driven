import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ObjectId } from 'typeorm';
import { ApiMessage } from '../../common/enums/api-message.enum';
import { SignupDto } from './dto/signup.dto';
import { PasswordHasher } from './password.hasher';
import { UsersRepository } from './users.repository';

export type SignupUserResponse = {
  id: string;
  email: string;
  name: string;
};

export type SignupResponse = {
  message: string;
  user: SignupUserResponse;
};

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
  ) {}

  async signup(dto: SignupDto): Promise<SignupResponse> {
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
      return {
        message: ApiMessage.USER_SIGNUP_SUCCESS,
        user: {
          id: toUserId(saved.id),
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
}
