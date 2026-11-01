import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export type AccessTokenPayloadInput = {
  userId: string;
  email: string;
};

export type VerifiedAccessTokenPayload = {
  sub: string;
  email?: string;
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

  verifyAccessToken(token: string): VerifiedAccessTokenPayload {
    const payload: unknown = this.jwtService.verify(token);

    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid access token payload');
    }

    const record = payload as Record<string, unknown>;
    const sub = record.sub;

    if (typeof sub !== 'string' || sub.length === 0) {
      throw new Error('Invalid access token subject');
    }

    const email = record.email;
    if (email !== undefined && typeof email !== 'string') {
      throw new Error('Invalid access token email');
    }

    return {
      sub,
      ...(typeof email === 'string' ? { email } : {}),
    };
  }
}
