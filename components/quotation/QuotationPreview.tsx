'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { QuotationDocument } from './QuotationDocument';
import type { Quotation } from '@/types/quotation';
import { calculateTotal, formatAmountRaw } from '@/utils/formatting';

interface QuotationPreviewProps {
  quotation: Partial<Quotation>;
  documentRef?: React.Ref<HTMLDivElement>;
}

export function QuotationPreview({ quotation, documentRef }: QuotationPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const total = calculateTotal(quotation.lineItems ?? []);

  const updateScale = useCallback(() => {
    if (!containerRef.current) return;

    const available = containerRef.current.clientWidth - 32;
    const docWidth = 794;
    const newScale = Math.min(1, available / docWidth);
    setScale(newScale);
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale]);

  return (
    <div
      style={{
        background: '#B8B4AD',
        minHeight: 320,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#A8A49D',
        }}
      >
        <span
          style={{
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(0,0,0,0.4)',
            fontWeight: 500,
          }}
        >
          Live preview
        </span>
        <span
          style={{
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(0,0,0,0.4)',
            fontWeight: 500,
          }}
        >
          Total: {formatAmountRaw(total)}
        </span>
      </div>

      {/* Preview Scroll Area */}
      <div
        ref={containerRef}
        style={{
          overflow: 'hidden',
          overflowX: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <div
          ref={wrapperRef}
          style={{
            transformOrigin: 'top center',
            transform: `scale(${scale})`,
            width: 794,
            flexShrink: 0,
          }}
        >
          <QuotationDocument ref={documentRef} quotation={quotation} />
        </div>
      </div>
    </div>
  );
}
