import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export type AccessTokenPayloadInput = {
  userId: string;
  email: string;
};

@Injectable()
export class JwtTokenService {
  constructor(private readonly jwtService: JwtService) {}

  signAccessToken(input: AccessTokenPayloadInput): string {
    return this.jwtService.sign({
      sub: input.userId,
      email: input.email,
    });
  }
}
