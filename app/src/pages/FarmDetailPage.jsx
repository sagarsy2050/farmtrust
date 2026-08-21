import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import FarmDetail from './FarmDetail';

export default function FarmDetailPage() {
  const { id } = useParams();
  const [farm, setFarm] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const f = await base44.entities.Farm.get(id);
        setFarm(f);
        try { setReviews(await base44.entities.Review.filter({ farmer_id: f.farmer_id })); } catch {}
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return <FarmDetail farm={farm} reviews={reviews} loading={loading} />;
}
