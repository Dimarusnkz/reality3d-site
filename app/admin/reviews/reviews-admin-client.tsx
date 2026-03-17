'use client';

import { useState } from 'react';
import { updateReviewStatus, deleteReview } from '@/app/actions/reviews';
import { Check, X, Trash2, Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

type Review = {
  id: number;
  rating: number;
  text: string;
  photos: string[];
  status: string;
  createdAt: Date;
  user: { name: string | null; email: string };
};

export default function ReviewsAdminClient({ initialReviews }: { initialReviews: Review[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const filteredReviews = reviews.filter(r => filter === 'all' || r.status === filter);

  const handleStatusUpdate = async (id: number, status: 'approved' | 'rejected') => {
    setLoadingId(id);
    try {
      const result = await updateReviewStatus(id, status, getCsrfToken());
      if (result.success) {
        setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) return;
    
    setLoadingId(id);
    try {
      const result = await deleteReview(id, getCsrfToken());
      if (result.success) {
        setReviews(prev => prev.filter(r => r.id !== id));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize",
              filter === f 
                ? "bg-primary text-white" 
                : "bg-slate-900 text-gray-400 hover:text-white hover:bg-slate-800"
            )}
          >
            {f === 'all' ? 'Все' : f === 'pending' ? 'На модерации' : f === 'approved' ? 'Одобренные' : 'Отклоненные'}
            <span className="ml-2 bg-black/20 px-2 py-0.5 rounded-full text-xs">
               {reviews.filter(r => f === 'all' || r.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
         <div className="overflow-x-auto">
           <table className="w-full text-sm text-left">
             <thead className="text-gray-400 bg-slate-900 border-b border-slate-800">
               <tr>
                 <th className="px-6 py-4 font-medium">Пользователь</th>
                 <th className="px-6 py-4 font-medium">Оценка</th>
                 <th className="px-6 py-4 font-medium w-1/3">Текст</th>
                 <th className="px-6 py-4 font-medium">Фото</th>
                 <th className="px-6 py-4 font-medium">Статус</th>
                 <th className="px-6 py-4 font-medium">Дата</th>
                 <th className="px-6 py-4 font-medium text-right">Действия</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-800">
               {filteredReviews.length === 0 ? (
                 <tr>
                   <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                     Отзывов не найдено
                   </td>
                 </tr>
               ) : (
                 filteredReviews.map((review) => (
                   <tr key={review.id} className="hover:bg-slate-900/30 transition-colors">
                     <td className="px-6 py-4">
                        <div className="font-bold text-white">{review.user.name || 'Без имени'}</div>
                        <div className="text-xs text-gray-500">{review.user.email}</div>
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex text-yellow-400">
                           {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                        </div>
                     </td>
                     <td className="px-6 py-4 text-gray-300">
                        <div className="line-clamp-2" title={review.text}>
                           {review.text}
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        {review.photos.length > 0 ? (
                           <div className="flex -space-x-2">
                              {review.photos.map((photo, i) => (
                                 <div key={i} className="relative w-8 h-8 rounded-full border border-slate-800 overflow-hidden bg-slate-950">
                                    <Image
                                      src={`/api/public/${photo}`}
                                      alt=""
                                      fill
                                      sizes="32px"
                                      className="object-cover"
                                    />
                                 </div>
                              ))}
                           </div>
                        ) : (
                           <span className="text-gray-600">-</span>
                        )}
                     </td>
                     <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-bold",
                          review.status === 'pending' && "bg-yellow-500/10 text-yellow-500",
                          review.status === 'approved' && "bg-green-500/10 text-green-500",
                          review.status === 'rejected' && "bg-red-500/10 text-red-500",
                        )}>
                           {review.status === 'pending' ? 'Ожидает' : review.status === 'approved' ? 'Одобрен' : 'Отклонен'}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                     </td>
                     <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                           {loadingId === review.id ? (
                             <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                           ) : (
                             <>
                               {review.status !== 'approved' && (
                                 <button 
                                   onClick={() => handleStatusUpdate(review.id, 'approved')}
                                   className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
                                   title="Одобрить"
                                 >
                                   <Check className="w-4 h-4" />
                                 </button>
                               )}
                               {review.status !== 'rejected' && (
                                 <button 
                                   onClick={() => handleStatusUpdate(review.id, 'rejected')}
                                   className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors"
                                   title="Отклонить"
                                 >
                                   <X className="w-4 h-4" />
                                 </button>
                               )}
                               <button 
                                 onClick={() => handleDelete(review.id)}
                                 className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                 title="Удалить"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </>
                           )}
                        </div>
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
}
