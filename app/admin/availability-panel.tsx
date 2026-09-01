'use client';

import { FormEvent, useEffect, useState } from 'react';
import { getBrowserSupabase } from '../../src/supabase/browser';

type Block = { id: string; event_date: string; start_time: string; end_time: string; reason: string | null };
const timeSlots = Array.from({ length: 57 }, (_, index) => { const minutes = 7 * 60 + index * 15; return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`; });
function displayTime(value: string) { const [hour, minute] = value.split(':').map(Number); return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`; }

export default function AvailabilityPanel() {
  const [blocks, setBlocks] = useState<Block[]>([]); const [message, setMessage] = useState('');
  const supabase = getBrowserSupabase();
  async function load() { const { data, error } = await supabase.from('availability_blocks').select('*').order('event_date').order('start_time'); if (error) setMessage(error.message); else setBlocks((data ?? []) as Block[]); }
  useEffect(() => { void load(); }, []);
  async function addBlock(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setMessage(''); const data = Object.fromEntries(new FormData(event.currentTarget).entries()); const { error } = await supabase.from('availability_blocks').insert({ event_date: data.eventDate, start_time: data.startTime, end_time: data.endTime, reason: data.reason || null }); if (error) setMessage(error.message); else { event.currentTarget.reset(); await load(); } }
  async function removeBlock(id: string) { const { error } = await supabase.from('availability_blocks').delete().eq('id', id); if (error) setMessage(error.message); else setBlocks((items) => items.filter((item) => item.id !== id)); }
  return <section className="availability-panel"><div><p className="eyebrow">Calendar controls</p><h2>Block unavailable times</h2><p className="panel-copy">Use this for personal bookings, venue restrictions, holidays, or setup days. Customers will not be able to request blocked times.</p></div><form className="availability-form" onSubmit={addBlock}><label>Date<input type="date" name="eventDate" required /></label><label>From<select name="startTime" required defaultValue=""><option value="" disabled>Choose</option>{timeSlots.slice(0, -1).map((time) => <option key={time} value={time}>{displayTime(time)}</option>)}</select></label><label>Until<select name="endTime" required defaultValue=""><option value="" disabled>Choose</option>{timeSlots.slice(1).map((time) => <option key={time} value={time}>{displayTime(time)}</option>)}</select></label><label className="availability-reason">Reason (optional)<input name="reason" placeholder="Holiday, private event…" /></label><button className="button" type="submit">Block time</button></form>{message && <p className="form-error" role="alert">{message}</p>}{blocks.length > 0 && <div className="blocked-list">{blocks.map((block) => <div className="blocked-row" key={block.id}><div><strong>{new Intl.DateTimeFormat('en-SG', { dateStyle: 'medium' }).format(new Date(`${block.event_date}T00:00:00`))}</strong><span>{displayTime(block.start_time)} – {displayTime(block.end_time)}{block.reason ? ` · ${block.reason}` : ''}</span></div><button className="text-button" type="button" onClick={() => void removeBlock(block.id)}>Remove</button></div>)}</div>}</section>;
}
