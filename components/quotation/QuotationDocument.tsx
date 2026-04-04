'use client';

import React, { forwardRef } from 'react';
import type { Quotation } from '@/types/quotation';
import { DEFAULT_INCLUSIONS } from '@/types/quotation';
import {
  formatDate,
  formatAmount,
  formatAmountRaw,
  formatPax,
  calculateTotal,
} from '@/utils/formatting';
import '@/styles/quotation-document.css';

interface QuotationDocumentProps {
  quotation: Partial<Quotation>;
}

export const QuotationDocument = forwardRef<HTMLDivElement, QuotationDocumentProps>(
  function QuotationDocument({ quotation }, ref) {
    const total = calculateTotal(quotation.lineItems ?? []);
    const deposit = total / 2;
    const balance = total / 2;

    const customerContact = [quotation.customer?.email, quotation.customer?.phone]
      .filter(Boolean)
      .join('  ·  ');

    const tripPax = formatPax(
      quotation.trip?.adults ?? 2,
      quotation.trip?.children ?? 0
    );

    const tripDates = () => {
      const from = formatDate(quotation.trip?.departureDate);
      const to = formatDate(quotation.trip?.returnDate);
      const nights = quotation.trip?.nights ?? 7;

      let dateStr: string;
      if (from !== '—' && to !== '—') {
        dateStr = `${from} – ${to}`;
      } else if (from !== '—') {
        dateStr = from;
      } else {
        dateStr = '—';
      }

      return `${dateStr} · ${nights} nights · ${tripPax}`;
    };

    const lineItemsHtml = () => {
      const items = quotation.lineItems?.filter((li) => li.desc || li.amt) ?? [];

      if (items.length === 0) {
        return (
          <tr>
            <td colSpan={3} style={{ color: 'var(--muted)', textAlign: 'center', padding: '10px', fontSize: '9px' }}>
              No components added
            </td>
          </tr>
        );
      }

      return items.map((li, idx) => {
        const amt = typeof li.amt === 'number' ? li.amt : parseFloat(li.amt) || 0;
        return (
          <tr key={idx}>
            <td>{li.desc || '—'}</td>
            <td style={{ color: 'var(--muted)', fontSize: '9px' }}>{li.detail || ''}</td>
            <td>{formatAmount(amt)}</td>
          </tr>
        );
      });
    };

    const inclusionsHtml = () => {
      const checked = quotation.inclusions ?? [];
      return DEFAULT_INCLUSIONS.map((label, idx) => {
        const isIncluded = checked.includes(label);
        return (
          <div className="idc" key={idx}>
            <div className={`idd ${isIncluded ? 'idd-y' : 'idd-n'}`}>
              {isIncluded ? (
                <div className="tick" />
              ) : (
                <div className="xmark">×</div>
              )}
            </div>
            {label}
          </div>
        );
      });
    };

    const itineraryHtml = () => {
      const days = quotation.itinerary?.filter((d) => d.title || d.desc) ?? [];

      if (days.length === 0) {
        return (
          <tr>
            <td colSpan={2} style={{ color: 'var(--muted)', padding: '10px', fontSize: '9px' }}>
              No itinerary added yet
            </td>
          </tr>
        );
      }

      return days.map((day, idx) => (
        <tr key={idx}>
          <td style={{ width: '48px', paddingRight: 0 }}>
            <div className="dbadge">DAY {idx + 1}</div>
          </td>
          <td>
            <div className="it-t">{day.title || `Day ${idx + 1}`}</div>
            {day.desc && <div className="it-d">{day.desc}</div>}
          </td>
        </tr>
      ));
    };

    return (
      <div id="qdoc" ref={ref}>
        {/* Header */}
        <div className="dh">
          <div className="dh-brand">
            <img className="dh-logo-image" src="/logo.png" alt="Sri Maadan Yatra logo" />
            <div>
              <div className="dh-logo">Sri Maadan Yatra</div>
              <div className="dh-tag">Curated Travel Experiences</div>
            </div>
          </div>
          <div className="dh-r">
            <div className="dh-rlbl">Travel Quotation</div>
            <div className="dh-num">{quotation.number || '—'}</div>
            <div className="dh-date">Date: {formatDate(quotation.date)}</div>
            <div className="dh-valid">Valid until: {formatDate(quotation.validUntil)}</div>
          </div>
        </div>

        {/* Body */}
        <div className="db">
          {/* Meta Grid */}
          <div className="mg">
            <div className="mg-cell">
              <div className="mg-l">Prepared for</div>
              <div className="mg-v">{quotation.customer?.name || 'Customer Name'}</div>
              <div className="mg-s">{customerContact || '—'}</div>
            </div>
            <div className="mg-cell">
              <div className="mg-l">Destination</div>
              <div className="mg-v">{quotation.trip?.destination || 'Destination'}</div>
              <div className="mg-s">{tripDates()}</div>
            </div>
            <div className="mg-cell" style={{ paddingBottom: 0 }}>
              <div className="mg-l">Package type</div>
              <div className="mg-v">{quotation.trip?.packageType || '—'}</div>
            </div>
            <div className="mg-cell" style={{ paddingBottom: 0 }}>
              <div className="mg-l">Prepared by</div>
              <div className="mg-v">{quotation.consultant || '—'}</div>
              <div className="mg-s">Sri Maadan Yatra</div>
            </div>
          </div>

          {/* Pricing */}
          <span className="ds">Pricing breakdown</span>
          <table className="pt">
            <thead>
              <tr>
                <th>Component</th>
                <th>Details</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>{lineItemsHtml()}</tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>
                  <strong>Total quoted amount</strong>
                  <br />
                  <span style={{ fontSize: '8px', color: 'var(--muted)', fontWeight: 300 }}>
                    Inclusive of all taxes and charges
                  </span>
                </td>
                <td className="pt-tot">{formatAmountRaw(total)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Inclusions */}
          <span className="ds">What&apos;s included</span>
          <div className="inc-doc">{inclusionsHtml()}</div>
          <div style={{ marginBottom: '12px', fontSize: '9.5px' }}>
            <span style={{ color: 'var(--terra)', fontWeight: 500 }}>Not included: </span>
            <span style={{ color: 'var(--muted)' }}>{quotation.exclusions || '—'}</span>
          </div>

          {/* Itinerary */}
          <span className="ds">Day-by-day itinerary</span>
          <table className="it">{itineraryHtml()}</table>

          {/* Payment */}
          <span className="ds">Payment schedule</span>
          <div className="pg">
            <div className="pc prim">
              <div className="pc-l acc">Deposit due now (50%)</div>
              <div className="pc-a">{formatAmountRaw(deposit)}</div>
              <div className="pc-n">
                GPay to business UPI
                {quotation.payment?.nonRefundable
                  ? ` · ${formatAmountRaw(quotation.payment.nonRefundable)} is non-refundable`
                  : ''}
              </div>
            </div>
            <div className="pc">
              <div className="pc-l">Balance due by</div>
              <div className="pc-a">{formatAmountRaw(balance)}</div>
              <div className="pc-n">
                Due by {formatDate(quotation.payment?.balanceDueDate)} · 30 days before departure
              </div>
            </div>
          </div>

          {/* Validity Banner */}
          <div className="vb">
            <span className="vb-l">
              This quotation is held for you until {formatDate(quotation.validUntil)}. After this
              date, pricing may change.
            </span>
            <span className="vb-r">Questions? Call or WhatsApp us.</span>
          </div>

          {/* Notes */}
          {quotation.notes && <div className="nb">{quotation.notes}</div>}
        </div>

        {/* Footer */}
        <div className="df">
          <span>
            Sri Maadan Yatra &nbsp;·&nbsp; srimaadanyatra@gmail.com &nbsp;·&nbsp; +91 96007 77266
            &nbsp;·&nbsp; srimaadanyatra.com
          </span>
          <span style={{ color: 'var(--terra)' }}>TAAI Member</span>
        </div>
      </div>
    );
  }
);
