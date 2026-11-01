import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { User } from './user.entity';

export type CreateUserInput = {
  email: string;
  name: string;
  passwordHash: string;
};

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly users: MongoRepository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email } });
  }

  create(data: CreateUserInput): User {
    return this.users.create(data);
  }

  save(user: User): Promise<User> {
    return this.users.save(user);
  }
}
