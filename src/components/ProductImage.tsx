'use client';

import { useState } from 'react';
import { type Product } from '@/types';

interface ProductImageProps {
  product: Product;
  className?: string;
}

const categoryColors: Record<string, string> = {
  fundas: '#d9b8b5',
  cargadores: '#e7c183',
  termos: '#c3bfba',
  personalizados: '#d9b8b5',
};

function SvgFallback({ product, className }: ProductImageProps) {
  const color = categoryColors[product.category] || '#d3c3c1';

  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-surface-container-high to-surface-container ${className || ''}`}>
      <svg viewBox="0 0 200 200" className="w-3/5 h-3/5" fill="none" xmlns="http://www.w3.org/2000/svg">
        {product.category === 'fundas' && (
          <>
            <rect x="50" y="30" width="100" height="140" rx="16" stroke={color} strokeWidth="2.5" fill={`${color}20`} />
            <rect x="65" y="45" width="70" height="80" rx="8" stroke={color} strokeWidth="1.5" fill={`${color}10`} />
            <circle cx="100" cy="145" r="10" stroke={color} strokeWidth="1.5" />
            <rect x="70" y="20" width="60" height="12" rx="4" stroke={color} strokeWidth="1.5" fill={`${color}15`} />
          </>
        )}
        {product.category === 'cargadores' && (
          <>
            <rect x="55" y="40" width="90" height="50" rx="8" stroke={color} strokeWidth="2.5" fill={`${color}20`} />
            <rect x="70" y="90" width="60" height="50" rx="4" stroke={color} strokeWidth="1.5" fill={`${color}10`} />
            <rect x="85" y="140" width="30" height="25" rx="3" stroke={color} strokeWidth="1.5" fill={`${color}15`} />
            <line x1="100" y1="60" x2="100" y2="78" stroke={color} strokeWidth="2" strokeDasharray="3 3" />
            <circle cx="100" cy="83" r="5" stroke={color} strokeWidth="1.5" fill={color} />
          </>
        )}
        {product.category === 'termos' && (
          <>
            <rect x="65" y="25" width="70" height="145" rx="35" stroke={color} strokeWidth="2.5" fill={`${color}20`} />
            <rect x="60" y="20" width="80" height="18" rx="9" stroke={color} strokeWidth="1.5" fill={`${color}15`} />
            <line x1="80" y1="65" x2="80" y2="120" stroke={color} strokeWidth="1.5" strokeDasharray="4 4" />
            <line x1="100" y1="65" x2="100" y2="120" stroke={color} strokeWidth="1.5" strokeDasharray="4 4" />
            <line x1="120" y1="65" x2="120" y2="120" stroke={color} strokeWidth="1.5" strokeDasharray="4 4" />
          </>
        )}
        {product.category === 'personalizados' && (
          <>
            <rect x="35" y="30" width="130" height="140" rx="12" stroke={color} strokeWidth="2" fill={`${color}20`} />
            <rect x="55" y="55" width="90" height="90" rx="8" stroke={color} strokeWidth="1.5" fill={`${color}10`} />
            <path d="M80 100 L95 85 L110 100 L125 90 L130 110 L70 110 Z" fill={`${color}30`} stroke={color} strokeWidth="1.5" />
            <circle cx="95" cy="75" r="8" fill={`${color}25`} stroke={color} strokeWidth="1" />
          </>
        )}
      </svg>
    </div>
  );
}

export default function ProductImage(props: ProductImageProps) {
  const { product } = props;
  const [showFallback, setShowFallback] = useState(!product.image);

  if (showFallback || !product.image) {
    return <SvgFallback {...props} />;
  }

  return (
    <div className={`relative overflow-hidden ${props.className || ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.image}
        alt={product.name}
        className="h-full w-full object-cover"
        onError={() => setShowFallback(true)}
        loading="lazy"
      />
    </div>
  );
}
