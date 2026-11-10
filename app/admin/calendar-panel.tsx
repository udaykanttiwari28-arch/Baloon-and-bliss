'use client';

import { useEffect, useState } from 'react';
import { getBrowserSupabase } from '../../src/supabase/browser';

interface CalEnquiry {
  id: string;
  reference: string;
  name: string;
  event_date: string;
  start_time: string;
  end_time: string;
  package_slug: string;
  status: string;
  amount_total_minor: number;
  deposit_paid_minor: number;
}

const STATUS_COLOURS: Record<string, { bg: string; text: string; dot: string }> = {
  New:       { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
  Contacted: { bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6' },
  Confirmed: { bg: '#dcfce7', text: '#166534', dot: '#22c55e' },
  Cancelled: { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8' },
};

const PACKAGE_SHORT: Record<string, string> = {
  'classic-setup': 'Classic',
  'signature-setup': 'Signature',
  'premium-setup': 'Premium',
  'custom-setup': 'Custom',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(value: string) {
  const [hour, minute] = value.slice(0, 5).split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function fmtSGD(minor: number) {
  return `SGD ${(minor / 100).toFixed(2)}`;
}

function BalanceChip({ total, paid }: { total: number; paid: number }) {
  if (total === 0) return null;
  const balance = total - paid;
  if (balance <= 0) return <span style={{ padding: '3px 8px', borderRadius: 999, background: '#dcfce7', color: '#166534', fontSize: '.7rem', fontWeight: 700 }}>Paid</span>;
  if (paid === 0) return <span style={{ padding: '3px 8px', borderRadius: 999, background: '#fef2f2', color: '#991b1b', fontSize: '.7rem', fontWeight: 700 }}>Unpaid</span>;
  return <span style={{ padding: '3px 8px', borderRadius: 999, background: '#fef3c7', color: '#92400e', fontSize: '.7rem', fontWeight: 700 }}>Partial</span>;
}

export default function CalendarPanel() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [enquiries, setEnquiries] = useState<CalEnquiry[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const supabase = getBrowserSupabase();
    const firstDay = isoDate(currentMonth);
    const lastDay = isoDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0));
    supabase
      .from('booking_enquiries')
      .select('id,reference,name,event_date,start_time,end_time,package_slug,status,amount_total_minor,deposit_paid_minor')
      .gte('event_date', firstDay)
      .lte('event_date', lastDay)
      .order('event_date')
      .order('start_time')
      .then(({ data }) => {
        setEnquiries((data ?? []) as CalEnquiry[]);
        setLoading(false);
      });
  }, [currentMonth]);

  function prevMonth() { setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)); setSelectedDay(null); }
  function nextMonth() { setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)); setSelectedDay(null); }
  function goToday() { setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDay(isoDate(today)); }

  // Build grid: pad start of month with empty cells
  const firstWeekday = currentMonth.getDay();
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const enquiriesByDay = enquiries.reduce<Record<string, CalEnquiry[]>>((acc, e) => {
    if (!acc[e.event_date]) acc[e.event_date] = [];
    acc[e.event_date].push(e);
    return acc;
  }, {});

  const todayISO = isoDate(today);

  const selectedEnquiries = selectedDay ? (enquiriesByDay[selectedDay] ?? []) : [];

  return (
    <section style={{ background: '#fff', border: '1px solid #f0dce7', borderRadius: 18, overflow: 'hidden', marginBottom: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '18px 22px', borderBottom: '1px solid #f0dce7', background: 'linear-gradient(135deg,#fff,#fff8fb)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={prevMonth}
            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#765d68', padding: '4px 8px', borderRadius: 8 }}
            aria-label="Previous month"
          >‹</button>
          <h2 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: '1.35rem', minWidth: 200, textAlign: 'center' }}>
            {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <button
            type="button"
            onClick={nextMonth}
            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#765d68', padding: '4px 8px', borderRadius: 8 }}
            aria-label="Next month"
          >›</button>
        </div>
        <button className="text-button" type="button" onClick={goToday} style={{ fontSize: '.86rem' }}>Today</button>
      </div>

      {loading && <p style={{ padding: '24px 22px', color: '#765d68', margin: 0 }}>Loading…</p>}

      {!loading && (
        <>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #f0dce7' }}>
            {DAY_NAMES.map((d) => (
              <div key={d} style={{ padding: '8px 0', textAlign: 'center', color: '#765d68', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} style={{ minHeight: 80, borderRight: idx % 7 !== 6 ? '1px solid #f9f0f4' : 'none', borderBottom: '1px solid #f9f0f4', background: '#faf7f8' }} />;
              }
              const dateISO = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEnquiries = enquiriesByDay[dateISO] ?? [];
              const isToday = dateISO === todayISO;
              const isSelected = dateISO === selectedDay;

              return (
                <div
                  key={dateISO}
                  onClick={() => setSelectedDay(isSelected ? null : dateISO)}
                  style={{
                    minHeight: 80,
                    padding: '8px 8px 6px',
                    borderRight: idx % 7 !== 6 ? '1px solid #f9f0f4' : 'none',
                    borderBottom: '1px solid #f9f0f4',
                    cursor: 'pointer',
                    background: isSelected ? '#fff1f7' : '#fff',
                    outline: isSelected ? '2px solid #db2777' : isToday ? '2px solid #f59e0b' : 'none',
                    outlineOffset: -2,
                    transition: 'background .1s',
                    position: 'relative',
                  }}
                >
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: isToday ? '#fef3c7' : 'transparent',
                    color: isToday ? '#92400e' : '#24151c',
                    fontSize: '.82rem',
                    fontWeight: isToday ? 700 : 400,
                    marginBottom: 4,
                  }}>{day}</span>

                  {/* Enquiry dots */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {dayEnquiries.slice(0, 3).map((e) => {
                      const col = STATUS_COLOURS[e.status] ?? STATUS_COLOURS.New;
                      return (
                        <span
                          key={e.id}
                          title={`${e.name} · ${e.status}`}
                          style={{ display: 'block', width: 8, height: 8, borderRadius: '50%', background: col.dot }}
                        />
                      );
                    })}
                    {dayEnquiries.length > 3 && (
                      <span style={{ fontSize: '.62rem', color: '#765d68', lineHeight: '8px' }}>+{dayEnquiries.length - 3}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected day panel */}
          {selectedDay && (
            <div style={{ borderTop: '1px solid #f0dce7', padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: '1.1rem' }}>
                  {new Intl.DateTimeFormat('en-SG', { dateStyle: 'full' }).format(new Date(`${selectedDay}T00:00:00`))}
                </h3>
                <button className="text-button" type="button" onClick={() => setSelectedDay(null)} style={{ fontSize: '.82rem' }}>Close</button>
              </div>

              {selectedEnquiries.length === 0 ? (
                <p style={{ margin: 0, color: '#765d68', fontSize: '.9rem' }}>No bookings on this day.</p>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {selectedEnquiries.map((e) => {
                    const col = STATUS_COLOURS[e.status] ?? STATUS_COLOURS.New;
                    return (
                      <div
                        key={e.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 12, border: '1px solid #f0dce7', background: '#fff', flexWrap: 'wrap' }}
                      >
                        <div style={{ flex: 1, minWidth: 160 }}>
                          <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '.92rem', color: '#24151c' }}>{e.name}</p>
                          <p style={{ margin: 0, color: '#765d68', fontSize: '.8rem' }}>
                            {formatTime(e.start_time)} – {formatTime(e.end_time)}
                            {e.package_slug ? ` · ${PACKAGE_SHORT[e.package_slug] ?? e.package_slug}` : ''}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ padding: '4px 9px', borderRadius: 999, background: col.bg, color: col.text, fontSize: '.72rem', fontWeight: 700 }}>{e.status}</span>
                          <BalanceChip total={e.amount_total_minor} paid={e.deposit_paid_minor} />
                          {e.amount_total_minor > 0 && (
                            <span style={{ color: '#765d68', fontSize: '.78rem' }}>{fmtSGD(e.amount_total_minor)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: '10px 22px 14px', borderTop: '1px solid #f9f0f4' }}>
            {Object.entries(STATUS_COLOURS).map(([status, col]) => (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ display: 'block', width: 8, height: 8, borderRadius: '50%', background: col.dot }} />
                <span style={{ color: '#765d68', fontSize: '.72rem' }}>{status}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
