"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
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
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  const generateProblem = () => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    setNum1(n1);
    setNum2(n2);
    setUserInput("");
    setStatus('idle');
    onValidate(false);
  };

  useEffect(() => {
    generateProblem();
  }, []);

  useImperativeHandle(ref, () => ({
    reset: generateProblem
  }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers
    if (value && !/^\d+$/.test(value)) return;
    
    setUserInput(value);
    
    if (value === "") {
      setStatus('idle');
      onValidate(false);
      return;
    }

    const sum = num1 + num2;
    const isValid = parseInt(value) === sum;
    
    setStatus(isValid ? 'valid' : 'invalid');
    onValidate(isValid);
  };

  return (
    <div className={cn("p-4 rounded-xl border border-slate-800 bg-slate-900/50", className)}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Проверка на человечность</label>
        <button 
          type="button" 
          onClick={generateProblem}
          className="text-gray-500 hover:text-primary transition-colors"
          title="Обновить капчу"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-black/50 border border-slate-800 rounded-lg px-4 py-2 text-white font-mono text-lg text-center select-none">
          {num1} + {num2} = ?
        </div>
        
        <div className="relative w-24">
          <input
            type="text"
            value={userInput}
            onChange={handleChange}
            className={cn(
              "w-full bg-slate-900 border rounded-lg px-3 py-2 text-center text-white font-bold focus:outline-none transition-all",
              status === 'valid' ? "border-green-500/50 focus:border-green-500" :
              status === 'invalid' && userInput.length > 0 ? "border-red-500/50 focus:border-red-500" :
              "border-slate-800 focus:border-primary/50"
            )}
            placeholder="Sum"
            maxLength={2}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            {status === 'valid' && <CheckCircle className="h-4 w-4 text-green-500" />}
            {status === 'invalid' && userInput.length > 0 && <XCircle className="h-4 w-4 text-red-500" />}
          </div>
        </div>
      </div>
    </div>
  );
});

Captcha.displayName = "Captcha";

export default Captcha;
