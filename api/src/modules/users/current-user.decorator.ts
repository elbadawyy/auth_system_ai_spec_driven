import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiMessage } from '../../common/enums/api-message.enum';
import {
  AuthRequestKey,
  type AuthenticatedRequestUser,
} from './auth.constants';

type RequestWithAuthUser = {
  [AuthRequestKey.USER]?: AuthenticatedRequestUser;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<RequestWithAuthUser>();
    const authUser = request[AuthRequestKey.USER];

    if (!authUser || typeof authUser.userId !== 'string' || authUser.userId.length === 0) {
      throw new UnauthorizedException(ApiMessage.AUTH_TOKEN_INVALID);
    }

    return authUser.userId;
  },
);
