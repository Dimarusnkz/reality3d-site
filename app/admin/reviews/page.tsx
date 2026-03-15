import { getAllReviews } from '@/app/actions/reviews';
import ReviewsAdminClient from './reviews-admin-client';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const reviews = await getAllReviews();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Управление отзывами</h1>
      <ReviewsAdminClient initialReviews={reviews} />
    </div>
  );
}
