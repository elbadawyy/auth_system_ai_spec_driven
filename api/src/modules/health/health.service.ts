import { Injectable } from '@nestjs/common';
import { HealthStatus } from '../../common/enums/health-status.enum';

export interface HealthResponse {
  status: HealthStatus;
}

@Injectable()
export class HealthService {
  getHealth(): HealthResponse {
    return { status: HealthStatus.OK };
  }
}
