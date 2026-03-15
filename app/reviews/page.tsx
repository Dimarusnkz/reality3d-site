import { getReviews } from '@/app/actions/reviews';
import { getSession } from '@/lib/session';
import ReviewsClient from './reviews-client';

export const dynamic = 'force-dynamic';

export default async function ReviewsPage() {
  const reviews = await getReviews();
  const session = await getSession();
  const user = session?.userId ? { name: (session as any).name || 'Пользователь' } : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <ReviewsClient initialReviews={reviews} user={user} />
    </div>
  );
}
