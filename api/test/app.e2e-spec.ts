import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ApiMessage } from './../src/common/enums/api-message.enum';
import { HealthStatus } from './../src/common/enums/health-status.enum';
import { AppModule } from './../src/app.module';

describe('API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('GET / returns Hello World JSON', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(HttpStatus.OK)
      .expect({ message: ApiMessage.HELLO_WORLD });
  });

  it('GET /health returns ok', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(HttpStatus.OK)
      .expect({ status: HealthStatus.OK });
  });

  afterEach(async () => {
    await app.close();
  });
});
