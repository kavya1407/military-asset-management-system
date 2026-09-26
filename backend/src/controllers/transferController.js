import db from '../config/database.js';
import { logAuditAction } from '../middleware/auditLogger.js';

/**
 * Helper to compute available (transferable) stock at a specific base for an equipment type
 */
export function getAvailableStock(baseId, equipmentTypeId) {
  // 1. Initial inventory
  const initInv = db.prepare(`
    SELECT COALESCE(SUM(initial_quantity), 0) as total
    FROM base_inventory
    WHERE base_id = ? AND equipment_type_id = ?
  `).get(baseId, equipmentTypeId).total;

  // 2. Purchases
  const purchases = db.prepare(`
    SELECT COALESCE(SUM(quantity), 0) as total
    FROM purchases
    WHERE base_id = ? AND equipment_type_id = ?
  `).get(baseId, equipmentTypeId).total;

  // 3. Transfers in (Completed)
  const transfersIn = db.prepare(`
    SELECT COALESCE(SUM(quantity), 0) as total
    FROM transfers
    WHERE destination_base_id = ? AND equipment_type_id = ? AND status = 'COMPLETED'
  `).get(baseId, equipmentTypeId).total;

  // 4. Transfers out (Completed or In-Transit)
  const transfersOut = db.prepare(`
    SELECT COALESCE(SUM(quantity), 0) as total
    FROM transfers
    WHERE origin_base_id = ? AND equipment_type_id = ? AND status IN ('COMPLETED', 'IN_TRANSIT')
  `).get(baseId, equipmentTypeId).total;

  // 5. Expenditures
  const expenditures = db.prepare(`
    SELECT COALESCE(SUM(quantity), 0) as total
    FROM expenditures
    WHERE base_id = ? AND equipment_type_id = ?
  `).get(baseId, equipmentTypeId).total;

  // 6. Active assignments currently out with soldiers
  const activeAssignments = db.prepare(`
    SELECT COALESCE(SUM(quantity), 0) as total
    FROM assignments
    WHERE base_id = ? AND equipment_type_id = ? AND status = 'ASSIGNED'
  `).get(baseId, equipmentTypeId).total;

  const totalStock = initInv + purchases + transfersIn - transfersOut - expenditures;
  const availableStock = Math.max(0, totalStock - activeAssignments);

  return { totalStock, activeAssignments, availableStock };
}

/**
 * GET /api/transfers
 * Fetch inter-base transfer history with filters
 */
export function getTransfers(req, res) {
  try {
    let { startDate, endDate, equipmentTypeId, baseId, status, priority, search, limit = 50, offset = 0 } = req.query;

    // RBAC: Non-admin users only see transfers involving their assigned base
    if (req.user && req.user.role !== 'ADMIN') {
      baseId = req.user.base_id;
    } else if (baseId === 'all') {
      baseId = null;
    }

    let query = `
      SELECT t.*,
             e.name as equipment_name, e.category as equipment_category, e.unit,
             ob.name as origin_base_name, ob.code as origin_base_code,
             db.name as destination_base_name, db.code as destination_base_code,
             u.full_name as initiated_by_name, u.military_rank as initiated_by_rank
      FROM transfers t
      JOIN equipment_types e ON t.equipment_type_id = e.id
      JOIN bases ob ON t.origin_base_id = ob.id
      JOIN bases db ON t.destination_base_id = db.id
      LEFT JOIN users u ON t.initiated_by_user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ' AND t.transfer_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND t.transfer_date <= ?';
      params.push(endDate);
    }
    if (equipmentTypeId && equipmentTypeId !== 'all') {
      query += ' AND t.equipment_type_id = ?';
      params.push(Number(equipmentTypeId));
    }
    if (baseId) {
      query += ' AND (t.origin_base_id = ? OR t.destination_base_id = ?)';
      params.push(Number(baseId), Number(baseId));
    }
    if (status && status !== 'all') {
      query += ' AND t.status = ?';
      params.push(status);
    }
    if (priority && priority !== 'all') {
      query += ' AND t.priority = ?';
      params.push(priority);
    }
    if (search) {
      query += ' AND (t.tracking_number LIKE ? OR t.reason LIKE ? OR e.name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as sub`;
    const totalCount = db.prepare(countQuery).get(...params).total;

    query += ' ORDER BY t.transfer_date DESC, t.id DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const transfers = db.prepare(query).all(...params);

    return res.json({
      success: true,
      total: totalCount,
      limit: Number(limit),
      offset: Number(offset),
      transfers
    });
  } catch (error) {
    console.error('Error fetching transfers:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve transfers' });
  }
}

/**
 * POST /api/transfers
 * Initiate an asset transfer between two military bases
 * Roles: ADMIN, BASE_COMMANDER, LOGISTICS_OFFICER
 */
