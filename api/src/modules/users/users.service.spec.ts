import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { ApiMessage } from '../../common/enums/api-message.enum';
import { SignupDto } from './dto/signup.dto';
import { User } from './user.entity';
import { UsersService } from './users.service';

jest.mock('./users.repository', () => ({
  UsersRepository: class UsersRepository {},
}));

jest.mock('./password.hasher', () => ({
  PasswordHasher: class PasswordHasher {},
}));

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: {
    findByEmail: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let passwordHasher: {
    hash: jest.Mock;
  };

  const validDto: SignupDto = {
    email: 'user@example.com',
    name: 'Ada Lovelace',
    password: 'Secret1!',
  };

  beforeEach(() => {
    usersRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    passwordHasher = {
      hash: jest.fn(),
    };
    service = new UsersService(
      usersRepository as never,
      passwordHasher as never,
    );
  });

  it('signs up successfully and returns user without password', async () => {
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

    const result = await service.signup(validDto);

    expect(result.message).toBe(ApiMessage.USER_SIGNUP_SUCCESS);
    expect(result.user).toEqual({
      id: savedUser.id.toHexString(),
      email: 'user@example.com',
      name: 'Ada Lovelace',
    });
    expect(result).not.toHaveProperty('password');
    expect(result.user).not.toHaveProperty('password');
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('rejects duplicate email without writing a user', async () => {
    usersRepository.findByEmail.mockResolvedValue({
      id: new ObjectId(),
      email: 'user@example.com',
      name: 'Existing',
      passwordHash: 'x',
    } as User);

    await expect(service.signup(validDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(usersRepository.create).not.toHaveBeenCalled();
    expect(usersRepository.save).not.toHaveBeenCalled();
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
      expect(user.passwordHash).not.toBe(validDto.password);
      return savedUser;
    });

    await service.signup(validDto);

    expect(passwordHasher.hash).toHaveBeenCalledWith(validDto.password);
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

    await expect(service.signup(validDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
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

    await expect(service.signup(validDto)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
