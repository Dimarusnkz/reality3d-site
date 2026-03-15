'use client';

import { useState } from 'react';
import { Star, Image as ImageIcon, X, Loader2, Send } from 'lucide-react';
import { uploadPublicFile } from '@/app/actions/upload-public';
import { createReview } from '@/app/actions/reviews';
import Link from 'next/link';

type Review = {
  id: number;
  rating: number;
  text: string;
  photos: string[];
  createdAt: Date;
  user: { name: string | null };
};

export default function ReviewsClient({ initialReviews, user }: { initialReviews: Review[], user: any }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form state
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // 1. Upload files
      const uploadedPhotoNames: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const result = await uploadPublicFile(formData);
        
        if (result.error) {
          throw new Error(result.error);
        }
        if (result.file) {
          uploadedPhotoNames.push(result.file.fileName);
        }
      }

      // 2. Create review
      const result = await createReview(rating, text, uploadedPhotoNames);
      
      if (result.error) {
        throw new Error(result.error);
      }

      setSubmitSuccess(true);
      setText('');
      setFiles([]);
      setRating(5);
      setTimeout(() => {
        setIsFormOpen(false);
        setSubmitSuccess(false);
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
           <h1 className="text-4xl font-bold text-white mb-2">Отзывы клиентов</h1>
           <p className="text-gray-400">Что говорят о нас наши заказчики</p>
        </div>
        
        {!isFormOpen && !submitSuccess && (
          user ? (
            <button 
              onClick={() => setIsFormOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(255,94,0,0.3)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Star className="w-5 h-5 fill-current" />
              Оставить отзыв
            </button>
          ) : (
            <Link href="/login" className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 border border-slate-700">
               Войти, чтобы оставить отзыв
            </Link>
          )
        )}
      </div>

      {/* Submission Form */}
      {isFormOpen && (
        <div className="mb-12 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm animate-in fade-in slide-in-from-top-4">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Новый отзыв</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                 <X className="w-6 h-6" />
              </button>
           </div>

           {submitSuccess ? (
             <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                   <Send className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-green-500 mb-2">Отзыв отправлен!</h3>
                <p className="text-gray-300">Ваш отзыв появится на сайте после проверки модератором.</p>
             </div>
           ) : (
             <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rating */}
                <div>
                   <label className="block text-sm font-medium text-gray-400 mb-2">Ваша оценка</label>
                   <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`transition-transform hover:scale-110 focus:outline-none ${star <= rating ? 'text-yellow-400' : 'text-slate-700'}`}
                        >
                           <Star className={`w-8 h-8 ${star <= rating ? 'fill-current' : ''}`} />
                        </button>
                      ))}
                   </div>
                </div>

                {/* Text */}
                <div>
                   <label className="block text-sm font-medium text-gray-400 mb-2">Текст отзыва</label>
                   <textarea
                     value={text}
                     onChange={(e) => setText(e.target.value)}
                     className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:outline-none focus:border-primary/50 min-h-[150px]"
                     placeholder="Расскажите о вашем опыте работы с нами..."
                     required
                   />
                </div>

                {/* Photos */}
                <div>
                   <label className="block text-sm font-medium text-gray-400 mb-2">Фотографии (опционально)</label>
                   <div className="flex flex-wrap gap-4">
                      {files.map((file, idx) => (
                        <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-700 group">
                           <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                           <button
                             type="button"
                             onClick={() => removeFile(idx)}
                             className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                           >
                             <X className="w-3 h-3" />
                           </button>
                        </div>
                      ))}
                      
                      <label className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-slate-800/50 transition-colors">
                         <ImageIcon className="w-6 h-6 text-gray-500 mb-1" />
                         <span className="text-xs text-gray-500">Добавить</span>
                         <input 
                           type="file" 
                           accept="image/*" 
                           multiple 
                           className="hidden" 
                           onChange={handleFileChange}
                         />
                      </label>
                   </div>
                </div>

                {error && (
                  <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    'Отправить отзыв'
                  )}
                </button>
             </form>
           )}
        </div>
      )}

      {/* Full Screen Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="w-8 h-8" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={`/api/public/${selectedPhoto}`} 
            alt="Full screen review" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

      {/* Reviews List */}
      <div className="grid gap-6">
         {reviews.length === 0 ? (
           <div className="text-center py-20 text-gray-500 bg-slate-900/30 rounded-2xl border border-slate-800/50">
              <Star className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-xl">Пока нет отзывов</p>
              <p className="text-sm">Будьте первым, кто оставит отзыв!</p>
           </div>
         ) : (
           reviews.map((review) => (
             <div key={review.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white font-bold">
                         {review.user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                         <h3 className="font-bold text-white">{review.user.name || 'Пользователь'}</h3>
                         <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                               <Star 
                                 key={star} 
                                 className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-slate-700'}`} 
                               />
                            ))}
                         </div>
                      </div>
                   </div>
                   <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                   </span>
                </div>
                
                <p className="text-gray-300 whitespace-pre-line mb-4 leading-relaxed">
                   {review.text}
                </p>

                {review.photos && review.photos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                     {review.photos.map((photo, idx) => (
                        <div 
                           key={idx} 
                           className="relative w-24 h-24 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 cursor-zoom-in"
                           onClick={() => setSelectedPhoto(photo)}
                        >
                           {/* eslint-disable-next-line @next/next/no-img-element */}
                           <img 
                             src={`/api/public/${photo}`} 
                             alt="Review attachment" 
                             className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" 
                             onError={(e) => {
                               // Fallback if image fails to load
                               (e.target as HTMLImageElement).src = '/placeholder-image.png'; // Optional: placeholder
                               (e.target as HTMLImageElement).style.display = 'none'; // Or hide it
                             }}
                           />
                        </div>
                     ))}
                  </div>
                )}
             </div>
           ))
         )}
      </div>
    </div>
  );
}
