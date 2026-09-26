import db from '../config/database.js';
import { logAuditAction } from '../middleware/auditLogger.js';

/**
 * GET /api/purchases
 * List purchases with date range, equipment-type, base, and search filters
 */
export function getPurchases(req, res) {
  try {
    let { startDate, endDate, equipmentTypeId, baseId, search, limit = 50, offset = 0 } = req.query;

    // RBAC base scoping
    if (req.user && req.user.role !== 'ADMIN') {
      baseId = req.user.base_id;
    } else if (baseId === 'all') {
      baseId = null;
    }

    let query = `
      SELECT p.*,
             e.name as equipment_name, e.category as equipment_category, e.unit,
             b.name as base_name, b.code as base_code,
             u.full_name as recorded_by_name, u.military_rank as recorded_by_rank
      FROM purchases p
      JOIN equipment_types e ON p.equipment_type_id = e.id
      JOIN bases b ON p.base_id = b.id
      LEFT JOIN users u ON p.recorded_by_user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ' AND p.purchase_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND p.purchase_date <= ?';
      params.push(endDate);
    }
    if (equipmentTypeId && equipmentTypeId !== 'all') {
      query += ' AND p.equipment_type_id = ?';
      params.push(Number(equipmentTypeId));
    }
    if (baseId) {
      query += ' AND p.base_id = ?';
      params.push(Number(baseId));
    }
    if (search) {
      query += ' AND (p.order_number LIKE ? OR p.supplier LIKE ? OR e.name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    // Total count for pagination
    const countSql = query.replace('SELECT p.*,', 'SELECT COUNT(*) as count,').split('ORDER BY')[0];
    // Simple count query
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as sub`;
    const totalCount = db.prepare(countQuery).get(...params).total;

    query += ' ORDER BY p.purchase_date DESC, p.id DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const purchases = db.prepare(query).all(...params);

    return res.json({
      success: true,
      total: totalCount,
      limit: Number(limit),
      offset: Number(offset),
      purchases
    });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve purchases' });
  }
}

/**
 * POST /api/purchases
 * Record a new asset procurement / purchase
 * Roles: ADMIN, BASE_COMMANDER, LOGISTICS_OFFICER
 */
export function createPurchase(req, res) {
  try {
    let {
      base_id,
      equipment_type_id,
      quantity,
      unit_cost,
      supplier,
      order_number,
      purchase_date,
      notes
    } = req.body;

    // RBAC: Non-admin users are locked to their assigned base
    if (req.user.role !== 'ADMIN') {
      base_id = req.user.base_id;
    }

    if (!base_id || !equipment_type_id || !quantity || !unit_cost || !supplier || !purchase_date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required purchase details (base, equipment, quantity, unit cost, supplier, purchase date)'
      });
    }

    quantity = Number(quantity);
    unit_cost = Number(unit_cost);
    if (quantity <= 0 || unit_cost < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be positive and unit cost cannot be negative'
      });
    }

    const total_cost = quantity * unit_cost;

    // Generate order number if not provided
    if (!order_number) {
      order_number = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Verify equipment and base exist
    const equipment = db.prepare('SELECT * FROM equipment_types WHERE id = ?').get(equipment_type_id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment type not found' });
    }

    const base = db.prepare('SELECT * FROM bases WHERE id = ?').get(base_id);
    if (!base) {
      return res.status(404).json({ success: false, message: 'Military base not found' });
    }

    const insertStmt = db.prepare(`
      INSERT INTO purchases (
        base_id, equipment_type_id, quantity, unit_cost, total_cost, supplier, order_number, purchase_date, recorded_by_user_id, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      base_id,
      equipment_type_id,
      quantity,
      unit_cost,
      total_cost,
      supplier,
      order_number,
      purchase_date,
      req.user.id,
      notes || null
    );

    const newPurchaseId = result.lastInsertRowid;

    // Log transaction for complete auditability
    logAuditAction({
      req,
      action: 'PURCHASE_CREATED',
      entityType: 'PURCHASE',
      entityId: newPurchaseId,
      baseId: base_id,
      details: {
        order_number,
        item: equipment.name,
        category: equipment.category,
        quantity,
        unit_cost,
        total_cost,
        supplier,
        base: base.name
      }
    });

    const createdRecord = db.prepare(`
      SELECT p.*, e.name as equipment_name, b.name as base_name
      FROM purchases p
      JOIN equipment_types e ON p.equipment_type_id = e.id
      JOIN bases b ON p.base_id = b.id
      WHERE p.id = ?
    `).get(newPurchaseId);

    return res.status(201).json({
      success: true,
      message: `Purchase order ${order_number} successfully recorded`,
      purchase: createdRecord
    });
  } catch (error) {
    console.error('Error creating purchase:', error);
    if (error.message && error.message.includes('UNIQUE constraint failed: purchases.order_number')) {
      return res.status(409).json({ success: false, message: 'A purchase order with this order number already exists' });
    }
    return res.status(500).json({ success: false, message: 'Failed to record purchase' });
  }
}
