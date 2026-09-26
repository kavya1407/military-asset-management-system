import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

const FilterContext = createContext(null);

export function FilterProvider({ children }) {
  const { user, role } = useAuth();

  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [baseId, setBaseId] = useState('all');
  const [equipmentTypeId, setEquipmentTypeId] = useState('all');
  const [datePreset, setDatePreset] = useState('all');

  // Metadata catalogs
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  // Automatically enforce base scoping when user role changes
  useEffect(() => {
    if (user && role !== 'ADMIN' && user.base_id) {
      setBaseId(String(user.base_id));
    } else if (role === 'ADMIN' && baseId !== 'all' && !baseId) {
      setBaseId('all');
    }
  }, [user, role]);

  // Load bases and equipment catalog once authenticated
  useEffect(() => {
    if (user) {
      Promise.all([api.getBases(), api.getEquipmentTypes()])
        .then(([bRes, eqRes]) => {
          if (bRes.success) setBases(bRes.bases);
          if (eqRes.success) setEquipmentTypes(eqRes.equipment);
        })
        .catch(err => console.error('Failed to load filter catalogs:', err))
        .finally(() => setLoadingCatalogs(false));
    }
  }, [user]);

  // Apply date preset helper
  const applyPreset = (preset) => {
    setDatePreset(preset);
    const today = new Date();
    const formatDate = (d) => d.toISOString().split('T')[0];

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'last7') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setStartDate(formatDate(past));
      setEndDate(formatDate(today));
    } else if (preset === 'last30') {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      setStartDate(formatDate(past));
      setEndDate(formatDate(today));
    } else if (preset === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDate(startOfMonth));
      setEndDate(formatDate(today));
    }
  };

  const resetFilters = () => {
    applyPreset('all');
    setEquipmentTypeId('all');
    if (role === 'ADMIN') {
      setBaseId('all');
    } else if (user?.base_id) {
      setBaseId(String(user.base_id));
    }
  };

  return (
    <FilterContext.Provider value={{
      startDate,
      setStartDate,
      endDate,
      setEndDate,
      baseId,
      setBaseId,
      equipmentTypeId,
      setEquipmentTypeId,
      datePreset,
      applyPreset,
      resetFilters,
      bases,
      equipmentTypes,
      loadingCatalogs,
      isBaseLocked: role !== 'ADMIN'
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (!context) throw new Error('useFilter must be used within a FilterProvider');
  return context;
}
