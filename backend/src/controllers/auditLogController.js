import db from '../config/database.js';

export function getAuditLogs(req, res) {
  try {
    let { action, entityType, baseId, startDate, endDate, limit = 100, offset = 0 } = req.query;

    if (req.user && req.user.role !== 'ADMIN') {
      baseId = req.user.base_id;
    } else if (baseId === 'all') {
      baseId = null;
    }

    let query = `
      SELECT al.*, b.name as base_name, b.code as base_code
      FROM audit_logs al
      LEFT JOIN bases b ON al.base_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (action && action !== 'all') {
      query += ' AND al.action = ?';
      params.push(action);
    }
    if (entityType && entityType !== 'all') {
      query += ' AND al.entity_type = ?';
      params.push(entityType);
    }
    if (baseId) {
      query += ' AND (al.base_id = ? OR al.base_id IS NULL)';
      params.push(Number(baseId));
    }
    if (startDate) {
      query += ' AND al.timestamp >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND al.timestamp <= ?';
      params.push(endDate);
    }

    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as sub`;
    const totalCount = db.prepare(countQuery).get(...params).total;

    query += ' ORDER BY al.timestamp DESC, al.id DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const logs = db.prepare(query).all(...params);

    return res.json({
      success: true,
      total: totalCount,
      limit: Number(limit),
      offset: Number(offset),
      logs
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve audit trail' });
  }
}
