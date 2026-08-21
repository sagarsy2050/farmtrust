import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, SECRET, { expiresIn: '30d' });
}

export function verifyToken(token) {
  try { return jwt.verify(token, SECRET); }
  catch { return null; }
}
