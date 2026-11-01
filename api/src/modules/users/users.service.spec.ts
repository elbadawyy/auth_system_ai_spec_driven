import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { ApiMessage } from '../../common/enums/api-message.enum';
import { SignInDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';
import { User } from './user.entity';
import { UsersService } from './users.service';

jest.mock('./users.repository', () => ({
  UsersRepository: class UsersRepository {},
}));

jest.mock('./password.hasher', () => ({
  PasswordHasher: class PasswordHasher {},
}));

jest.mock('./jwt-token.service', () => ({
  JwtTokenService: class JwtTokenService {},
}));

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: {
    findByEmail: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let passwordHasher: {
    hash: jest.Mock;
    compare: jest.Mock;
  };
  let jwtTokenService: {
    signAccessToken: jest.Mock;
  };

  const validSignupDto: SignupDto = {
    email: 'user@example.com',
    name: 'Ada Lovelace',
    password: 'Secret1!',
  };

  const validSignInDto: SignInDto = {
    email: 'user@example.com',
    password: 'Secret1!',
  };

  const accessToken = 'signed.jwt.token';

  beforeEach(() => {
    usersRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    passwordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };
    jwtTokenService = {
      signAccessToken: jest.fn().mockReturnValue(accessToken),
    };
    service = new UsersService(
      usersRepository as never,
      passwordHasher as never,
      jwtTokenService as never,
    );
  });

  describe('signup', () => {
    it('signs up successfully and returns JWT + user without password', async () => {
      const hashed = 'hashed-password-value';
      const savedUser = {
        id: new ObjectId(),
        email: 'user@example.com',
        name: 'Ada Lovelace',
        passwordHash: hashed,
      } as User;

      usersRepository.findByEmail.mockResolvedValue(null);
      passwordHasher.hash.mockResolvedValue(hashed);
      usersRepository.create.mockReturnValue(savedUser);
      usersRepository.save.mockResolvedValue(savedUser);

      const result = await service.signup(validSignupDto);

      expect(result.message).toBe(ApiMessage.USER_SIGNUP_SUCCESS);
      expect(result.accessToken).toBe(accessToken);
      expect(result.user).toEqual({
        id: savedUser.id.toHexString(),
        email: 'user@example.com',
        name: 'Ada Lovelace',
      });
      expect(result).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(jwtTokenService.signAccessToken).toHaveBeenCalledWith({
        userId: savedUser.id.toHexString(),
        email: 'user@example.com',
      });
    });

    it('rejects duplicate email without writing a user or issuing a token', async () => {
      usersRepository.findByEmail.mockResolvedValue({
        id: new ObjectId(),
        email: 'user@example.com',
        name: 'Existing',
        passwordHash: 'x',
      } as User);

      await expect(service.signup(validSignupDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(passwordHasher.hash).not.toHaveBeenCalled();
      expect(usersRepository.create).not.toHaveBeenCalled();
      expect(usersRepository.save).not.toHaveBeenCalled();
      expect(jwtTokenService.signAccessToken).not.toHaveBeenCalled();
    });

    it('hashes password before persistence and never stores plain text', async () => {
      const hashed = 'bcrypt-hash';
      const savedUser = {
        id: new ObjectId(),
        email: 'user@example.com',
        name: 'Ada Lovelace',
        passwordHash: hashed,
      } as User;

      usersRepository.findByEmail.mockResolvedValue(null);
      passwordHasher.hash.mockResolvedValue(hashed);
      usersRepository.create.mockImplementation(
        (data: { email: string; name: string; passwordHash: string }) => data,
      );
      usersRepository.save.mockImplementation(async (user: User) => {
        expect(user.passwordHash).toBe(hashed);
        expect(user.passwordHash).not.toBe(validSignupDto.password);
        return savedUser;
      });

      await service.signup(validSignupDto);

      expect(passwordHasher.hash).toHaveBeenCalledWith(validSignupDto.password);
      expect(usersRepository.create).toHaveBeenCalledWith({
        email: 'user@example.com',
        name: 'Ada Lovelace',
        passwordHash: hashed,
      });
      expect(usersRepository.save).toHaveBeenCalled();
    });

    it('maps Mongo duplicate-key on save to ConflictException', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      passwordHasher.hash.mockResolvedValue('hashed');
      usersRepository.create.mockReturnValue({
        email: 'user@example.com',
        name: 'Ada Lovelace',
        passwordHash: 'hashed',
      } as User);
      usersRepository.save.mockRejectedValue({ code: 11000 });

      await expect(service.signup(validSignupDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(jwtTokenService.signAccessToken).not.toHaveBeenCalled();
    });

    it('maps unexpected DB failures to InternalServerErrorException', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      passwordHasher.hash.mockResolvedValue('hashed');
      usersRepository.create.mockReturnValue({
        email: 'user@example.com',
        name: 'Ada Lovelace',
        passwordHash: 'hashed',
      } as User);
      usersRepository.save.mockRejectedValue(new Error('db down'));

      await expect(service.signup(validSignupDto)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
      expect(jwtTokenService.signAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('signin', () => {
    const storedUser = {
      id: new ObjectId(),
      email: 'user@example.com',
      name: 'Ada Lovelace',
      passwordHash: 'stored-hash',
    } as User;

    it('signs in successfully and returns JWT + user without password', async () => {
      usersRepository.findByEmail.mockResolvedValue(storedUser);
      passwordHasher.compare.mockResolvedValue(true);

      const result = await service.signin(validSignInDto);

      expect(result.message).toBe(ApiMessage.USER_SIGNIN_SUCCESS);
      expect(result.accessToken).toBe(accessToken);
      expect(result.user).toEqual({
        id: storedUser.id.toHexString(),
        email: 'user@example.com',
        name: 'Ada Lovelace',
      });
      expect(result).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(passwordHasher.compare).toHaveBeenCalledWith(
        validSignInDto.password,
        storedUser.passwordHash,
      );
      expect(jwtTokenService.signAccessToken).toHaveBeenCalledWith({
        userId: storedUser.id.toHexString(),
        email: 'user@example.com',
      });
    });

    it('returns the same generic 401 for unknown email', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);

      await expect(service.signin(validSignInDto)).rejects.toMatchObject({
        response: {
          message: ApiMessage.USER_INVALID_CREDENTIALS,
        },
      });
      await expect(service.signin(validSignInDto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(passwordHasher.compare).not.toHaveBeenCalled();
      expect(jwtTokenService.signAccessToken).not.toHaveBeenCalled();
    });

    it('returns the same generic 401 for wrong password', async () => {
      usersRepository.findByEmail.mockResolvedValue(storedUser);
      passwordHasher.compare.mockResolvedValue(false);

      await expect(service.signin(validSignInDto)).rejects.toMatchObject({
        response: {
          message: ApiMessage.USER_INVALID_CREDENTIALS,
        },
      });
      await expect(service.signin(validSignInDto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(passwordHasher.compare).toHaveBeenCalledWith(
        validSignInDto.password,
        storedUser.passwordHash,
      );
      expect(jwtTokenService.signAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('getMe', () => {
    const storedUser = {
      id: new ObjectId(),
      email: 'user@example.com',
      name: 'Ada Lovelace',
      passwordHash: 'stored-hash',
    } as User;

    it('returns profile without password or passwordHash', async () => {
      usersRepository.findById.mockResolvedValue(storedUser);

      const result = await service.getMe(storedUser.id.toHexString());

      expect(result).toEqual({
        id: storedUser.id.toHexString(),
        email: 'user@example.com',
        name: 'Ada Lovelace',
      });
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('passwordHash');
      expect(usersRepository.findById).toHaveBeenCalledWith(
        storedUser.id.toHexString(),
      );
    });

    it('throws NotFoundException when user id is missing', async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(service.getMe('507f1f77bcf86cd799439011')).rejects.toMatchObject(
        {
          response: {
            message: ApiMessage.USER_NOT_FOUND,
          },
        },
      );
      await expect(
        service.getMe('507f1f77bcf86cd799439011'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
