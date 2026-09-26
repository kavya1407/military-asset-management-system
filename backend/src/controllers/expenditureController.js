import db from '../config/database.js';
import { logAuditAction } from '../middleware/auditLogger.js';
import { getAvailableStock } from './transferController.js';

/**
 * GET /api/expenditures
 * List recorded asset expenditures with filters
 */
export function getExpenditures(req, res) {
  try {
    let { startDate, endDate, equipmentTypeId, baseId, expenditureType, search, limit = 50, offset = 0 } = req.query;

    if (req.user && req.user.role !== 'ADMIN') {
      baseId = req.user.base_id;
    } else if (baseId === 'all') {
      baseId = null;
    }

    let query = `
      SELECT ex.*,
             e.name as equipment_name, e.category as equipment_category, e.unit,
             b.name as base_name, b.code as base_code,
             u.full_name as approved_by_name, u.military_rank as approved_by_rank
      FROM expenditures ex
      JOIN equipment_types e ON ex.equipment_type_id = e.id
      JOIN bases b ON ex.base_id = b.id
      LEFT JOIN users u ON ex.approved_by_user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ' AND ex.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND ex.date <= ?';
      params.push(endDate);
    }
    if (baseId) {
      query += ' AND ex.base_id = ?';
      params.push(Number(baseId));
    }
    if (equipmentTypeId && equipmentTypeId !== 'all') {
      query += ' AND ex.equipment_type_id = ?';
      params.push(Number(equipmentTypeId));
    }
    if (expenditureType && expenditureType !== 'all') {
      query += ' AND ex.expenditure_type = ?';
      params.push(expenditureType);
    }
    if (search) {
      query += ' AND (ex.mission_reference LIKE ? OR e.name LIKE ? OR ex.notes LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as sub`;
    const totalCount = db.prepare(countQuery).get(...params).total;

    query += ' ORDER BY ex.date DESC, ex.id DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const expenditures = db.prepare(query).all(...params);

    return res.json({
      success: true,
      total: totalCount,
      limit: Number(limit),
      offset: Number(offset),
      expenditures
    });
  } catch (error) {
    console.error('Error fetching expenditures:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve expenditures' });
  }
}

/**
 * POST /api/expenditures
 * Record an asset expenditure (combat, training exercise, decommissioned, expired)
 * Allowed Roles: ADMIN, BASE_COMMANDER (LOGISTICS_OFFICER is restricted)
 */
export function createExpenditure(req, res) {
  try {
    let {
      base_id,
      equipment_type_id,
      quantity,
      expenditure_type,
      date,
      mission_reference,
      notes
    } = req.body;

    if (req.user.role !== 'ADMIN') {
      base_id = req.user.base_id;
    }

    base_id = Number(base_id);
    equipment_type_id = Number(equipment_type_id);
    quantity = Number(quantity);

    if (!base_id || !equipment_type_id || !quantity || !expenditure_type || !date || !mission_reference) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields (base, equipment, quantity, expenditure type, date, mission reference)'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Expenditure quantity must be greater than zero' });
    }

    const validTypes = ['TRAINING_EXERCISE', 'COMBAT_OPERATION', 'DECOMMISSIONED_DAMAGED', 'EXPIRED_CONSUMABLE', 'ROUTINE_EXPENDITURE'];
    if (!validTypes.includes(expenditure_type)) {
      return res.status(400).json({ success: false, message: `Invalid expenditure type. Must be one of: ${validTypes.join(', ')}` });
    }

    const equipment = db.prepare('SELECT * FROM equipment_types WHERE id = ?').get(equipment_type_id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment type not found' });
    }

    const base = db.prepare('SELECT * FROM bases WHERE id = ?').get(base_id);
    if (!base) {
      return res.status(404).json({ success: false, message: 'Base not found' });
    }

    // Verify stock availability
    const stockInfo = getAvailableStock(base_id, equipment_type_id);
    if (quantity > stockInfo.availableStock) {
      return res.status(400).json({
        success: false,
        message: `Insufficient inventory at ${base.name}. Requested expenditure: ${quantity} ${equipment.unit}. Available unassigned stock: ${stockInfo.availableStock} ${equipment.unit}.`,
        availableStock: stockInfo.availableStock
      });
    }

    const insertStmt = db.prepare(`
      INSERT INTO expenditures (
        base_id, equipment_type_id, quantity, expenditure_type, date, mission_reference, approved_by_user_id, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      base_id,
      equipment_type_id,
      quantity,
      expenditure_type,
      date,
      mission_reference,
      req.user.id,
      notes || null
    );

    const newId = result.lastInsertRowid;

    logAuditAction({
      req,
      action: 'ASSET_EXPENDED',
      entityType: 'EXPENDITURE',
      entityId: newId,
      baseId: base_id,
      details: {
        item: equipment.name,
        quantity,
        expenditure_type,
        mission_reference,
        base: base.name
      }
    });

    const expenditure = db.prepare(`
      SELECT ex.*, e.name as equipment_name, b.name as base_name
      FROM expenditures ex
      JOIN equipment_types e ON ex.equipment_type_id = e.id
      JOIN bases b ON ex.base_id = b.id
      WHERE ex.id = ?
    `).get(newId);

    return res.status(201).json({
      success: true,
      message: `Expenditure recorded for mission ${mission_reference}`,
      expenditure
    });
  } catch (error) {
    console.error('Error recording expenditure:', error);
    return res.status(500).json({ success: false, message: 'Failed to record expenditure' });
  }
}
