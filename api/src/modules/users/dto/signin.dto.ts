import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import {
  PASSWORD_HAS_DIGIT,
  PASSWORD_HAS_LETTER,
  PASSWORD_HAS_SPECIAL,
  PASSWORD_MIN_LENGTH,
} from '../password.constraints';

function trimAndLowercase({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class SignInDto {
  @Transform(trimAndLowercase)
  @IsEmail()
  @IsString()
  email!: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @Matches(PASSWORD_HAS_LETTER, {
    message: 'password must contain at least one letter',
  })
  @Matches(PASSWORD_HAS_DIGIT, {
    message: 'password must contain at least one digit',
  })
  @Matches(PASSWORD_HAS_SPECIAL, {
    message: 'password must contain at least one special character',
  })
  password!: string;
}
