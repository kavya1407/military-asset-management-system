import jwt from 'jsonwebtoken';
import db from '../config/database.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'vanguard-military-defense-jwt-secret-key-2026';

/**
 * Authenticate JWT token from Authorization header (Bearer <token>)
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access Denied: Authentication token required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, userPayload) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired authentication token'
      });
    }

    // Verify user still exists in database
    const user = db.prepare('SELECT id, base_id, username, email, full_name, role, military_rank FROM users WHERE id = ?').get(userPayload.id);
    if (!user) {
      return res.status(403).json({
        success: false,
        message: 'User account no longer exists'
      });
    }

    req.user = user;
    next();
  });
}

/**
 * Enforce Role-Based Access Control (RBAC)
 * Allowed roles: 'ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'
 */
export function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Action requires one of the following roles: [${allowedRoles.join(', ')}]. Your role is '${req.user.role}'`
      });
    }

    next();
  };
}

/**
 * Enforce Base Ownership / Scope:
 * - ADMIN has global access to all bases.
 * - BASE_COMMANDER and LOGISTICS_OFFICER can only access/modify their assigned base.
 */
export function checkBaseScope(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // Admins have global visibility
  if (req.user.role === 'ADMIN') {
    return next();
  }

  // Determine requested base ID from body, query, or params
  const requestedBaseId = Number(
    req.body.base_id ||
    req.body.origin_base_id ||
    req.query.base_id ||
    req.params.base_id
  );

  if (requestedBaseId && req.user.base_id !== requestedBaseId) {
    return res.status(403).json({
      success: false,
      message: `Access Denied: You are assigned to Base #${req.user.base_id} and cannot access or operate on Base #${requestedBaseId}`
    });
  }

  next();
}
