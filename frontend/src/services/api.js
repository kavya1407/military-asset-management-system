import { mockStore } from './mockStore';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

let isMockMode = false;

/**
 * Custom fetch wrapper with automatic JWT injection, error handling,
 * and seamless fallback to mockStore when backend is not deployed/unreachable.
 */
async function request(endpoint, options = {}, mockFallback) {
  if (isMockMode && mockFallback) {
    return await mockFallback();
  }

  try {
    const token = localStorage.getItem('vanguard_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html');

    // If endpoint doesn't exist on static host (404), or server error (502, 503), or returned HTML index fallback
    if (response.status === 404 || response.status === 502 || response.status === 503 || (response.status >= 400 && isHtml)) {
      if (mockFallback) {
        console.info(`[MAMS Vanguard] Backend offline or returned ${response.status}. Operating in local resilient store mode.`);
        isMockMode = true;
        return await mockFallback();
      }
    }

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
  } catch (err) {
    if (mockFallback) {
      console.info(`[MAMS Vanguard] Fetch failed (${err.message}). Seamlessly engaging mockStore fallback.`);
      isMockMode = true;
      return await mockFallback();
    }
    throw err;
  }
}

export const api = {
  // Authentication
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }, () => mockStore.login(username, password)),

  getMe: () =>
    request('/auth/me', {}, () => {
      const stored = localStorage.getItem('vanguard_user');
      return { success: true, user: stored ? JSON.parse(stored) : null };
    }),

  switchDemoUser: (role, base_id) =>
    request('/auth/demo-switch', {
      method: 'POST',
      body: JSON.stringify({ role, base_id })
    }, () => mockStore.switchDemoUser(role, base_id)),

  getDemoCredentials: () =>
    request('/auth/demo-credentials', {}, () => mockStore.getDemoCredentials()),

  // Dashboard & Metrics
  getDashboardMetrics: (params = {}) => {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.baseId && params.baseId !== 'all') query.append('baseId', params.baseId);
    if (params.equipmentTypeId && params.equipmentTypeId !== 'all') query.append('equipmentTypeId', params.equipmentTypeId);
    return request(`/dashboard/metrics?${query.toString()}`, {}, () => mockStore.getDashboardMetrics(params));
  },

  getNetMovementDetails: (params = {}) => {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.baseId && params.baseId !== 'all') query.append('baseId', params.baseId);
    if (params.equipmentTypeId && params.equipmentTypeId !== 'all') query.append('equipmentTypeId', params.equipmentTypeId);
    return request(`/dashboard/net-movement-details?${query.toString()}`, {}, () => mockStore.getNetMovementDetails(params));
  },

  getCategoryDistribution: (baseId) => {
    const query = baseId && baseId !== 'all' ? `?baseId=${baseId}` : '';
    return request(`/dashboard/distribution${query}`, {}, () => mockStore.getCategoryDistribution(baseId));
  },

  getBasesOverview: () =>
    request('/dashboard/bases-overview', {}, () => mockStore.getBasesOverview()),

  // Purchases
  getPurchases: (params = {}) => {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.equipmentTypeId && params.equipmentTypeId !== 'all') query.append('equipmentTypeId', params.equipmentTypeId);
    if (params.baseId && params.baseId !== 'all') query.append('baseId', params.baseId);
    if (params.search) query.append('search', params.search);
    return request(`/purchases?${query.toString()}`, {}, () => mockStore.getPurchases(params));
  },

  createPurchase: (data) =>
    request('/purchases', {
      method: 'POST',
      body: JSON.stringify(data)
    }, () => mockStore.createPurchase(data)),

  // Transfers
  getTransfers: (params = {}) => {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.equipmentTypeId && params.equipmentTypeId !== 'all') query.append('equipmentTypeId', params.equipmentTypeId);
    if (params.baseId && params.baseId !== 'all') query.append('baseId', params.baseId);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    return request(`/transfers?${query.toString()}`, {}, () => mockStore.getTransfers(params));
  },

  createTransfer: (data) =>
    request('/transfers', {
      method: 'POST',
      body: JSON.stringify(data)
    }, () => mockStore.createTransfer(data)),

  updateTransferStatus: (id, status) =>
    request(`/transfers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }, () => mockStore.updateTransferStatus(id, status)),

  // Assignments
  getAssignments: (params = {}) => {
    const query = new URLSearchParams();
    if (params.baseId && params.baseId !== 'all') query.append('baseId', params.baseId);
    if (params.equipmentTypeId && params.equipmentTypeId !== 'all') query.append('equipmentTypeId', params.equipmentTypeId);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    return request(`/assignments?${query.toString()}`, {}, () => mockStore.getAssignments(params));
  },

  createAssignment: (data) =>
    request('/assignments', {
      method: 'POST',
      body: JSON.stringify(data)
    }, () => mockStore.createAssignment(data)),

  returnAssignment: (id, return_notes) =>
    request(`/assignments/${id}/return`, {
      method: 'PATCH',
      body: JSON.stringify({ return_notes })
    }, () => mockStore.returnAssignment(id, return_notes)),

  // Expenditures
  getExpenditures: (params = {}) => {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.baseId && params.baseId !== 'all') query.append('baseId', params.baseId);
    if (params.equipmentTypeId && params.equipmentTypeId !== 'all') query.append('equipmentTypeId', params.equipmentTypeId);
    if (params.expenditureType && params.expenditureType !== 'all') query.append('expenditureType', params.expenditureType);
    if (params.search) query.append('search', params.search);
    return request(`/expenditures?${query.toString()}`, {}, () => mockStore.getExpenditures(params));
  },

  createExpenditure: (data) =>
    request('/expenditures', {
      method: 'POST',
      body: JSON.stringify(data)
    }, () => mockStore.createExpenditure(data)),

  // Catalog & Bases
  getBases: () =>
    request('/bases', {}, () => mockStore.getBases()),

  getEquipmentTypes: () =>
    request('/bases/equipment', {}, () => mockStore.getEquipmentTypes()),

  getBaseInventory: (baseId) =>
    request(`/bases/${baseId}/inventory`, {}, () => mockStore.getBaseInventory(baseId)),

  // Audit Logs
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams();
    if (params.action && params.action !== 'all') query.append('action', params.action);
    if (params.entityType && params.entityType !== 'all') query.append('entityType', params.entityType);
    if (params.baseId && params.baseId !== 'all') query.append('baseId', params.baseId);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    return request(`/audit-logs?${query.toString()}`, {}, () => mockStore.getAuditLogs(params));
  }
};
