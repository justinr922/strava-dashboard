import jwt from 'jsonwebtoken';

export function signAppToken(athleteId) {
  const secret = process.env.APP_JWT_SECRET;
  if (!secret) throw new Error('APP_JWT_SECRET is not set');
  return jwt.sign(
    { sub: String(athleteId), type: 'app', iss: 'strava-dashboard' },
    secret,
    { algorithm: 'HS256', expiresIn: '7d' }
  );
}

export function verifyAppToken(token) {
  const secret = process.env.APP_JWT_SECRET;
  if (!secret) throw new Error('APP_JWT_SECRET is not set');
  return jwt.verify(token, secret, { algorithms: ['HS256'] });
}

export function requireAppAuth(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).send('Missing Authorization header');
  try {
    const payload = verifyAppToken(token);
    req.auth = { athleteId: parseInt(payload.sub, 10) };
    next();
  } catch (e) {
    return res.status(401).send('Invalid or expired token');
  }
}

