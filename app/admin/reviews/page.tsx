import { getAllReviews } from '@/app/actions/reviews';
import ReviewsAdminClient from './reviews-admin-client';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const reviews = await getAllReviews();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Управление отзывами</h1>
        <p className="text-gray-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Customer Feedback & Moderation</p>
      </div>
      <ReviewsAdminClient initialReviews={reviews} />
    </div>
  );
}
