import React, { useState } from 'react';
import { Gender } from '../types';

interface AvatarIllustrationProps {
  genero: Gender;
  fotoUrl?: string;
  nome: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AvatarIllustration: React.FC<AvatarIllustrationProps> = ({
  genero,
  fotoUrl,
  nome,
  size = 'md',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-9 h-9 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-xl',
  };

  if (fotoUrl && !imageError) {
    return (
      <div className={`relative shrink-0 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 ${sizeClasses[size]} ${className}`}>
        <img
          src={fotoUrl}
          alt={`Foto de ${nome}`}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Ilustração vetorial SVG de alta qualidade
  if (genero === 'F') {
    return (
      <div
        className={`relative shrink-0 rounded-full overflow-hidden border border-rose-200 dark:border-rose-900/50 bg-gradient-to-tr from-rose-100 via-pink-50 to-purple-100 dark:from-rose-950/60 dark:via-purple-950/40 dark:to-pink-900/40 flex items-center justify-center shadow-xs ${sizeClasses[size]} ${className}`}
        title={`Avatar Ilustrado - ${nome}`}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-0.5"
          aria-hidden="true"
        >
          {/* Cabelo de fundo */}
          <path
            d="M26 48C26 28 36 14 50 14C64 14 74 28 74 48C74 65 78 72 80 80C72 84 64 86 50 86C36 86 28 84 20 80C22 72 26 65 26 48Z"
            fill="#7C2D12"
          />
          {/* Corpo / Ombros */}
          <path
            d="M22 92C24 78 35 68 50 68C65 68 76 78 78 92C68 96 58 98 50 98C42 98 32 96 22 92Z"
            fill="#E11D48"
          />
          {/* Gola da blusa */}
          <path
            d="M42 68C44 74 47 78 50 78C53 78 56 74 58 68C60 68 40 68 42 68Z"
            fill="#FFE4E6"
          />
          {/* Pescoço */}
          <path d="M44 56H56V69H44V56Z" fill="#FBCFE8" />
          {/* Rosto */}
          <ellipse cx="50" cy="46" rx="18" ry="21" fill="#FDE2E4" />
          {/* Olhos e Sobrancelhas */}
          <ellipse cx="43" cy="45" rx="2.2" ry="2.2" fill="#374151" />
          <ellipse cx="57" cy="45" rx="2.2" ry="2.2" fill="#374151" />
          <path d="M40 40C42 39 45 40 46 41" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M54 41C55 40 58 39 60 40" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" />
          {/* Sorriso e Bochechas */}
          <path d="M46 54C48 56.5 52 56.5 54 54" stroke="#BE123C" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="39" cy="49" r="2.5" fill="#FDA4AF" opacity="0.6" />
          <circle cx="61" cy="49" r="2.5" fill="#FDA4AF" opacity="0.6" />
          {/* Cabelo frontal e franja estilosa */}
          <path
            d="M29 38C32 25 41 18 50 18C59 18 68 25 71 38C68 33 60 30 52 30C42 30 33 34 29 38Z"
            fill="#9A3412"
          />
          <path
            d="M29 38C30 46 32 54 34 60C31 54 28 47 29 38Z"
            fill="#7C2D12"
          />
          <path
            d="M71 38C70 46 68 54 66 60C69 54 72 47 71 38Z"
            fill="#7C2D12"
          />
        </svg>
      </div>
    );
  }

  // Masculino
  return (
    <div
      className={`relative shrink-0 rounded-full overflow-hidden border border-blue-200 dark:border-blue-900/50 bg-gradient-to-tr from-blue-100 via-sky-50 to-indigo-100 dark:from-blue-950/60 dark:via-indigo-950/40 dark:to-sky-900/40 flex items-center justify-center shadow-xs ${sizeClasses[size]} ${className}`}
      title={`Avatar Ilustrado - ${nome}`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full p-0.5"
        aria-hidden="true"
      >
        {/* Corpo / Ombros */}
        <path
          d="M20 92C23 76 34 66 50 66C66 66 77 76 80 92C70 96 60 98 50 98C40 98 30 96 20 92Z"
          fill="#1D4ED8"
        />
        {/* Gola da camisa */}
        <path
          d="M40 66L50 78L60 66L50 68L40 66Z"
          fill="#DBEAFE"
        />
        {/* Gravata sutil */}
        <path d="M48 76L52 76L51 88L49 88Z" fill="#1E3A8A" />
        {/* Pescoço */}
        <path d="M43 54H57V68H43V54Z" fill="#FCD34D" opacity="0.4" />
        {/* Rosto */}
        <path
          d="M32 40C32 28 40 22 50 22C60 22 68 28 68 40C68 54 60 62 50 62C40 62 32 54 32 40Z"
          fill="#FDE68A"
        />
        {/* Cabelo moderno masculino */}
        <path
          d="M30 36C30 22 40 14 50 14C60 14 70 20 70 30C66 26 58 24 50 24C40 24 33 28 30 36Z"
          fill="#1F2937"
        />
        {/* Orelhas */}
        <circle cx="31" cy="42" r="4" fill="#FCD34D" />
        <circle cx="69" cy="42" r="4" fill="#FCD34D" />
        {/* Olhos e Sobrancelhas */}
        <ellipse cx="42" cy="41" rx="2.2" ry="2.2" fill="#1F2937" />
        <ellipse cx="58" cy="41" rx="2.2" ry="2.2" fill="#1F2937" />
        <path d="M38 36C41 34 45 35 46 36" stroke="#374151" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M54 36C55 35 59 34 62 36" stroke="#374151" strokeWidth="1.8" strokeLinecap="round" />
        {/* Nariz e Sorriso */}
        <path d="M50 43V48H52" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M44 53C46 56 54 56 56 53" stroke="#92400E" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  );
};
