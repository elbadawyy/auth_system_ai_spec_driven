import { ArgumentsHost, ConflictException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../enums/error-code.enum';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
  });

  const createHost = (): ArgumentsHost =>
    ({
      switchToHttp: () => ({
        getResponse: () => ({
          status: statusMock,
        }),
        getRequest: () => ({
          url: '/users/signup',
        }),
      }),
    }) as ArgumentsHost;

  it('maps HTTP 409 Conflict to errorCode CONFLICT', () => {
    filter.catch(new ConflictException('duplicate'), createHost());

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        errorCode: ErrorCode.CONFLICT,
        path: '/users/signup',
      }),
    );
  });
});
