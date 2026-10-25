import bcrypt from 'bcryptjs';

/** Cost factor for bcrypt: higher is slower to brute-force (and slower to compute). */
const BCRYPT_ROUNDS = 10;

/** Hashes a plain-text password for storage. The plain password is never stored. */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** True if `password` matches the stored bcrypt `hash`. */
export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
