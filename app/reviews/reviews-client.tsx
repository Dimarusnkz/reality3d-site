'use client';

import { useState } from 'react';
import { Star, Image as ImageIcon, X, Loader2, Send, Quote, Calendar, User, Filter } from 'lucide-react';
import { uploadPublicFile } from '@/app/actions/upload-public';
import { createReview } from '@/app/actions/reviews';
import Link from 'next/link';
import { cn } from '@/lib/utils';

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return '';
  return parts.pop()?.split(';').shift() || '';
}

type Review = {
  id: number;
  rating: number;
  text: string;
  photos: string[];
  createdAt: Date;
  user: { name: string | null };
};

export default function ReviewsClient({ initialReviews, user }: { initialReviews: Review[], user: any }) {
  const [reviews] = useState(initialReviews);
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
      const csrfToken = getCsrfToken();

      // 1. Upload files
      const uploadedPhotoNames: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('csrf_token', csrfToken);
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
      const result = await createReview(rating, text, uploadedPhotoNames, csrfToken);
      
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
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
        <div>
           <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight uppercase">Отзывы клиентов</h1>
           <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">What our clients say about Reality3D</p>
        </div>
        
        {!isFormOpen && !submitSuccess && (
          user ? (
            <button 
              onClick={() => setIsFormOpen(true)}
              className="bg-primary text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3"
            >
              <Star className="w-4 h-4 fill-current" />
              Оставить отзыв
            </button>
          ) : (
            <Link href="/login" className="bg-slate-900 border border-slate-800 text-gray-400 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:text-white hover:border-slate-700 transition-all flex items-center gap-3">
               Войти, чтобы оставить отзыв
            </Link>
          )
        )}
      </div>

      {/* Submission Form */}
      {isFormOpen && (
        <div className="mb-20 neon-card border border-slate-800 bg-slate-900/40 rounded-[2.5rem] p-10 backdrop-blur-md animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
              <Quote className="w-32 h-32 text-primary" />
           </div>
           
           <div className="flex justify-between items-center mb-10 relative z-10">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Новый отзыв</h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Share your experience</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-gray-500 hover:text-white transition-all">
                 <X className="w-5 h-5" />
              </button>
           </div>

           {submitSuccess ? (
             <div className="bg-primary/5 border border-primary/20 rounded-3xl p-12 text-center relative z-10">
                <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-inner">
                   <Send className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-black text-primary mb-3 uppercase tracking-tight">Отзыв отправлен!</h3>
                <p className="text-gray-500 font-medium max-w-md mx-auto">Ваш отзыв появится на сайте сразу после проверки модератором. Спасибо за доверие!</p>
             </div>
           ) : (
             <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    {/* Rating */}
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Ваша оценка</label>
                       <div className="flex gap-3 bg-slate-950/50 p-4 rounded-2xl border border-slate-800 w-fit">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className={cn(
                                "transition-all duration-300 hover:scale-125 focus:outline-none",
                                star <= rating ? 'text-primary' : 'text-slate-800'
                              )}
                            >
                               <Star className={cn("w-8 h-8", star <= rating ? 'fill-current drop-shadow-[0_0_8px_rgba(255,94,0,0.5)]' : '')} />
                            </button>
                          ))}
                       </div>
                    </div>

                    {/* Photos */}
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Фотографии</label>
                       <div className="flex flex-wrap gap-4">
                          {files.map((file, idx) => (
                            <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-800 group shadow-inner">
                               <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                               <button
                                 type="button"
                                 onClick={() => removeFile(idx)}
                                 className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                               >
                                 <X className="w-5 h-5" />
                               </button>
                            </div>
                          ))}
                          
                          <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group">
                             <ImageIcon className="w-6 h-6 text-gray-600 mb-1 group-hover:text-primary transition-colors" />
                             <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest group-hover:text-primary transition-colors">Добавить</span>
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
                  </div>

                  {/* Text */}
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Текст отзыва</label>
                     <textarea
                       value={text}
                       onChange={(e) => setText(e.target.value)}
                       className="w-full bg-slate-950 border border-slate-800 rounded-3xl p-6 text-white text-sm focus:outline-none focus:border-primary/50 min-h-[220px] transition-all placeholder:text-gray-700 resize-none shadow-inner"
                       placeholder="Расскажите о вашем опыте работы с нами..."
                       required
                     />
                  </div>
                </div>

                {error && (
                  <div className="text-red-400 text-[10px] font-black uppercase tracking-widest bg-red-500/5 p-4 rounded-2xl border border-red-500/20 text-center">
                    {error}
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full md:w-auto bg-primary text-white px-12 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Отправка...
                      </>
                    ) : (
                      <>
                        Отправить отзыв
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
             </form>
           )}
        </div>
      )}

      {/* Full Screen Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-8 animate-in fade-in duration-300"
          onClick={() => setSelectedPhoto(null)}
        >
          <button 
            className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-white/50 hover:text-white transition-all"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={`/api/public/${selectedPhoto}`} 
            alt="Full screen review" 
            className="max-w-full max-h-full object-contain rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

      {/* Reviews List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {reviews.length === 0 ? (
           <div className="md:col-span-2 text-center py-32 bg-slate-900/20 rounded-[3rem] border border-dashed border-slate-800">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-800 shadow-inner">
                <Star className="h-8 w-8 text-gray-700" />
              </div>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs italic">Отзывов пока нет. Будьте первым!</p>
           </div>
         ) : (
           reviews.map((review) => (
             <div key={review.id} className="group neon-card border border-slate-800 bg-slate-900/40 p-10 rounded-[2.5rem] flex flex-col hover:border-white/10 transition-all duration-500">
                <div className="flex justify-between items-start mb-8">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-primary shadow-inner">
                         <User className="w-6 h-6" />
                      </div>
                      <div>
                         <h3 className="text-lg font-black text-white tracking-tight uppercase">{review.user.name || 'Анонимный клиент'}</h3>
                         <div className="flex items-center gap-2 mt-1">
                            <div className="flex gap-0.5">
                               {[...Array(5)].map((_, i) => (
                                 <Star 
                                   key={i} 
                                   className={cn(
                                     "w-3 h-3", 
                                     i < review.rating ? "text-primary fill-current" : "text-slate-800"
                                   )} 
                                 />
                               ))}
                            </div>
                            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-2 flex items-center gap-1.5">
                               <Calendar className="w-3 h-3" />
                               {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                            </span>
                         </div>
                      </div>
                   </div>
                   <Quote className="w-8 h-8 text-slate-800 group-hover:text-primary/20 transition-colors" />
                </div>

                <p className="text-gray-400 text-sm leading-relaxed mb-8 italic flex-1">
                   «{review.text}»
                </p>

                {review.photos && review.photos.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-auto pt-6 border-t border-slate-800/30">
                     {review.photos.map((photo, idx) => (
                       <div 
                         key={idx} 
                         className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-800 cursor-pointer hover:border-primary/50 transition-all group/photo"
                         onClick={() => setSelectedPhoto(photo)}
                       >
                          <img 
                            src={`/api/public/${photo}`} 
                            alt={`Review photo ${idx + 1}`} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/photo:scale-110" 
                          />
                          <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                             <ImageIcon className="w-5 h-5 text-white" />
                          </div>
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
