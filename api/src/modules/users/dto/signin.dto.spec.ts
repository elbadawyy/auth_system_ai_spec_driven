import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SignInDto } from './signin.dto';

async function validateSignIn(
  plain: Record<string, unknown>,
): Promise<string[]> {
  const dto = plainToInstance(SignInDto, plain);
  const errors = await validate(dto);
  return errors.flatMap((error) => Object.values(error.constraints ?? {}));
}

describe('SignInDto', () => {
  const valid = {
    email: 'user@example.com',
    password: 'Secret1!',
  };

  it('accepts a valid sign-in payload', async () => {
    const messages = await validateSignIn(valid);
    expect(messages).toEqual([]);
  });

  it('rejects invalid email', async () => {
    const messages = await validateSignIn({ ...valid, email: 'not-an-email' });
    expect(messages.length).toBeGreaterThan(0);
  });

  it('rejects password shorter than 8 characters', async () => {
    const messages = await validateSignIn({ ...valid, password: 'Ab1!' });
    expect(messages.some((message) => /password/i.test(message))).toBe(true);
  });

  it('rejects password without a letter', async () => {
    const messages = await validateSignIn({
      ...valid,
      password: '12345678!',
    });
    expect(messages.some((message) => /letter/i.test(message))).toBe(true);
  });

  it('rejects password without a digit', async () => {
    const messages = await validateSignIn({
      ...valid,
      password: 'Password!',
    });
    expect(messages.some((message) => /digit/i.test(message))).toBe(true);
  });

  it('rejects password without a special character', async () => {
    const messages = await validateSignIn({
      ...valid,
      password: 'Password1',
    });
    expect(
      messages.some((message) => /special character/i.test(message)),
    ).toBe(true);
  });

  it('normalizes email to trimmed lowercase', () => {
    const dto = plainToInstance(SignInDto, {
      ...valid,
      email: '  User@Example.COM ',
    });
    expect(dto.email).toBe('user@example.com');
  });
});
