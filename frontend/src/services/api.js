const BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Custom fetch wrapper with automatic JWT injection and error handling
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('vanguard_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    localStorage.removeItem('vanguard_token');
    localStorage.removeItem('vanguard_user');
    window.dispatchEvent(new Event('auth:unauthorized'));
  }

  const data = await response.json().catch(() => ({ success: false, message: 'Server error' }));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Authentication
  login: (username, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  }),
  getMe: () => request('/auth/me'),
  switchDemoUser: (role, base_id) => request('/auth/demo-switch', {
    method: 'POST',
    body: JSON.stringify({ role, base_id })
  }),
  getDemoCredentials: () => request('/auth/demo-credentials'),

  // Dashboard & Metrics
  getDashboardMetrics: (params = {}) => {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.baseId && params.baseId !== 'all') query.append('baseId', params.baseId);
    if (params.equipmentTypeId && params.equipmentTypeId !== 'all') query.append('equipmentTypeId', params.equipmentTypeId);
    return request(`/dashboard/metrics?${query.toString()}`);
  },
  getNetMovementDetails: (params = {}) => {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.baseId && params.baseId !== 'all') query.append('baseId', params.baseId);
    if (params.equipmentTypeId && params.equipmentTypeId !== 'all') query.append('equipmentTypeId', params.equipmentTypeId);
    return request(`/dashboard/net-movement-details?${query.toString()}`);
  },
  getCategoryDistribution: (baseId) => {
    const query = baseId && baseId !== 'all' ? `?baseId=${baseId}` : '';
    return request(`/dashboard/distribution${query}`);
  },
  getBasesOverview: () => request('/dashboard/bases-overview'),

  // Purchases
  getPurchases: (params = {}) => {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.equipmentTypeId && params.equipmentTypeId !== 'all') query.append('equipmentTypeId', params.equipmentTypeId);
    if (params.baseId && params.baseId !== 'all') query.append('baseId', params.baseId);
    if (params.search) query.append('search', params.search);
    return request(`/purchases?${query.toString()}`);
  },
  createPurchase: (data) => request('/purchases', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Transfers
  getTransfers: (params = {}) => {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.equipmentTypeId && params.equipmentTypeId !== 'all') query.append('equipmentTypeId', params.equipmentTypeId);
    if (params.baseId && params.baseId !== 'all') query.append('baseId', params.baseId);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    return request(`/transfers?${query.toString()}`);
  },
  createTransfer: (data) => request('/transfers', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateTransferStatus: (id, status) => request(`/transfers/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),

  // Assignments
  getAssignments: (params = {}) => {
    const query = new URLSearchParams();
    if (params.baseId && params.baseId !== 'all') query.append('baseId', params.baseId);
    if (params.equipmentTypeId && params.equipmentTypeId !== 'all') query.append('equipmentTypeId', params.equipmentTypeId);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    return request(`/assignments?${query.toString()}`);
  },
  createAssignment: (data) => request('/assignments', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  returnAssignment: (id, return_notes) => request(`/assignments/${id}/return`, {
    method: 'PATCH',
    body: JSON.stringify({ return_notes })
  }),

  // Expenditures
  getExpenditures: (params = {}) => {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.baseId && params.baseId !== 'all') query.append('baseId', params.baseId);
    if (params.equipmentTypeId && params.equipmentTypeId !== 'all') query.append('equipmentTypeId', params.equipmentTypeId);
    if (params.expenditureType && params.expenditureType !== 'all') query.append('expenditureType', params.expenditureType);
    if (params.search) query.append('search', params.search);
    return request(`/expenditures?${query.toString()}`);
  },
  createExpenditure: (data) => request('/expenditures', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Catalog & Bases
  getBases: () => request('/bases'),
  getEquipmentTypes: () => request('/bases/equipment'),
  getBaseInventory: (baseId) => request(`/bases/${baseId}/inventory`),

  // Audit Logs
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams();
    if (params.action && params.action !== 'all') query.append('action', params.action);
    if (params.entityType && params.entityType !== 'all') query.append('entityType', params.entityType);
    if (params.baseId && params.baseId !== 'all') query.append('baseId', params.baseId);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    return request(`/audit-logs?${query.toString()}`);
  }
};
