import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'ebook_compare_ids';
const MAX_COMPARE = 4;

const CompareContext = createContext(null);

export function CompareProvider({ children }) {
  const [ids, setIds] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids]);

  const toggle = useCallback((productId) => {
    setIds((current) => {
      if (current.includes(productId)) {
        return current.filter((id) => id !== productId);
      }
      if (current.length >= MAX_COMPARE) return current;
      return [...current, productId];
    });
  }, []);

  const clear = useCallback(() => setIds([]), []);
  const remove = useCallback((productId) => setIds((current) => current.filter((id) => id !== productId)), []);

  const value = {
    ids,
    isSelected: (productId) => ids.includes(productId),
    toggle,
    remove,
    clear,
    maxReached: ids.length >= MAX_COMPARE,
    max: MAX_COMPARE,
  };

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within a CompareProvider');
  return ctx;
}
