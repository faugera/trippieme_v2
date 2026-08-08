'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { Itinerary, ItineraryEditProposal, TripRequest } from '@/lib/trip-schema';

const STORAGE_KEY = 'trippieme.active-itinerary.v1';
const SAVED_TRIPS_KEY = 'trippieme.saved-itineraries.v1';
const MAX_SAVED_TRIPS = 12;

const INITIAL_ITINERARY: Itinerary = {
  title: 'Londres en famille',
  summary: 'Un séjour familial mêlant l’East End, les grands incontournables et des temps de respiration.',
  cover: { imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80', alt: 'Vue de Londres', photographerName: 'Unsplash', photographerUrl: 'https://unsplash.com', unsplashUrl: 'https://unsplash.com' },
  logistics: { warnings: ['Vérifier les réservations et horaires avant le départ.'] },
  days: [
    { date: '2026-08-07', city: 'Londres', theme: 'Arrivée dans l’East End', activities: [{ time: '17:20', title: 'London Luton Airport', location: 'Airport Way, Luton LU2 9LY', durationMinutes: 50, travelNote: 'Bagages et contrôles.' }, { time: '18:20', title: 'Thameslink vers Farringdon', location: 'Luton Airport Parkway', durationMinutes: 45, travelNote: 'Train vers le centre.' }, { time: '20:30', title: 'Check-in à Aptel East', location: '169–171 Commercial Road, E1 2DA', durationMinutes: 20 }, { time: '21:30', title: 'Poppies Fish & Chips', location: '6–8 Hanbury Street, E1 6QR', durationMinutes: 60, bookingNote: 'Premier dîner dans l’East End.' }] },
    { date: '2026-08-08', city: 'Londres', theme: 'Tower Bridge & City', activities: [{ time: '09:30', title: 'Tour de Londres — extérieur', location: 'Tower Hill, EC3N 4AB', durationMinutes: 40 }, { time: '10:35', title: 'Tower Bridge', location: 'Tower Bridge Road, SE1 2UP', durationMinutes: 35 }, { time: '13:00', title: 'Darwin Brasserie — Sky Garden', location: '20 Fenchurch Street, EC3M 8AF', durationMinutes: 90, bookingNote: 'Réservation recommandée.' }, { time: '16:10', title: 'Old Spitalfields Market', location: '16 Horner Square, E1 6EW', durationMinutes: 45 }] },
    { date: '2026-08-09', city: 'Londres', theme: 'Camden & Hyde Park', activities: [{ time: '10:00', title: 'Westbourne Street', location: '20 Westbourne Street, W2 2TZ', durationMinutes: 40 }, { time: '11:40', title: 'Camden Market', location: 'Camden Lock Place, NW1 8AF', durationMinutes: 150 }, { time: '17:00', title: 'Hyde Park', location: 'W2 2UH', durationMinutes: 120 }] },
  ],
};

type ApiError = { error?: string };

type SavedTrip = {
  id: string;
  itinerary: Itinerary;
  updatedAt: string;
};

const MAP_VIEWPORTS: Record<string, { bbox: string; marker: string }> = {
  londres: { bbox: '-0.250%2C51.480%2C-0.025%2C51.565', marker: '51.5072%2C-0.1276' },
  london: { bbox: '-0.250%2C51.480%2C-0.025%2C51.565', marker: '51.5072%2C-0.1276' },
  paris: { bbox: '2.224%2C48.815%2C2.469%2C48.902', marker: '48.8566%2C2.3522' },
  rome: { bbox: '12.400%2C41.830%2C12.600%2C41.960', marker: '41.9028%2C12.4964' },
  barcelone: { bbox: '2.050%2C41.320%2C2.280%2C41.470', marker: '41.3874%2C2.1686' },
  madrid: { bbox: '-3.820%2C40.320%2C-3.570%2C40.500', marker: '40.4168%2C-3.7038' },
  lisbonne: { bbox: '-9.260%2C38.670%2C-9.040%2C38.790', marker: '38.7223%2C-9.1393' },
  lisbon: { bbox: '-9.260%2C38.670%2C-9.040%2C38.790', marker: '38.7223%2C-9.1393' },
  amsterdam: { bbox: '4.750%2C52.290%2C5.020%2C52.430', marker: '52.3676%2C4.9041' },
  florence: { bbox: '11.160%2C43.720%2C11.340%2C43.850', marker: '43.7696%2C11.2558' },
  venise: { bbox: '12.220%2C45.380%2C12.470%2C45.520', marker: '45.4408%2C12.3155' },
  venice: { bbox: '12.220%2C45.380%2C12.470%2C45.520', marker: '45.4408%2C12.3155' },
  berlin: { bbox: '13.200%2C52.400%2C13.560%2C52.610', marker: '52.5200%2C13.4050' },
  tokyo: { bbox: '139.570%2C35.600%2C139.900%2C35.800', marker: '35.6762%2C139.6503' },
  newyork: { bbox: '-74.180%2C40.600%2C-73.700%2C40.900', marker: '40.7128%2C-74.0060' },
  'new york': { bbox: '-74.180%2C40.600%2C-73.700%2C40.900', marker: '40.7128%2C-74.0060' },
};

function formatDate(date: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('fr-FR', options).format(new Date(`${date}T12:00:00`));
}

function durationLabel(minutes: number) {
  return minutes >= 60 ? `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${minutes % 60}` : ''}` : `${minutes} min`;
}

function tripId(itinerary: Itinerary) {
  return `${itinerary.title.toLocaleLowerCase('fr-FR')}|${itinerary.days[0]?.date ?? ''}`;
}

function readSavedTrips() {
  try {
    const value = window.localStorage.getItem(SAVED_TRIPS_KEY);
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is SavedTrip => Boolean(item && typeof item === 'object' && 'id' in item && 'itinerary' in item && 'updatedAt' in item)) : [];
  } catch {
    return [];
  }
}

function mapViewport(city: string) {
  const key = city.trim().toLocaleLowerCase('fr-FR');
  return MAP_VIEWPORTS[key] ?? { bbox: '-180%2C-75%2C180%2C75', marker: '' };
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const payload = await response.json().catch(() => ({})) as T & ApiError;
  if (!response.ok) throw new Error(payload.error ?? 'Une erreur est survenue.');
  return payload;
}

export default function TrippieMe() {
  const [view, setView] = useState<'trip' | 'trips'>('trip');
  const [itinerary, setItinerary] = useState<Itinerary>(INITIAL_ITINERARY);
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [activeDay, setActiveDay] = useState(0);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  const storageReady = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      storageReady.current = true;
      setSavedTrips(readSavedTrips());
      if (!stored) return;
      try { setItinerary(JSON.parse(stored) as Itinerary); } catch { window.localStorage.removeItem(STORAGE_KEY); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!storageReady.current) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(itinerary));
    const nextTrip: SavedTrip = { id: tripId(itinerary), itinerary, updatedAt: new Date().toISOString() };
    setSavedTrips((current) => {
      const next = [nextTrip, ...current.filter((trip) => trip.id !== nextTrip.id)].slice(0, MAX_SAVED_TRIPS);
      window.localStorage.setItem(SAVED_TRIPS_KEY, JSON.stringify(next));
      return next;
    });
  }, [itinerary]);

  const currentDay = itinerary.days[Math.min(activeDay, itinerary.days.length - 1)];
  const tripDates = useMemo(() => {
    const first = itinerary.days[0]?.date;
    const last = itinerary.days.at(-1)?.date;
    return first && last ? `${formatDate(first, { day: 'numeric', month: 'long' })}–${formatDate(last, { day: 'numeric', month: 'long', year: 'numeric' })}` : '';
  }, [itinerary.days]);

  async function shareTrip() {
    const shareData = { title: itinerary.title, text: itinerary.summary, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard.writeText(window.location.href);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
  }

  function toggleCompleted(dayIndex: number, activityIndex: number) {
    const key = `${dayIndex}:${activityIndex}`;
    setCompleted((values) => values.includes(key) ? values.filter((value) => value !== key) : [...values, key]);
  }

  return <main className="tm-app">
    <Topbar view={view} onTrips={() => setView('trips')} onMap={() => setView('trip')} onNew={() => setShowGenerator(true)} />
    {view === 'trips' ? <TripsView trips={savedTrips} onResume={(nextItinerary) => { setItinerary(nextItinerary); setActiveDay(0); setView('trip'); }} onNew={() => setShowGenerator(true)} /> : <>
      <section className="workspace">
        <MapPanel day={currentDay} dayNumber={activeDay + 1} />
        <aside className="trip-panel">
          <div className="trip-meta">VOYAGE ACTIF · ENREGISTRÉ SUR CET APPAREIL</div>
          <div className="title-row"><div><h1>{itinerary.title}</h1><p>{tripDates} <span>•</span> programme personnalisé</p></div></div>
          <div className="segment"><button className="selected">Programme</button><button onClick={() => setShowAssistant(true)}>✦ Assistant IA</button></div>
          <div className="day-strip">{itinerary.days.map((item, index) => <button key={item.date} className={index === activeDay ? 'active' : ''} onClick={() => setActiveDay(index)}><b>J{index + 1}</b><span>{formatDate(item.date, { weekday: 'short', day: 'numeric' })}</span></button>)}</div>
          <div className="program-head"><div><span>{formatDate(currentDay.date, { weekday: 'long', day: 'numeric', month: 'long' })}</span><h2>{currentDay.theme}</h2></div><span className="weather">Programme</span></div>
          <div className={collapsed ? 'timeline collapsed' : 'timeline'}>{currentDay.activities.map((activity, index) => <StopCard key={`${activity.time}-${activity.title}`} activity={activity} index={index} complete={completed.includes(`${activeDay}:${index}`)} onToggle={() => toggleCompleted(activeDay, index)} onAsk={() => setShowAssistant(true)} />)}</div>
          <div className="program-actions"><button onClick={() => setShowAssistant(true)}>✦ Modifier avec l’IA</button><button onClick={shareTrip}>↗ Partager</button><button className="round-action" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? 'Déplier le programme' : 'Masquer le programme'}>{collapsed ? '⌄' : '⌃'}</button></div>
        </aside>
      </section>
      {showAssistant && <AssistantModal itinerary={itinerary} onApply={setItinerary} onClose={() => setShowAssistant(false)} />}
    </>}
    {showGenerator && <GeneratorModal onClose={() => setShowGenerator(false)} onCreate={(nextItinerary) => { setItinerary(nextItinerary); setActiveDay(0); setView('trip'); setShowGenerator(false); }} />}
  </main>;
}

function Topbar({ view, onTrips, onMap, onNew }: { view: 'trip' | 'trips'; onTrips: () => void; onMap: () => void; onNew: () => void }) {
  return <header className="tm-topbar"><button className="tm-brand" onClick={onMap}><i>T</i><strong>TrippieMe</strong></button><div className="top-actions">{view === 'trip' ? <button className="outline" onClick={onTrips}>▦ Mes voyages</button> : <button className="outline" onClick={onMap}>← Retour à la carte</button>}<button className="dark" onClick={onNew}>＋ <span className="new-label">Nouveau voyage</span></button></div></header>;
}

function MapPanel({ day, dayNumber }: { day: Itinerary['days'][number]; dayNumber: number }) {
  const viewport = mapViewport(day.city);
  const source = `https://www.openstreetmap.org/export/embed.html?bbox=${viewport.bbox}&layer=mapnik${viewport.marker ? `&marker=${viewport.marker}` : ''}`;
  const mapSearch = `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${day.city} ${day.activities[0]?.location ?? ''}`)}`;
  return <section className="map-panel-new" aria-label={`Carte des étapes du jour ${dayNumber} à ${day.city}`}><iframe title={`Carte de ${day.city}`} src={source} loading="lazy" /><div className="map-tools"><a href={mapSearch} target="_blank" rel="noreferrer">⌕ <span>{day.city} · {day.activities.length} étapes</span></a></div>{day.activities.slice(0, 3).map((activity, index) => <div key={activity.title} className={`map-mark mark-${String.fromCharCode(97 + index)}`}>{index + 1}<span>●</span></div>)}<div className="map-day">● Jour {dayNumber} · {day.city}</div></section>;
}

function StopCard({ activity, index, complete, onToggle, onAsk }: { activity: Itinerary['days'][number]['activities'][number]; index: number; complete: boolean; onToggle: () => void; onAsk: () => void }) {
  return <article className="stop"><div className="stop-rail"><i>{index + 1}</i><time>{activity.time}</time></div><div className="stop-card"><p>ÉTAPE {index + 1}</p><h3>{activity.title}</h3><span>{activity.location}</span>{activity.travelNote && <div className="stop-description">{activity.travelNote}</div>}<small>{durationLabel(activity.durationMinutes)}{activity.bookingNote ? ` · ${activity.bookingNote}` : ''}</small><footer><button onClick={onAsk}>Demander à l’IA</button><button onClick={onToggle}>{complete ? '✓ Terminé' : 'Marquer terminé'}</button></footer></div></article>;
}

function TripsView({ trips, onResume, onNew }: { trips: SavedTrip[]; onResume: (itinerary: Itinerary) => void; onNew: () => void }) {
  return <section className="trips-page"><div className="trips-hero"><span>VOTRE CARNET DE VOYAGES</span><h1>Mes voyages</h1><p>Vos itinéraires sont conservés sur cet appareil, jusqu’à {MAX_SAVED_TRIPS} voyages.</p><button className="dark" onClick={onNew}>＋ Nouveau voyage</button></div><nav className="filters"><button className="selected">Tous <b>{trips.length}</b></button></nav><div className="trip-grid">{trips.map(({ id, itinerary }) => <article key={id} className="trip-tile" style={{ backgroundImage: `url(${itinerary.cover?.imageUrl ?? ''})` }}><div><span>SÉJOUR</span><small>{itinerary.days[0]?.city}</small><h2>{itinerary.title}</h2></div><footer><p>◉ {itinerary.days.length} jours <b>•</b> programme IA</p><button onClick={() => onResume(itinerary)}>Reprendre le voyage →</button></footer></article>)}</div></section>;
}

function GeneratorModal({ onClose, onCreate }: { onClose: () => void; onCreate: (itinerary: Itinerary) => void }) {
  const [form, setForm] = useState({ title: '', destinations: 'Londres', startDate: '2026-08-07', endDate: '2026-08-12', travellers: '4', origin: 'Bordeaux', arrivalPlace: 'London Luton Airport', arrivalDate: '2026-08-07', arrivalTime: '17:20', accommodation: '', pace: 'balanced' as TripRequest['pace'] });
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const update = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [field]: event.target.value });
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    const cities = form.destinations.split(',').map((city) => city.trim()).filter(Boolean);
    const start = new Date(`${form.startDate}T12:00:00`); const end = new Date(`${form.endDate}T12:00:00`);
    const nights = Math.round((end.getTime() - start.getTime()) / 86_400_000);
    if (nights < 1 || cities.length === 0 || cities.length > nights) { setError('Indique au moins une destination par nuit et un séjour d’une nuit minimum.'); return; }
    const request: TripRequest = { title: form.title || undefined, startDate: form.startDate, endDate: form.endDate, travellers: Number(form.travellers), interests: [], pace: form.pace, cities: cities.map((city, index) => ({ city: { label: city }, nights: index === 0 ? nights - (cities.length - 1) : 1, accommodation: index === 0 && form.accommodation ? { label: form.accommodation, address: form.accommodation } : undefined })), arrival: form.arrivalPlace ? { mode: 'plane', origin: form.origin ? { label: form.origin } : undefined, destination: { label: form.arrivalPlace }, dateTime: `${form.arrivalDate}T${form.arrivalTime}:00.000Z`, bufferMinutes: 60 } : undefined };
    setLoading(true);
    try { const result = await postJson<{ itinerary: Itinerary }>('/api/trips/generate', request); onCreate(result.itinerary); } catch (cause) { setError(cause instanceof Error ? cause.message : 'La génération a échoué.'); } finally { setLoading(false); }
  }
  return <Modal onClose={onClose}><section className="generator"><header><div className="magic">✦</div><div><h2>Générer un nouveau voyage</h2><p>Un premier itinéraire adapté à vos critères</p></div><button onClick={onClose} aria-label="Fermer">×</button></header><div className="generator-content"><aside><strong>Bonjour 👋 Quel voyage souhaitez-vous imaginer ?</strong><p>Renseignez les critères essentiels. TrippieMe prépare un programme jour par jour, que vous pourrez ensuite ajuster avec l’assistant.</p></aside><form onSubmit={submit}><label>Nom du voyage <em>optionnel</em><input value={form.title} onChange={update('title')} placeholder="Ex. Escapade italienne" /></label><label>Destination(s) <b>*</b><input required value={form.destinations} onChange={update('destinations')} placeholder="Ex. Rome ou Rome, Florence" /></label><div className="form-grid"><label>Ville d’origine<input value={form.origin} onChange={update('origin')} /></label><label>Voyageurs <b>*</b><input required min="1" max="12" type="number" value={form.travellers} onChange={update('travellers')} /></label><label>Premier jour <b>*</b><input required type="date" value={form.startDate} onChange={update('startDate')} /></label><label>Dernier jour <b>*</b><input required type="date" value={form.endDate} onChange={update('endDate')} /></label><label>Rythme<select value={form.pace} onChange={update('pace')}><option value="relaxed">Détendu</option><option value="balanced">Équilibré</option><option value="intense">Soutenu</option></select></label></div><fieldset><legend><i>1</i> ARRIVÉE <em>facultatif</em></legend><div className="form-grid"><label>Lieu d’arrivée<input value={form.arrivalPlace} onChange={update('arrivalPlace')} placeholder="Aéroport, gare, adresse…" /></label><label>Hébergement<input value={form.accommodation} onChange={update('accommodation')} placeholder="Adresse ou hôtel" /></label><label>Date<input type="date" value={form.arrivalDate} onChange={update('arrivalDate')} /></label><label>Heure locale<input type="time" value={form.arrivalTime} onChange={update('arrivalTime')} /></label></div></fieldset>{error && <p className="form-error" role="alert">{error}</p>}<footer><button type="button" onClick={onClose}>Annuler</button><button className="dark" disabled={loading}>{loading ? 'Génération…' : '✦ Générer le voyage'}</button></footer></form></div></section></Modal>;
}

function AssistantModal({ itinerary, onApply, onClose }: { itinerary: Itinerary; onApply: (itinerary: Itinerary) => void; onClose: () => void }) {
  const [instruction, setInstruction] = useState(''); const [proposal, setProposal] = useState<ItineraryEditProposal>(); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); if (!instruction.trim()) return; setError(''); setLoading(true); try { const result = await postJson<{ proposal: ItineraryEditProposal }>('/api/trips/edit', { instruction, itinerary }); setProposal(result.proposal); } catch (cause) { setError(cause instanceof Error ? cause.message : 'La proposition n’a pas pu être préparée.'); } finally { setLoading(false); } }
  return <Modal onClose={onClose}><section className="assistant-popover"><div><button className="close" onClick={onClose} aria-label="Fermer">×</button><p>✦ ASSISTANT TRIPPIEME</p><h2>Modifier votre itinéraire</h2><form onSubmit={submit}><input value={instruction} onChange={(event) => setInstruction(event.target.value)} placeholder="Ex. ajoute une journée aux studios Harry Potter" autoFocus /><button className="dark" disabled={loading}>{loading ? 'Préparation…' : 'Préparer une proposition'}</button></form>{error && <p className="form-error" role="alert">{error}</p>}{proposal && <div className="proposal"><b>PROPOSITION · {proposal.changes.length} MODIFICATION{proposal.changes.length > 1 ? 'S' : ''}</b><p>{proposal.summary}</p><ul>{proposal.changes.map((change) => <li key={change}>{change}</li>)}</ul><footer><button className="dark" onClick={() => { onApply(proposal.itinerary); onClose(); }}>Appliquer</button><button onClick={() => setProposal(undefined)}>Annuler</button></footer></div>}</div></section></Modal>;
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, [onClose]);
  return <div className="modal-backdrop" role="dialog" aria-modal="true" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>{children}</div>;
}
