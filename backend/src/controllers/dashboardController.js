import db from '../config/database.js';

/**
 * Helper to extract and sanitize filter parameters
 */
function parseFilters(req) {
  let { startDate, endDate, baseId, equipmentTypeId } = req.query;

  // Enforce base scoping for non-admin roles
  if (req.user && req.user.role !== 'ADMIN') {
    baseId = req.user.base_id;
  } else if (baseId === 'all' || baseId === '') {
    baseId = null;
  } else if (baseId) {
    baseId = Number(baseId);
  }

  if (equipmentTypeId === 'all' || equipmentTypeId === '') {
    equipmentTypeId = null;
  } else if (equipmentTypeId) {
    equipmentTypeId = Number(equipmentTypeId);
  }

  return {
    startDate: startDate || null,
    endDate: endDate || null,
    baseId,
    equipmentTypeId
  };
}

/**
 * GET /api/dashboard/metrics
 * Calculates Opening Balance, Closing Balance, Net Movement, Assigned, Expended
 */
export function getDashboardMetrics(req, res) {
  try {
    const { startDate, endDate, baseId, equipmentTypeId } = parseFilters(req);

    // 1. Initial Baseline Inventory
    let baseInvQuery = 'SELECT COALESCE(SUM(initial_quantity), 0) as total FROM base_inventory WHERE 1=1';
    const baseInvParams = [];
    if (baseId) {
      baseInvQuery += ' AND base_id = ?';
      baseInvParams.push(baseId);
    }
    if (equipmentTypeId) {
      baseInvQuery += ' AND equipment_type_id = ?';
      baseInvParams.push(equipmentTypeId);
    }
    const initialBaseline = db.prepare(baseInvQuery).get(...baseInvParams).total;

    // 2. Pre-Window Movements (Strictly before startDate)
    let prePurchases = 0;
    let preTransfersIn = 0;
    let preTransfersOut = 0;
    let preExpenditures = 0;

    if (startDate) {
      // Pre-Purchases
      let pQuery = 'SELECT COALESCE(SUM(quantity), 0) as total FROM purchases WHERE purchase_date < ?';
      const pParams = [startDate];
      if (baseId) { pQuery += ' AND base_id = ?'; pParams.push(baseId); }
      if (equipmentTypeId) { pQuery += ' AND equipment_type_id = ?'; pParams.push(equipmentTypeId); }
      prePurchases = db.prepare(pQuery).get(...pParams).total;

      // Pre-Transfers In
      if (baseId) {
        let tiQuery = `SELECT COALESCE(SUM(quantity), 0) as total FROM transfers WHERE status = 'COMPLETED' AND transfer_date < ? AND destination_base_id = ?`;
        const tiParams = [startDate, baseId];
        if (equipmentTypeId) { tiQuery += ' AND equipment_type_id = ?'; tiParams.push(equipmentTypeId); }
        preTransfersIn = db.prepare(tiQuery).get(...tiParams).total;

        // Pre-Transfers Out
        let toQuery = `SELECT COALESCE(SUM(quantity), 0) as total FROM transfers WHERE status = 'COMPLETED' AND transfer_date < ? AND origin_base_id = ?`;
        const toParams = [startDate, baseId];
        if (equipmentTypeId) { toQuery += ' AND equipment_type_id = ?'; toParams.push(equipmentTypeId); }
        preTransfersOut = db.prepare(toQuery).get(...toParams).total;
      }

      // Pre-Expenditures
      let eQuery = 'SELECT COALESCE(SUM(quantity), 0) as total FROM expenditures WHERE date < ?';
      const eParams = [startDate];
      if (baseId) { eQuery += ' AND base_id = ?'; eParams.push(baseId); }
      if (equipmentTypeId) { eQuery += ' AND equipment_type_id = ?'; eParams.push(equipmentTypeId); }
      preExpenditures = db.prepare(eQuery).get(...eParams).total;
    }

    const openingBalance = initialBaseline + prePurchases + preTransfersIn - preTransfersOut - preExpenditures;

    // 3. Current Window Transactions
    // Window Purchases
    let winPQuery = 'SELECT COALESCE(SUM(quantity), 0) as total, COALESCE(SUM(total_cost), 0) as total_cost, COUNT(*) as count FROM purchases WHERE 1=1';
    const winPParams = [];
    if (startDate) { winPQuery += ' AND purchase_date >= ?'; winPParams.push(startDate); }
    if (endDate) { winPQuery += ' AND purchase_date <= ?'; winPParams.push(endDate); }
    if (baseId) { winPQuery += ' AND base_id = ?'; winPParams.push(baseId); }
    if (equipmentTypeId) { winPQuery += ' AND equipment_type_id = ?'; winPParams.push(equipmentTypeId); }
    const pResult = db.prepare(winPQuery).get(...winPParams);
    const purchasesQty = pResult.total;
    const purchasesCost = pResult.total_cost;
    const purchasesCount = pResult.count;

    // Window Transfers In
    let transfersInQty = 0;
    let transfersInCount = 0;
    let transfersOutQty = 0;
    let transfersOutCount = 0;

    if (baseId) {
      // Specific base Transfers In
      let tiQuery = `SELECT COALESCE(SUM(quantity), 0) as total, COUNT(*) as count FROM transfers WHERE status = 'COMPLETED' AND destination_base_id = ?`;
      const tiParams = [baseId];
      if (startDate) { tiQuery += ' AND transfer_date >= ?'; tiParams.push(startDate); }
      if (endDate) { tiQuery += ' AND transfer_date <= ?'; tiParams.push(endDate); }
      if (equipmentTypeId) { tiQuery += ' AND equipment_type_id = ?'; tiParams.push(equipmentTypeId); }
      const tiResult = db.prepare(tiQuery).get(...tiParams);
      transfersInQty = tiResult.total;
      transfersInCount = tiResult.count;

      // Specific base Transfers Out
      let toQuery = `SELECT COALESCE(SUM(quantity), 0) as total, COUNT(*) as count FROM transfers WHERE status = 'COMPLETED' AND origin_base_id = ?`;
      const toParams = [baseId];
      if (startDate) { toQuery += ' AND transfer_date >= ?'; toParams.push(startDate); }
      if (endDate) { toQuery += ' AND transfer_date <= ?'; toParams.push(endDate); }
      if (equipmentTypeId) { toQuery += ' AND equipment_type_id = ?'; toParams.push(equipmentTypeId); }
      const toResult = db.prepare(toQuery).get(...toParams);
      transfersOutQty = toResult.total;
      transfersOutCount = toResult.count;
    } else {
      // Global View: Total inter-base movements across all bases
      let tGlobalQuery = `SELECT COALESCE(SUM(quantity), 0) as total, COUNT(*) as count FROM transfers WHERE status = 'COMPLETED'`;
      const tGlobalParams = [];
      if (startDate) { tGlobalQuery += ' AND transfer_date >= ?'; tGlobalParams.push(startDate); }
      if (endDate) { tGlobalQuery += ' AND transfer_date <= ?'; tGlobalParams.push(endDate); }
      if (equipmentTypeId) { tGlobalQuery += ' AND equipment_type_id = ?'; tGlobalParams.push(equipmentTypeId); }
      const tgResult = db.prepare(tGlobalQuery).get(...tGlobalParams);
      // For all bases, inter-base movements shift between bases; in global aggregate, in = out = volume
      transfersInQty = tgResult.total;
      transfersInCount = tgResult.count;
      transfersOutQty = tgResult.total;
      transfersOutCount = tgResult.count;
    }

    // Net Movement = Purchases + Transfers In - Transfers Out
    const netMovement = purchasesQty + transfersInQty - transfersOutQty;

    // Window Expenditures
    let expQuery = 'SELECT COALESCE(SUM(quantity), 0) as total, COUNT(*) as count FROM expenditures WHERE 1=1';
    const expParams = [];
    if (startDate) { expQuery += ' AND date >= ?'; expParams.push(startDate); }
    if (endDate) { expQuery += ' AND date <= ?'; expParams.push(endDate); }
    if (baseId) { expQuery += ' AND base_id = ?'; expParams.push(baseId); }
    if (equipmentTypeId) { expQuery += ' AND equipment_type_id = ?'; expParams.push(equipmentTypeId); }
    const expResult = db.prepare(expQuery).get(...expParams);
    const expendedQty = expResult.total;
    const expendedCount = expResult.count;

    // Closing Balance = Opening Balance + Net Movement - Expended
    const closingBalance = openingBalance + netMovement - expendedQty;

    // Active Assigned Assets (Personnel checked out)
    let assignQuery = `SELECT COALESCE(SUM(quantity), 0) as total, COUNT(*) as count FROM assignments WHERE status = 'ASSIGNED'`;
    const assignParams = [];
    if (endDate) { assignQuery += ' AND assigned_date <= ?'; assignParams.push(endDate); }
    if (baseId) { assignQuery += ' AND base_id = ?'; assignParams.push(baseId); }
    if (equipmentTypeId) { assignQuery += ' AND equipment_type_id = ?'; assignParams.push(equipmentTypeId); }
    const assignResult = db.prepare(assignQuery).get(...assignParams);
    const activeAssignedQty = assignResult.total;
    const activeAssignedCount = assignResult.count;

    // Available unassigned inventory
    const availableStock = Math.max(0, closingBalance - activeAssignedQty);

    return res.json({
      success: true,
      filters: { startDate, endDate, baseId, equipmentTypeId },
      metrics: {
        openingBalance,
        closingBalance,
        netMovement,
        purchases: {
          quantity: purchasesQty,
          count: purchasesCount,
          totalCost: purchasesCost
        },
        transfersIn: {
          quantity: transfersInQty,
          count: transfersInCount
        },
        transfersOut: {
          quantity: transfersOutQty,
          count: transfersOutCount
        },
        expended: {
          quantity: expendedQty,
          count: expendedCount
        },
        assigned: {
          quantity: activeAssignedQty,
          count: activeAssignedCount
        },
        availableStock
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return res.status(500).json({ success: false, message: 'Failed to calculate metrics' });
  }
}

/**
 * GET /api/dashboard/net-movement-details
 * Bonus Feature: Detailed breakdown modal for Purchases, Transfers In, and Transfers Out
 */
export function getNetMovementDetails(req, res) {
  try {
    const { startDate, endDate, baseId, equipmentTypeId } = parseFilters(req);

    // 1. Detailed Purchases
    let pQuery = `
      SELECT p.id, p.order_number, p.purchase_date, p.quantity, p.unit_cost, p.total_cost,
             p.supplier, p.notes,
             e.name as equipment_name, e.category as equipment_category, e.unit,
             b.name as base_name, b.code as base_code,
             u.full_name as recorded_by
      FROM purchases p
      JOIN equipment_types e ON p.equipment_type_id = e.id
      JOIN bases b ON p.base_id = b.id
      LEFT JOIN users u ON p.recorded_by_user_id = u.id
      WHERE 1=1
    `;
    const pParams = [];
    if (startDate) { pQuery += ' AND p.purchase_date >= ?'; pParams.push(startDate); }
    if (endDate) { pQuery += ' AND p.purchase_date <= ?'; pParams.push(endDate); }
    if (baseId) { pQuery += ' AND p.base_id = ?'; pParams.push(baseId); }
    if (equipmentTypeId) { pQuery += ' AND p.equipment_type_id = ?'; pParams.push(equipmentTypeId); }
    pQuery += ' ORDER BY p.purchase_date DESC, p.id DESC';
    const purchases = db.prepare(pQuery).all(...pParams);

    // 2. Detailed Transfers In
    let tiQuery = `
      SELECT t.id, t.tracking_number, t.transfer_date, t.quantity, t.reason, t.priority, t.status,
             e.name as equipment_name, e.category as equipment_category, e.unit,
             ob.name as origin_base_name, ob.code as origin_base_code,
             db.name as destination_base_name, db.code as destination_base_code,
             u.full_name as initiated_by
      FROM transfers t
      JOIN equipment_types e ON t.equipment_type_id = e.id
      JOIN bases ob ON t.origin_base_id = ob.id
      JOIN bases db ON t.destination_base_id = db.id
      LEFT JOIN users u ON t.initiated_by_user_id = u.id
      WHERE t.status = 'COMPLETED'
    `;
    const tiParams = [];
    if (baseId) {
      tiQuery += ' AND t.destination_base_id = ?';
      tiParams.push(baseId);
    }
    if (startDate) { tiQuery += ' AND t.transfer_date >= ?'; tiParams.push(startDate); }
    if (endDate) { tiQuery += ' AND t.transfer_date <= ?'; tiParams.push(endDate); }
    if (equipmentTypeId) { tiQuery += ' AND t.equipment_type_id = ?'; tiParams.push(equipmentTypeId); }
    tiQuery += ' ORDER BY t.transfer_date DESC, t.id DESC';
    const transfersIn = db.prepare(tiQuery).all(...tiParams);

    // 3. Detailed Transfers Out
    let toQuery = `
      SELECT t.id, t.tracking_number, t.transfer_date, t.quantity, t.reason, t.priority, t.status,
             e.name as equipment_name, e.category as equipment_category, e.unit,
             ob.name as origin_base_name, ob.code as origin_base_code,
             db.name as destination_base_name, db.code as destination_base_code,
             u.full_name as initiated_by
      FROM transfers t
      JOIN equipment_types e ON t.equipment_type_id = e.id
      JOIN bases ob ON t.origin_base_id = ob.id
      JOIN bases db ON t.destination_base_id = db.id
      LEFT JOIN users u ON t.initiated_by_user_id = u.id
      WHERE t.status = 'COMPLETED'
    `;
    const toParams = [];
    if (baseId) {
      toQuery += ' AND t.origin_base_id = ?';
      toParams.push(baseId);
    }
    if (startDate) { toQuery += ' AND t.transfer_date >= ?'; toParams.push(startDate); }
    if (endDate) { toQuery += ' AND t.transfer_date <= ?'; toParams.push(endDate); }
    if (equipmentTypeId) { toQuery += ' AND t.equipment_type_id = ?'; toParams.push(equipmentTypeId); }
    toQuery += ' ORDER BY t.transfer_date DESC, t.id DESC';
    const transfersOut = db.prepare(toQuery).all(...toParams);

    const totalPurchasesQty = purchases.reduce((acc, p) => acc + p.quantity, 0);
    const totalPurchasesCost = purchases.reduce((acc, p) => acc + p.total_cost, 0);
    const totalTransfersInQty = transfersIn.reduce((acc, t) => acc + t.quantity, 0);
    const totalTransfersOutQty = transfersOut.reduce((acc, t) => acc + t.quantity, 0);

    const netMovementQty = totalPurchasesQty + totalTransfersInQty - totalTransfersOutQty;

    return res.json({
      success: true,
      summary: {
        purchasesCount: purchases.length,
        purchasesQty: totalPurchasesQty,
        purchasesTotalCost: totalPurchasesCost,
        transfersInCount: transfersIn.length,
        transfersInQty: totalTransfersInQty,
        transfersOutCount: transfersOut.length,
        transfersOutQty: totalTransfersOutQty,
        netMovementQty,
        formula: 'Net Movement = Purchases + Transfers In - Transfers Out'
      },
      purchases,
      transfersIn,
      transfersOut
    });
  } catch (error) {
    console.error('Error fetching net movement details:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve net movement breakdown' });
  }
}

/**
 * GET /api/dashboard/equipment-distribution
 * Visual distribution of assets by category (Weapons, Vehicles, Ammunition, etc.)
 */
export function getCategoryDistribution(req, res) {
  try {
    const { baseId } = parseFilters(req);

    let query = `
      SELECT e.category,
             COUNT(DISTINCT e.id) as item_count,
             SUM(bi.initial_quantity) as initial_total
      FROM equipment_types e
      LEFT JOIN base_inventory bi ON e.id = bi.equipment_type_id
      WHERE 1=1
    `;
    const params = [];
    if (baseId) {
      query += ' AND bi.base_id = ?';
      params.push(baseId);
    }
    query += ' GROUP BY e.category ORDER BY initial_total DESC';

    const distribution = db.prepare(query).all(...params);
    return res.json({ success: true, distribution });
  } catch (error) {
    console.error('Error fetching category distribution:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * GET /api/dashboard/bases-overview
 * Overview of all bases with commander and metrics (Admin overview)
 */
export function getBasesOverview(req, res) {
  try {
    const bases = db.prepare(`
      SELECT b.id, b.name, b.code, b.location, b.commander_name, b.contact_email,
             (SELECT COUNT(*) FROM purchases WHERE base_id = b.id) as total_purchases,
             (SELECT COUNT(*) FROM assignments WHERE base_id = b.id AND status = 'ASSIGNED') as active_assignments,
             (SELECT COALESCE(SUM(initial_quantity), 0) FROM base_inventory WHERE base_id = b.id) as initial_inventory
      FROM bases b
      ORDER BY b.id ASC
    `).all();

    return res.json({ success: true, bases });
  } catch (error) {
    console.error('Error fetching bases overview:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
