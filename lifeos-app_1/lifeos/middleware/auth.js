/**
 * middleware/auth.js — JWT Authentication middleware
 * Demonstrates: middleware pattern, token validation, error handling
 */

const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'lifeos_secret_2024';

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded; // Attach user payload to request
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = authMiddleware;
