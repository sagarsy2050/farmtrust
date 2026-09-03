import React, { useState } from 'react';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import ReviewStars from '@/components/ReviewStars';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

// Inline review submission form for a completed order. Calls onSubmitted(review)
// once the review is created so the parent can update its own list without a refetch.
export default function ReviewForm({ order, onSubmitted, onCancel }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ratings, setRatings] = useState({ product_quality_rating: 0, farmer_communication_rating: 0, delivery_rating: 0, overall_rating: 0 });
  const [comment, setComment] = useState('');
  const [wouldBuyAgain, setWouldBuyAgain] = useState(true);
  const [saving, setSaving] = useState(false);

  const setRating = (key, val) => setRatings(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ratings.overall_rating) {
      toast({ title: 'Overall rating required', description: 'Please rate your overall experience.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const review = await api.entities.Review.create({
        order_id: order.id,
        customer_id: user.id,
        customer_name: user.full_name,
        farmer_id: order.farmer_id,
        farmer_name: order.farmer_name,
        product_id: order.items?.[0]?.product_id,
        product_name: order.items?.[0]?.product_name,
        product_quality_rating: ratings.product_quality_rating || undefined,
        farmer_communication_rating: ratings.farmer_communication_rating || undefined,
        delivery_rating: ratings.delivery_rating || undefined,
        overall_rating: ratings.overall_rating,
        comment,
        would_buy_again: wouldBuyAgain,
      });
      toast({ title: 'Review submitted', description: 'Thanks for the feedback!' });
      onSubmitted?.(review);
    } catch (err) {
      toast({ title: 'Could not submit review', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-4 rounded-xl border border-border bg-muted/20 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <span className="text-xs font-medium text-muted-foreground">Overall rating *</span>
          <div className="mt-1"><ReviewStars interactive value={ratings.overall_rating} onChange={v => setRating('overall_rating', v)} label="Overall rating" /></div>
        </div>
        <div>
          <span className="text-xs font-medium text-muted-foreground">Product quality</span>
          <div className="mt-1"><ReviewStars interactive value={ratings.product_quality_rating} onChange={v => setRating('product_quality_rating', v)} label="Product quality rating" /></div>
        </div>
        <div>
          <span className="text-xs font-medium text-muted-foreground">Farmer communication</span>
          <div className="mt-1"><ReviewStars interactive value={ratings.farmer_communication_rating} onChange={v => setRating('farmer_communication_rating', v)} label="Farmer communication rating" /></div>
        </div>
        <div>
          <span className="text-xs font-medium text-muted-foreground">Delivery</span>
          <div className="mt-1"><ReviewStars interactive value={ratings.delivery_rating} onChange={v => setRating('delivery_rating', v)} label="Delivery rating" /></div>
        </div>
      </div>

      <div>
        <label htmlFor={`comment-${order.id}`} className="text-xs font-medium text-muted-foreground">Comment</label>
        <textarea
          id={`comment-${order.id}`}
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={3}
          placeholder="Share your experience with this order..."
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={wouldBuyAgain} onCheckedChange={setWouldBuyAgain} />
        <span className="text-muted-foreground">I would buy from this farmer again</span>
      </label>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Submitting...</> : 'Submit review'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
