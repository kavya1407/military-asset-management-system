import db from '../config/database.js';

/**
 * Log a transaction to the audit_logs table
 */
export function logAuditAction({
  req = null,
  userId = null,
  userName = 'SYSTEM',
  userRole = 'SYSTEM',
  action,
  entityType,
  entityId = null,
  baseId = null,
  details = {},
  status = 'SUCCESS'
}) {
  try {
    let effectiveUserId = userId;
    let effectiveUserName = userName;
    let effectiveUserRole = userRole;
    let ipAddress = '127.0.0.1';

    if (req) {
      if (req.user) {
        effectiveUserId = req.user.id;
        effectiveUserName = `${req.user.military_rank ? req.user.military_rank + ' ' : ''}${req.user.full_name}`;
        effectiveUserRole = req.user.role;
      }
      ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    }

    const detailsStr = typeof details === 'string' ? details : JSON.stringify(details);

    const stmt = db.prepare(`
      INSERT INTO audit_logs (
        timestamp, user_id, user_name, user_role, action, entity_type, entity_id, base_id, details, ip_address, status
      ) VALUES (
        datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      effectiveUserId,
      effectiveUserName,
      effectiveUserRole,
      action,
      entityType,
      entityId,
      baseId,
      detailsStr,
      ipAddress,
      status
    );
  } catch (error) {
    console.error('[AuditLogger] Failed to write audit record:', error);
  }
}
