import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as wishlistService from '../services/wishlistService';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState(null);

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlist(null);
      return;
    }
    try {
      const data = await wishlistService.getWishlist();
      setWishlist(data);
    } catch {
      setWishlist(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const productIds = new Set((wishlist?.products || []).map((p) => p._id));

  const value = {
    wishlist,
    productIds,
    isSaved: (productId) => productIds.has(productId),
    refreshWishlist,
    setWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
}
