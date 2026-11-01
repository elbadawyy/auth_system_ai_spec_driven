import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SignupDto } from './signup.dto';

async function validateSignup(
  plain: Record<string, unknown>,
): Promise<string[]> {
  const dto = plainToInstance(SignupDto, plain);
  const errors = await validate(dto);
  return errors.flatMap((error) => Object.values(error.constraints ?? {}));
}

describe('SignupDto', () => {
  const valid = {
    email: 'user@example.com',
    name: 'Ada Lovelace',
    password: 'Secret1!',
  };

  it('accepts a valid signup payload', async () => {
    const messages = await validateSignup(valid);
    expect(messages).toEqual([]);
  });

  it('rejects invalid email', async () => {
    const messages = await validateSignup({ ...valid, email: 'not-an-email' });
    expect(messages.length).toBeGreaterThan(0);
  });

  it('rejects name shorter than 3 characters after trim', async () => {
    const messages = await validateSignup({ ...valid, name: 'ab' });
    expect(messages.some((message) => /name/i.test(message))).toBe(true);
  });

  it('rejects whitespace-only name after trim', async () => {
    const messages = await validateSignup({ ...valid, name: '   ' });
    expect(messages.length).toBeGreaterThan(0);
  });

  it('rejects password shorter than 8 characters', async () => {
    const messages = await validateSignup({ ...valid, password: 'Ab1!' });
    expect(messages.some((message) => /password/i.test(message))).toBe(true);
  });

  it('rejects password without a letter', async () => {
    const messages = await validateSignup({
      ...valid,
      password: '12345678!',
    });
    expect(
      messages.some((message) => /letter/i.test(message)),
    ).toBe(true);
  });

  it('rejects password without a number', async () => {
    const messages = await validateSignup({
      ...valid,
      password: 'Password!',
    });
    expect(messages.some((message) => /digit/i.test(message))).toBe(true);
  });

  it('rejects password without a special character', async () => {
    const messages = await validateSignup({
      ...valid,
      password: 'Password1',
    });
    expect(
      messages.some((message) => /special character/i.test(message)),
    ).toBe(true);
  });

  it('normalizes email to trimmed lowercase', () => {
    const dto = plainToInstance(SignupDto, {
      ...valid,
      email: '  User@Example.COM ',
    });
    expect(dto.email).toBe('user@example.com');
  });
});
