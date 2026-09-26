import db from '../config/database.js';
import { logAuditAction } from '../middleware/auditLogger.js';
import { getAvailableStock } from './transferController.js';

/**
 * GET /api/assignments
 * List asset assignments to personnel with filters
 */
export function getAssignments(req, res) {
  try {
    let { baseId, equipmentTypeId, status, search, limit = 50, offset = 0 } = req.query;

    if (req.user && req.user.role !== 'ADMIN') {
      baseId = req.user.base_id;
    } else if (baseId === 'all') {
      baseId = null;
    }

    let query = `
      SELECT a.*,
             e.name as equipment_name, e.category as equipment_category, e.unit,
             b.name as base_name, b.code as base_code,
             u.full_name as assigned_by_name, u.military_rank as assigned_by_rank
      FROM assignments a
      JOIN equipment_types e ON a.equipment_type_id = e.id
      JOIN bases b ON a.base_id = b.id
      LEFT JOIN users u ON a.assigned_by_user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (baseId) {
      query += ' AND a.base_id = ?';
      params.push(Number(baseId));
    }
    if (equipmentTypeId && equipmentTypeId !== 'all') {
      query += ' AND a.equipment_type_id = ?';
      params.push(Number(equipmentTypeId));
    }
    if (status && status !== 'all') {
      query += ' AND a.status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (a.personnel_name LIKE ? OR a.military_id LIKE ? OR a.unit LIKE ? OR e.name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as sub`;
    const totalCount = db.prepare(countQuery).get(...params).total;

    query += ' ORDER BY a.assigned_date DESC, a.id DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const assignments = db.prepare(query).all(...params);

    return res.json({
      success: true,
      total: totalCount,
      limit: Number(limit),
      offset: Number(offset),
      assignments
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve assignments' });
  }
}

/**
 * POST /api/assignments
 * Assign asset to personnel
 * Allowed Roles: ADMIN, BASE_COMMANDER (LOGISTICS_OFFICER is restricted)
 */
export function createAssignment(req, res) {
  try {
    let {
      base_id,
      equipment_type_id,
      personnel_name,
      military_id,
      rank,
      unit,
      quantity,
      assigned_date,
      expected_return_date,
      notes
    } = req.body;

    if (req.user.role !== 'ADMIN') {
      base_id = req.user.base_id;
    }

    base_id = Number(base_id);
    equipment_type_id = Number(equipment_type_id);
    quantity = Number(quantity);

    if (!base_id || !equipment_type_id || !personnel_name || !military_id || !rank || !unit || !quantity || !assigned_date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required assignment fields (personnel name, military ID, rank, unit, asset, quantity, date)'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be positive' });
    }

    const equipment = db.prepare('SELECT * FROM equipment_types WHERE id = ?').get(equipment_type_id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment type not found' });
    }

    const base = db.prepare('SELECT * FROM bases WHERE id = ?').get(base_id);
    if (!base) {
      return res.status(404).json({ success: false, message: 'Base not found' });
    }

    // Check available unassigned stock
    const stockInfo = getAvailableStock(base_id, equipment_type_id);
    if (quantity > stockInfo.availableStock) {
      return res.status(400).json({
        success: false,
        message: `Insufficient unassigned stock at ${base.name}. Requested: ${quantity} ${equipment.unit}. Available: ${stockInfo.availableStock} ${equipment.unit}.`,
        availableStock: stockInfo.availableStock
      });
    }

    const insertStmt = db.prepare(`
      INSERT INTO assignments (
        base_id, equipment_type_id, personnel_name, military_id, rank, unit,
        quantity, assigned_date, expected_return_date, status, assigned_by_user_id, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ASSIGNED', ?, ?)
    `);

    const result = insertStmt.run(
      base_id,
      equipment_type_id,
      personnel_name,
      military_id,
      rank,
      unit,
      quantity,
      assigned_date,
      expected_return_date || null,
      req.user.id,
      notes || null
    );

    const newId = result.lastInsertRowid;

    logAuditAction({
      req,
      action: 'ASSET_ASSIGNED',
      entityType: 'ASSIGNMENT',
      entityId: newId,
      baseId: base_id,
      details: {
        personnel: `${rank} ${personnel_name} (${military_id})`,
        unit,
        item: equipment.name,
        quantity,
        base: base.name
      }
    });

    const assignment = db.prepare(`
      SELECT a.*, e.name as equipment_name, b.name as base_name
      FROM assignments a
      JOIN equipment_types e ON a.equipment_type_id = e.id
      JOIN bases b ON a.base_id = b.id
      WHERE a.id = ?
    `).get(newId);

    return res.status(201).json({
      success: true,
      message: `Asset successfully assigned to ${rank} ${personnel_name}`,
      assignment
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    return res.status(500).json({ success: false, message: 'Failed to create assignment' });
  }
}

/**
 * PATCH /api/assignments/:id/return
 * Mark assigned asset as returned to inventory armory
 * Allowed Roles: ADMIN, BASE_COMMANDER
 */
export function returnAssignment(req, res) {
  try {
    const { id } = req.params;
    const { return_date, return_notes } = req.body;

    const assignment = db.prepare(`
      SELECT a.*, e.name as equipment_name, b.name as base_name
      FROM assignments a
      JOIN equipment_types e ON a.equipment_type_id = e.id
      JOIN bases b ON a.base_id = b.id
      WHERE a.id = ?
    `).get(id);

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment record not found' });
    }

    if (assignment.status === 'RETURNED') {
      return res.status(400).json({ success: false, message: 'Asset is already marked as returned' });
    }

    // RBAC: Non-admin can only return assignments for their base
    if (req.user.role !== 'ADMIN' && req.user.base_id !== assignment.base_id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot modify assignments for other bases' });
    }

    const actualReturnDate = return_date || new Date().toISOString().split('T')[0];
    const updatedNotes = assignment.notes ? `${assignment.notes} | Return note: ${return_notes || 'Returned to armory'}` : (return_notes || 'Returned to armory');

    db.prepare(`
      UPDATE assignments
      SET status = 'RETURNED', return_date = ?, notes = ?
      WHERE id = ?
    `).run(actualReturnDate, updatedNotes, id);

    logAuditAction({
      req,
      action: 'ASSET_RETURNED',
      entityType: 'ASSIGNMENT',
      entityId: assignment.id,
      baseId: assignment.base_id,
      details: {
        personnel: `${assignment.rank} ${assignment.personnel_name}`,
        item: assignment.equipment_name,
        quantity: assignment.quantity,
        return_date: actualReturnDate
      }
    });

    return res.json({
      success: true,
      message: `Asset returned from ${assignment.personnel_name} and restored to base inventory`
    });
  } catch (error) {
    console.error('Error returning assignment:', error);
    return res.status(500).json({ success: false, message: 'Failed to process asset return' });
  }
}
