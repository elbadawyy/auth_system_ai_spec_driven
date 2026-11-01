import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class PasswordHasher {
  hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);
  }
}
