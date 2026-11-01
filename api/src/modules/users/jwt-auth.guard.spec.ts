import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiMessage } from '../../common/enums/api-message.enum';
import { AuthHttpHeader, AuthRequestKey } from './auth.constants';
import { JwtAuthGuard } from './jwt-auth.guard';

jest.mock('./jwt-token.service', () => ({
  JwtTokenService: class JwtTokenService {},
}));

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtTokenService: {
    verifyAccessToken: jest.Mock;
  };

  const createContext = (
    authorization?: string,
  ): { context: ExecutionContext; request: Record<string, unknown> } => {
    const request: Record<string, unknown> = {
      headers: authorization
        ? { [AuthHttpHeader.AUTHORIZATION]: authorization }
        : {},
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;

    return { context, request };
  };

  beforeEach(() => {
    jwtTokenService = {
      verifyAccessToken: jest.fn(),
    };
    guard = new JwtAuthGuard(jwtTokenService as never);
  });

  it('rejects missing Authorization header with 401', () => {
    const { context } = createContext();

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    try {
      guard.canActivate(context);
    } catch (error: unknown) {
      expect(error).toMatchObject({
        response: {
          message: ApiMessage.AUTH_TOKEN_INVALID,
        },
      });
    }
    expect(jwtTokenService.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('rejects non-Bearer scheme with 401', () => {
    const { context } = createContext('Basic abc');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(jwtTokenService.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('rejects empty Bearer token with 401', () => {
    const { context } = createContext('Bearer   ');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(jwtTokenService.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('rejects invalid or expired token with 401', () => {
    jwtTokenService.verifyAccessToken.mockImplementation(() => {
      throw new Error('jwt expired');
    });
    const { context } = createContext('Bearer expired.token');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(jwtTokenService.verifyAccessToken).toHaveBeenCalledWith(
      'expired.token',
    );
  });

  it('attaches userId from sub on valid token', () => {
    jwtTokenService.verifyAccessToken.mockReturnValue({
      sub: '507f1f77bcf86cd799439011',
      email: 'user@example.com',
    });
    const { context, request } = createContext('Bearer valid.token');

    expect(guard.canActivate(context)).toBe(true);
    expect(request[AuthRequestKey.USER]).toEqual({
      userId: '507f1f77bcf86cd799439011',
    });
  });
});
