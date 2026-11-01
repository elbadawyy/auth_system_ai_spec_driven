import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const PASSWORD_HAS_LETTER = /[A-Za-z]/;
const PASSWORD_HAS_DIGIT = /\d/;
const PASSWORD_HAS_SPECIAL = /[^A-Za-z0-9]/;

function trimString({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function trimAndLowercase({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class SignupDto {
  @Transform(trimAndLowercase)
  @IsEmail()
  @IsString()
  email!: string;

  @Transform(trimString)
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(8)
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
