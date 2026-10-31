import { Injectable } from '@nestjs/common';
import { ApiMessage } from './common/enums/api-message.enum';

export interface HelloResponse {
  message: ApiMessage;
}

@Injectable()
export class AppService {
  getHello(): HelloResponse {
    return { message: ApiMessage.HELLO_WORLD };
  }
}
