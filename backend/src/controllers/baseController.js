import db from '../config/database.js';
import { getAvailableStock } from './transferController.js';

export function getBases(req, res) {
  try {
    const bases = db.prepare('SELECT * FROM bases ORDER BY id ASC').all();
    return res.json({ success: true, bases });
  } catch (error) {
    console.error('Error fetching bases:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

export function getEquipmentTypes(req, res) {
  try {
    const equipment = db.prepare('SELECT * FROM equipment_types ORDER BY category ASC, name ASC').all();
    return res.json({ success: true, equipment });
  } catch (error) {
    console.error('Error fetching equipment types:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * GET /api/bases/:id/inventory
 * Detailed inventory table for a specific base with calculated real-time stock
 */
export function getBaseInventory(req, res) {
  try {
    const baseId = Number(req.params.id);
    const equipmentList = db.prepare('SELECT * FROM equipment_types ORDER BY category ASC, name ASC').all();

    const inventory = equipmentList.map(eq => {
      const stock = getAvailableStock(baseId, eq.id);
      return {
        equipment_type_id: eq.id,
        name: eq.name,
        category: eq.category,
        unit: eq.unit,
        unit_cost_estimate: eq.unit_cost_estimate,
        totalStock: stock.totalStock,
        activeAssignments: stock.activeAssignments,
        availableStock: stock.availableStock
      };
    });

    return res.json({ success: true, baseId, inventory });
  } catch (error) {
    console.error('Error fetching base inventory:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
