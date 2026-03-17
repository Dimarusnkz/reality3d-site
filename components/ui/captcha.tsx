"use client";

import { useCallback, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CaptchaProps {
  onValidate: (isValid: boolean) => void;
  className?: string;
}

export interface CaptchaRef {
  reset: () => void;
}

const Captcha = forwardRef<CaptchaRef, CaptchaProps>(({ onValidate, className }, ref) => {
  const [captchaCode, setCaptchaCode] = useState<string>("");
  const [userInput, setUserInput] = useState("");
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  const generateCaptcha = useCallback(() => {
    // Generate a 5-character alphanumeric string
    // Exclude confusing characters like I, l, 1, O, 0
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(result);
    setUserInput("");
    setStatus('idle');
    onValidate(false);
  }, [onValidate]);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  useImperativeHandle(ref, () => ({
    reset: generateCaptcha
  }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase(); // Force uppercase for better UX
    
    // Allow only alphanumeric characters
    if (value && !/^[A-Z0-9]+$/.test(value)) return;
    
    setUserInput(value);
    
    if (value === "") {
      setStatus('idle');
      onValidate(false);
      return;
    }

    if (!captchaCode) return;

    // Check if input matches
    const isValid = value === captchaCode;
    
    // Only set valid status if full length is typed
    if (value.length === captchaCode.length) {
      setStatus(isValid ? 'valid' : 'invalid');
      onValidate(isValid);
    } else {
      setStatus('idle');
      onValidate(false);
    }
  };

  return (
    <div className={cn("p-4 rounded-xl border border-slate-800 bg-slate-900/50", className)}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Введите код с картинки</label>
        <button 
          type="button" 
          onClick={generateCaptcha}
          className="text-gray-500 hover:text-primary transition-colors"
          title="Обновить код"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Captcha Display */}
        <div 
          className="flex-1 bg-black/50 border border-slate-800 rounded-lg px-4 py-2 flex items-center justify-center select-none overflow-hidden relative min-h-[46px]"
          style={{ 
            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255, 255, 255, 0.03) 10px, rgba(255, 255, 255, 0.03) 20px)"
          }}
        >
          {captchaCode ? (
             <span className="font-mono text-2xl font-bold tracking-[0.3em] text-white" style={{ textShadow: "0 0 5px rgba(255,255,255,0.5)" }}>
               {captchaCode}
             </span>
          ) : (
             <span className="text-gray-500 text-sm">Загрузка...</span>
          )}
        </div>
        
        <div className="relative w-32">
          <input
            type="text"
            value={userInput}
            onChange={handleChange}
            className={cn(
              "w-full bg-slate-900 border rounded-lg px-3 py-2 text-center text-white font-bold focus:outline-none transition-all uppercase tracking-widest",
              status === 'valid' ? "border-green-500/50 focus:border-green-500" :
              status === 'invalid' ? "border-red-500/50 focus:border-red-500" :
              "border-slate-800 focus:border-primary/50"
            )}
            placeholder="CODE"
            maxLength={5}
            disabled={!captchaCode}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            {status === 'valid' && <CheckCircle className="h-4 w-4 text-green-500" />}
            {status === 'invalid' && <XCircle className="h-4 w-4 text-red-500" />}
          </div>
        </div>
      </div>
    </div>
  );
});

Captcha.displayName = "Captcha";

export default Captcha;
