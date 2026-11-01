import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { SignInDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthSuccessResponse, UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  signup(@Body() dto: SignupDto): Promise<AuthSuccessResponse> {
    return this.usersService.signup(dto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  signin(@Body() dto: SignInDto): Promise<AuthSuccessResponse> {
    return this.usersService.signin(dto);
  }
}
