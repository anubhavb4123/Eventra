import React, { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';

interface SuccessAnimationProps {
  message?: string;
  subtitle?: string;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  message = 'Success!',
  subtitle,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`flex flex-col items-center gap-4 transition-all duration-500 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
    >
      {/* Animated rings */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute rounded-full border-2 border-[#4ADE80]"
          style={{
            width: 100,
            height: 100,
            animation: 'ring-expand 0.6s ease-out forwards',
            opacity: 0,
          }}
        />
        <div
          className="absolute rounded-full border border-[#4ADE80]"
          style={{
            width: 80,
            height: 80,
            animation: 'ring-expand 0.6s 0.1s ease-out forwards',
            opacity: 0,
          }}
        />
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: 64,
            height: 64,
            background: 'rgba(74, 222, 128, 0.15)',
            border: '2px solid #4ADE80',
            boxShadow: '0 0 30px rgba(74, 222, 128, 0.4)',
          }}
        >
          <CheckCircle size={32} color="#4ADE80" strokeWidth={2} />
        </div>
      </div>

      <style>{`
        @keyframes ring-expand {
          from { transform: scale(0.5); opacity: 0.8; }
          to { transform: scale(1.2); opacity: 0; }
        }
      `}</style>

      <div className="text-center">
        <p
          className="text-xl font-bold text-[#4ADE80]"
          style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
        >
          {message}
        </p>
        {subtitle && (
          <p
            className="text-sm text-[#9A9A9A] mt-1"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