export function createTransfer(req, res) {
  try {
    let {
      origin_base_id,
      destination_base_id,
      equipment_type_id,
      quantity,
      transfer_date,
      reason,
      priority = 'STANDARD',
      status = 'COMPLETED'
    } = req.body;

    origin_base_id = Number(origin_base_id);
    destination_base_id = Number(destination_base_id);
    equipment_type_id = Number(equipment_type_id);
    quantity = Number(quantity);

    // RBAC: Non-admin users must be associated with the origin base to transfer out
    if (req.user.role !== 'ADMIN' && req.user.base_id !== origin_base_id) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: You can only initiate transfers departing from your assigned base (#${req.user.base_id})`
      });
    }

    if (!origin_base_id || !destination_base_id || !equipment_type_id || !quantity || !transfer_date || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required transfer details (origin, destination, equipment, quantity, date, reason)'
      });
    }

    if (origin_base_id === destination_base_id) {
      return res.status(400).json({
        success: false,
        message: 'Origin base and Destination base cannot be the same installation'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Transfer quantity must be greater than zero'
      });
    }

    // Check equipment and bases exist
    const equipment = db.prepare('SELECT * FROM equipment_types WHERE id = ?').get(equipment_type_id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment type not found' });
    }

    const originBase = db.prepare('SELECT * FROM bases WHERE id = ?').get(origin_base_id);
    const destBase = db.prepare('SELECT * FROM bases WHERE id = ?').get(destination_base_id);
    if (!originBase || !destBase) {
      return res.status(404).json({ success: false, message: 'One or both bases not found' });
    }

    // Live inventory check at origin base
    const stockInfo = getAvailableStock(origin_base_id, equipment_type_id);
    if (quantity > stockInfo.availableStock) {
      return res.status(400).json({
        success: false,
        message: `Insufficient inventory at ${originBase.name}. Requested transfer: ${quantity} ${equipment.unit}. Available unassigned stock: ${stockInfo.availableStock} ${equipment.unit}.`,
        availableStock: stockInfo.availableStock,
        totalStock: stockInfo.totalStock,
        activeAssignments: stockInfo.activeAssignments
      });
    }

    const tracking_number = `TRF-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const insertStmt = db.prepare(`
      INSERT INTO transfers (
        tracking_number, origin_base_id, destination_base_id, equipment_type_id,
        quantity, transfer_date, reason, priority, status, initiated_by_user_id, approved_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      tracking_number,
      origin_base_id,
      destination_base_id,
      equipment_type_id,
      quantity,
      transfer_date,
      reason,
      priority,
      status,
      req.user.id,
      req.user.id
    );

    const newTransferId = result.lastInsertRowid;

    // Log transaction
    logAuditAction({
      req,
      action: 'TRANSFER_INITIATED',
      entityType: 'TRANSFER',
      entityId: newTransferId,
      baseId: origin_base_id,
      details: {
        tracking_number,
        item: equipment.name,
        quantity,
        origin_base: originBase.name,
        destination_base: destBase.name,
        priority,
        status,
        reason
      }
    });

    const createdRecord = db.prepare(`
      SELECT t.*, e.name as equipment_name,
             ob.name as origin_base_name, db.name as destination_base_name
      FROM transfers t
      JOIN equipment_types e ON t.equipment_type_id = e.id
      JOIN bases ob ON t.origin_base_id = ob.id
      JOIN bases db ON t.destination_base_id = db.id
      WHERE t.id = ?
    `).get(newTransferId);

    return res.status(201).json({
      success: true,
      message: `Transfer ${tracking_number} dispatched from ${originBase.name} to ${destBase.name}`,
      transfer: createdRecord
    });
  } catch (error) {
    console.error('Error creating transfer:', error);
    return res.status(500).json({ success: false, message: 'Failed to initiate transfer' });
  }
}

/**
 * PATCH /api/transfers/:id/status
 * Update transfer status (e.g. mark IN_TRANSIT as COMPLETED or CANCELLED)
 */
export function updateTransferStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['COMPLETED', 'IN_TRANSIT', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const transfer = db.prepare(`
      SELECT t.*, ob.name as origin_base_name, db.name as dest_base_name
      FROM transfers t
      JOIN bases ob ON t.origin_base_id = ob.id
      JOIN bases db ON t.destination_base_id = db.id
      WHERE t.id = ?
    `).get(id);

    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer record not found' });
    }

    // RBAC: Check user has authority on either origin or destination base
    if (req.user.role !== 'ADMIN') {
      if (req.user.base_id !== transfer.origin_base_id && req.user.base_id !== transfer.destination_base_id) {
        return res.status(403).json({ success: false, message: 'Forbidden: You do not have authority over this transfer' });
      }
    }

    db.prepare('UPDATE transfers SET status = ?, approved_by_user_id = ? WHERE id = ?').run(status, req.user.id, id);

    logAuditAction({
      req,
      action: 'TRANSFER_STATUS_UPDATED',
      entityType: 'TRANSFER',
      entityId: transfer.id,
      baseId: transfer.destination_base_id,
      details: {
        tracking_number: transfer.tracking_number,
        old_status: transfer.status,
        new_status: status
      }
    });

    return res.json({
      success: true,
      message: `Transfer ${transfer.tracking_number} status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating transfer status:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
