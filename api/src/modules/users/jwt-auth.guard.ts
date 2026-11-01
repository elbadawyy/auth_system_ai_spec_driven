import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiMessage } from '../../common/enums/api-message.enum';
import {
  AuthBearerScheme,
  AuthHttpHeader,
  AuthRequestKey,
  type AuthenticatedRequestUser,
} from './auth.constants';
import { JwtTokenService } from './jwt-token.service';

type RequestWithAuthUser = {
  headers: Record<string, string | string[] | undefined>;
  [AuthRequestKey.USER]?: AuthenticatedRequestUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtTokenService: JwtTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithAuthUser>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException(ApiMessage.AUTH_TOKEN_INVALID);
    }

    try {
      const payload = this.jwtTokenService.verifyAccessToken(token);
      request[AuthRequestKey.USER] = { userId: payload.sub };
      return true;
    } catch {
      throw new UnauthorizedException(ApiMessage.AUTH_TOKEN_INVALID);
    }
  }

  private extractBearerToken(request: RequestWithAuthUser): string | null {
    const headerValue = request.headers[AuthHttpHeader.AUTHORIZATION];
    const rawHeader = Array.isArray(headerValue) ? headerValue[0] : headerValue;

    if (typeof rawHeader !== 'string' || rawHeader.length === 0) {
      return null;
    }

    if (!rawHeader.startsWith(AuthBearerScheme.PREFIX)) {
      return null;
    }

    const token = rawHeader.slice(AuthBearerScheme.PREFIX.length).trim();
    return token.length > 0 ? token : null;
  }
}
