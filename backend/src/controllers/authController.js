import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';
import { JWT_SECRET } from '../middleware/auth.js';
import { logAuditAction } from '../middleware/auditLogger.js';

export function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    const user = db.prepare(`
      SELECT u.*, b.name as base_name, b.code as base_code
      FROM users u
      LEFT JOIN bases b ON u.base_id = b.id
      WHERE u.username = ? OR u.email = ?
    `).get(username, username);

    if (!user) {
      logAuditAction({
        req,
        action: 'USER_LOGIN_FAILED',
        entityType: 'AUTH',
        details: { username, reason: 'User not found' },
        status: 'FAILED'
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      logAuditAction({
        req,
        userId: user.id,
        userName: user.full_name,
        userRole: user.role,
        action: 'USER_LOGIN_FAILED',
        entityType: 'AUTH',
        baseId: user.base_id,
        details: { username, reason: 'Invalid password' },
        status: 'FAILED'
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, base_id: user.base_id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      military_rank: user.military_rank,
      role: user.role,
      base_id: user.base_id,
      base_name: user.base_name,
      base_code: user.base_code
    };

    logAuditAction({
      req,
      userId: user.id,
      userName: user.full_name,
      userRole: user.role,
      action: 'USER_LOGIN_SUCCESS',
      entityType: 'AUTH',
      baseId: user.base_id,
      details: { role: user.role, base: user.base_name || 'Global HQ' }
    });

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
}

export function getCurrentUser(req, res) {
  try {
    const user = db.prepare(`
      SELECT u.id, u.username, u.email, u.full_name, u.military_rank, u.role, u.base_id,
             b.name as base_name, b.code as base_code
      FROM users u
      LEFT JOIN bases b ON u.base_id = b.id
      WHERE u.id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * Demo Fast-Switch Endpoint:
 * Allows evaluators/reviewers to switch roles instantly without retyping passwords!
 */
export function switchDemoUser(req, res) {
  try {
    const { role, base_id } = req.body;

    let query = 'SELECT u.*, b.name as base_name, b.code as base_code FROM users u LEFT JOIN bases b ON u.base_id = b.id WHERE u.role = ?';
    const params = [role];

    if (base_id) {
      query += ' AND u.base_id = ?';
      params.push(base_id);
    }
    query += ' LIMIT 1';

    const user = db.prepare(query).get(...params);
    if (!user) {
      return res.status(404).json({ success: false, message: 'No demo user found for requested role' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, base_id: user.base_id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      military_rank: user.military_rank,
      role: user.role,
      base_id: user.base_id,
      base_name: user.base_name,
      base_code: user.base_code
    };

    return res.json({
      success: true,
      message: `Switched demo role to ${user.role} (${user.full_name})`,
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Switch demo user error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * List all pre-configured demo credentials for the UI helper
 */
export function getDemoCredentials(req, res) {
  const credentials = [
    {
      role: 'ADMIN',
      label: 'Global Admin / General',
      username: 'admin',
      password: 'Admin@1234',
      name: 'Gen. Arthur Kane',
      rank: 'General',
      base: 'Global HQ / All Bases',
      description: 'Unrestricted access to all bases, metrics, full audit logs, and system operations.'
    },
    {
      role: 'BASE_COMMANDER',
      label: 'Base Commander (Fort Liberty)',
      username: 'commander_liberty',
      password: 'Commander@1234',
      name: 'Col. Marcus Vance',
      rank: 'Colonel',
      base: 'Fort Liberty',
      description: 'Authorized commander for Fort Liberty: manages purchases, transfers, assignments, and expenditures.'
    },
    {
      role: 'LOGISTICS_OFFICER',
      label: 'Logistics Officer (Fort Liberty)',
      username: 'logistics_liberty',
      password: 'Logistics@1234',
      name: 'Capt. Ray Miller',
      rank: 'Captain',
      base: 'Fort Liberty',
      description: 'Supply chain officer: restricted to recording purchases and transfers; cannot modify personnel assignments.'
    },
    {
      role: 'LOGISTICS_OFFICER',
      label: 'Logistics Officer (Ramstein Air Base)',
      username: 'logistics_ramstein',
      password: 'Logistics@1234',
      name: 'Maj. Elena Rostova',
      rank: 'Major',
      base: 'Ramstein Air Base',
      description: 'European theatre logistics officer: handles European inbound/outbound transfers and supply procurement.'
    }
  ];

  return res.json({ success: true, credentials });
}
