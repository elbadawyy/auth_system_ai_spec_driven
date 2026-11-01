import { Column, Entity, Index, ObjectId, ObjectIdColumn } from 'typeorm';

@Entity('users')
export class User {
  @ObjectIdColumn()
  id!: ObjectId;

  @Index({ unique: true })
  @Column()
  email!: string;

  @Column()
  name!: string;

  @Column()
  passwordHash!: string;
}
