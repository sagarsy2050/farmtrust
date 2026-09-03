import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '@/api/client';
import FarmerDashboard from '@/components/farmer/FarmerDashboard';

export default function FarmerDashboardPage() {
  const { user: ctxUser } = useOutletContext();
  const [user, setUser] = useState(ctxUser);
  const [farms, setFarms] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (ctxUser) { setUser(ctxUser); setLoading(false); }
    else {
      api.auth.me().then(u => { setUser(u); setLoading(false); }).catch(() => setLoading(false));
    }
  }, [ctxUser]);

  const loadData = React.useCallback(async () => {
    if (!user?.id) return;
    setError(null);
    try {
      const [f, p, o] = await Promise.all([
        api.entities.Farm.filter({ farmer_id: user.id }, '-created_date'),
        api.entities.Product.filter({ farmer_id: user.id }, '-created_date'),
        api.entities.Order.filter({ farmer_id: user.id }, '-created_date'),
      ]);
      setFarms(f); setProducts(p); setOrders(o);
    } catch (e) {
      console.error(e);
      setError('Could not load your dashboard data.');
    }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  return <FarmerDashboard user={user} farms={farms} products={products} orders={orders} loading={loading} error={error} onRetry={loadData} />;
}
