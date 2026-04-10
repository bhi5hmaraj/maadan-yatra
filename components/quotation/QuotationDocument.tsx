'use client';

import React, { forwardRef } from 'react';
import type { Quotation } from '@/types/quotation';
import {
  calculateTotal,
  formatAmount,
  formatAmountRaw,
  formatDate,
  formatPax,
  getLineItemAmount,
  getLineItemQuantity,
  getLineItemTotal,
  normalizeStringList,
} from '@/utils/formatting';
import '@/styles/quotation-document.css';

interface QuotationDocumentProps {
  quotation: Partial<Quotation>;
}

export const QuotationDocument = forwardRef<HTMLDivElement, QuotationDocumentProps>(
  function QuotationDocument({ quotation }, ref) {
    const fontScale = quotation.documentFontScale ?? 1;
    const total = calculateTotal(quotation.lineItems ?? []);
    const inclusions = normalizeStringList(quotation.inclusions);
    const exclusions = normalizeStringList(quotation.exclusions);
    const notes = normalizeStringList(quotation.notes);
    const terms = normalizeStringList(quotation.terms);
    const batchDates = normalizeStringList(quotation.trip?.batchDates);
    const hotels = (quotation.hotels ?? []).filter(
      (hotel) => hotel.name || hotel.location || hotel.roomType || hotel.nights
    );

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

      let dateStr = '—';
      if (from !== '—' && to !== '—') {
        dateStr = `${from} – ${to}`;
      } else if (from !== '—') {
        dateStr = from;
      }

      return `${dateStr} · ${nights} nights · ${tripPax}`;
    };

    const includedPricingItems = (quotation.lineItems ?? []).filter(
      (item) => (item.desc || item.amt) && (item.mode !== 'or' || item.selected !== false)
    );

    const alternativePricingGroups = (quotation.lineItems ?? []).reduce<
      Array<{ group: string; items: NonNullable<typeof quotation.lineItems>[number][] }>
    >((groups, item) => {
      if (item.mode !== 'or' || (!item.desc && !item.amt)) {
        return groups;
      }

      const groupName = item.orGroup?.trim() || 'Alternative option';
      const existingGroup = groups.find((group) => group.group === groupName);

      if (existingGroup) {
        existingGroup.items.push(item);
        return groups;
      }

      groups.push({ group: groupName, items: [item] });
      return groups;
    }, []);

    const topMeta = [
      { label: 'Quote reference', value: quotation.number || '—' },
      { label: 'Prepared on', value: formatDate(quotation.date) },
      { label: 'Held until', value: formatDate(quotation.validUntil) },
    ];

    const keyDates = [
      { label: 'Departure', value: formatDate(quotation.trip?.departureDate) },
      { label: 'Return', value: formatDate(quotation.trip?.returnDate) },
      { label: 'Balance due', value: formatDate(quotation.payment?.balanceDueDate) },
      { label: 'Duration & pax', value: `${quotation.trip?.nights ?? 7} nights · ${tripPax}` },
    ];

    const summaryItems = [
      {
        label: 'Prepared for',
        value: quotation.customer?.name || 'Customer name',
        meta: customerContact || 'Contact details pending',
      },
      {
        label: 'Package',
        value: quotation.trip?.packageType || 'Custom package',
        meta: quotation.trip?.destination || 'Destination pending',
      },
      {
        label: 'Quoted amount',
        value: formatAmountRaw(total),
        meta: 'Mandatory items plus selected alternatives',
      },
      ...(quotation.consultant
        ? [
            {
              label: 'Prepared by',
              value: quotation.consultant,
              meta: 'Sri Maadan Yatra',
            },
          ]
        : []),
    ];

    const renderHeader = () => (
      <div className="dh">
        <div className="dh-contact">
          <span>srimaadanyatra@gmail.com</span>
          <span>+91 96007 77266</span>
          <span>srimaadanyatra.com</span>
        </div>
        <div className="dh-main">
          <div className="dh-brand">
            <img className="dh-logo-image" src="/logo.png" alt="Sri Maadan Yatra logo" />
            <div>
              <div className="dh-logo">Sri Maadan Yatra</div>
              <div className="dh-tag">Curated Travel Experiences</div>
            </div>
          </div>
          <div className="dh-r">
            <div className="dh-rlbl">Travel quotation</div>
            <div className="dh-num">{quotation.number || '—'}</div>
            <div className="dh-date">Prepared on {formatDate(quotation.date)}</div>
          </div>
        </div>
      </div>
    );

    const renderFooter = () => (
      <div className="df">
        <span>Sri Maadan Yatra · TAAI Member · Tailored itineraries and guided planning</span>
        <span style={{ color: 'var(--terra)' }}>Generated proposal</span>
      </div>
    );

    const renderBulletList = (items: string[], emptyLabel: string, className = 'ie-list') => {
      if (items.length === 0) {
        return <div className="ie-empty">{emptyLabel}</div>;
      }

      return (
        <ul className={className}>
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      );
    };

    const itineraryCards = () => {
      const days = quotation.itinerary?.filter((day) => day.title || day.desc) ?? [];

      if (days.length === 0) {
        return <div className="ie-empty">No itinerary added yet</div>;
      }

      return days.map((day, index) => (
        <div className="itinerary-card" key={`${day.title || 'day'}-${index}`}>
          <div className="itinerary-card__badge">
            <div className="dbadge">DAY {index + 1}</div>
          </div>
          <div className="itinerary-card__content">
            <div className="it-t">{day.title || `Day ${index + 1}`}</div>
            {day.desc ? <div className="it-d">{day.desc}</div> : null}
          </div>
        </div>
      ));
    };

    return (
      <div
        id="qdoc"
        ref={ref}
        style={{ ['--font-scale' as string]: String(fontScale) } as React.CSSProperties}
      >
        <section className="qpage">
          {renderHeader()}
          <div className="db">
            <div className="hero">
              <div className="hero-eyebrow">Travel quotation summary</div>
              <div className="hero-title">
                {quotation.trip?.destination || quotation.trip?.packageType || 'Custom travel proposal'}
              </div>
              <div className="hero-sub">{tripDates()}</div>
            </div>

            <div className="top-meta">
              {topMeta.map((item) => (
                <div className="top-meta__item" key={item.label}>
                  <div className="top-meta__label">{item.label}</div>
                  <div className="top-meta__value">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="mg mg--summary">
              {summaryItems.map((item) => (
                <div className="mg-cell" key={item.label}>
                  <div className="mg-l">{item.label}</div>
                  <div className="mg-v">{item.value}</div>
                  <div className="mg-s">{item.meta}</div>
                </div>
              ))}
            </div>

            <span className="ds">Important dates</span>
            <div className="dates-grid">
              {keyDates.map((item) => (
                <div className="date-card" key={item.label}>
                  <div className="date-card__label">{item.label}</div>
                  <div className="date-card__value">{item.value}</div>
                </div>
              ))}
            </div>

            {batchDates.length > 0 ? (
              <>
                <span className="ds">Batch departure options</span>
                <div className="batch-grid">
                  {batchDates.map((date, index) => (
                    <div className="batch-card" key={`${date}-${index}`}>
                      <div className="batch-card__label">Batch {index + 1}</div>
                      <div className="batch-card__value">{formatDate(date)}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            <div className="vb">
              <span className="vb-l">
                This quotation is held for you until {formatDate(quotation.validUntil)}. Availability and pricing may move after that date.
              </span>
              <span className="vb-r">Review the summary first, then the detailed pages that follow.</span>
            </div>
          </div>
          {renderFooter()}
        </section>

        <section className="qpage">
          {renderHeader()}
          <div className="db">
            <span className="ds">Pricing breakdown</span>
            <table className="pt">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Details</th>
                  <th>Qty</th>
                  <th>Rate (₹)</th>
                  <th>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {includedPricingItems.length > 0 ? (
                  includedPricingItems.map((item, index) => (
                    <tr key={`${item.desc || 'line-item'}-${index}`}>
                      <td>{item.desc || '—'}</td>
                      <td style={{ color: 'var(--muted)' }}>{item.detail || ''}</td>
                      <td>{getLineItemQuantity(item)}</td>
                      <td>{formatAmount(getLineItemAmount(item))}</td>
                      <td>{formatAmount(getLineItemTotal(item))}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ color: 'var(--muted)', textAlign: 'center', padding: '12px' }}>
                      No priced components added
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4}>
                    <strong>Total quoted amount</strong>
                    <br />
                    <span className="pt-note">Inclusive of mandatory items and selected alternatives only</span>
                  </td>
                  <td className="pt-tot">{formatAmountRaw(total)}</td>
                </tr>
              </tfoot>
            </table>

            {alternativePricingGroups.length > 0 ? (
              <>
                <span className="ds">Alternative options</span>
                <div className="alt-grid">
                  {alternativePricingGroups.map((group) => (
                    <div className="alt-card" key={group.group}>
                      <div className="alt-title">Choose one: {group.group}</div>
                      <div className="alt-list">
                        {group.items.map((item, index) => (
                          <div
                            className={`alt-item ${item.selected !== false ? 'is-selected' : ''}`}
                            key={`${group.group}-${item.desc || 'option'}-${index}`}
                          >
                            <div className="alt-item-head">
                              <span>{item.desc || 'Option'}</span>
                              <span>{formatAmountRaw(getLineItemTotal(item))}</span>
                            </div>
                            <div className="alt-item-meta">
                              Qty {getLineItemQuantity(item)} × {formatAmountRaw(getLineItemAmount(item))}
                              {item.selected !== false ? ' · currently included in the quote total' : ''}
                            </div>
                            {item.detail ? <div className="alt-item-meta">{item.detail}</div> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            <span className="ds">Hotels & accommodation</span>
            {hotels.length > 0 ? (
              <div className="hotel-grid">
                {hotels.map((hotel, index) => (
                  <div className="hotel-card" key={`${hotel.name || 'hotel'}-${index}`}>
                    <div className="hotel-card__title">{hotel.name || 'Hotel option'}</div>
                    <div className="hotel-card__meta">
                      {[hotel.location, hotel.roomType].filter(Boolean).join(' · ') || 'Details pending'}
                    </div>
                    <div className="hotel-card__nights">
                      {typeof hotel.nights === 'number' && hotel.nights > 0 ? `${hotel.nights} nights` : 'Night split pending'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ie-empty">No hotel details added</div>
            )}
          </div>
          {renderFooter()}
        </section>

        <section className="qpage">
          {renderHeader()}
          <div className="db">
            <span className="ds">Day-by-day itinerary</span>
            <div className="itinerary-list">{itineraryCards()}</div>
          </div>
          {renderFooter()}
        </section>

        <section className="qpage">
          {renderHeader()}
          <div className="db">
            <span className="ds">What is covered</span>
            <div className="ie-grid">
              <div className="ie-card ie-card--inclusions">
                <div className="ie-title ie-title--inclusions">Inclusions</div>
                {renderBulletList(inclusions, 'No inclusions added')}
              </div>
              <div className="ie-card ie-card--exclusions">
                <div className="ie-title ie-title--exclusions">Exclusions</div>
                {renderBulletList(exclusions, 'No exclusions added')}
              </div>
            </div>

            <span className="ds">Important notes</span>
            <div className="notes-card">
              {renderBulletList(notes, 'No important notes added', 'notes-list')}
            </div>

            <span className="ds">Terms & conditions</span>
            {terms.length > 0 ? (
              <div className="terms-block">
                <ol className="terms-list">
                  {terms.map((term, index) => (
                    <li className="term-item" key={`${term}-${index}`}>
                      <span className="term-item__text">{term}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <div className="ie-empty">No terms added</div>
            )}
          </div>
          {renderFooter()}
        </section>

      </div>
    );
  }
);
