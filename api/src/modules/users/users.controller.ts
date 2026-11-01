import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { SignupResponse, UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  signup(@Body() dto: SignupDto): Promise<SignupResponse> {
    return this.usersService.signup(dto);
  }
}
