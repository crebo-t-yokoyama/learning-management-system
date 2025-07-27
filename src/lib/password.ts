import bcrypt from 'bcryptjs';

/**
 * パスワードをハッシュ化する
 * @param password 平文パスワード
 * @returns ハッシュ化されたパスワード
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * パスワードを検証する
 * @param password 平文パスワード
 * @param hashedPassword ハッシュ化されたパスワード
 * @returns パスワードが正しいかどうか
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}