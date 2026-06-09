import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getPipette, updatePipetteStatus } from "../api/pipettes";
import type { PipetteDetail, PipetteStatusUpdate } from "../api/types";

export function PipetteDetailPage(): JSX.Element {
  const { id } = useParams();
  const [pipette, setPipette] = useState<PipetteDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("active");
  const [notes, setNotes] = useState<string>("");
  const [updating, setUpdating] = useState<boolean>(false);

  const loadPipette = () => {
    if (!id) return;
    getPipette(id)
      .then((item) => {
        setPipette(item);
        setError(null);
        setStatus(item.status);
      })
      .catch(() => setError("Pipette konnte nicht geladen werden."));
  };

  useEffect(() => {
    loadPipette();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const payload: PipetteStatusUpdate = { status: status as any, notes: notes || undefined };
    setUpdating(true);
    updatePipetteStatus(id, payload)
      .then(() => {
        setNotes("");
        loadPipette();
      })
      .catch(() => setError("Status konnte nicht aktualisiert werden."))
      .finally(() => setUpdating(false));
  };

  return (
    <section className="page">
      <p className="eyebrow">Details</p>
      <h2>Pipettendetails</h2>
      {error && <p className="error">{error}</p>}
      {!pipette && !error && <p>Pipette wird geladen.</p>}
      {pipette && (
        <>
          <dl className="detail-list">
            <dt>Bezeichnung</dt>
            <dd>{pipette.description}</dd>
            <dt>Inventar-Nr.</dt>
            <dd>{pipette.inventory_number}</dd>
            <dt>Serien-Nr.</dt>
            <dd>{pipette.serial_number}</dd>
            <dt>Raum</dt>
            <dd>{pipette.room}</dd>
            <dt>Anwendung</dt>
            <dd>{pipette.application}</dd>
            <dt>Verwendung</dt>
            <dd>{pipette.use}</dd>
            <dt>Status</dt>
            <dd>{pipette.status}</dd>
          </dl>

          <section className="status-update">
            <h3>Status ändern</h3>
            <form onSubmit={handleStatusUpdate}>
              <label>
                Neuer Status:
                <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={updating}>
                  <option value="active">active</option>
                  <option value="maintenance">maintenance</option>
                  <option value="retired">retired</option>
                </select>
              </label>
              <label>
                Notiz (optional):
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={updating}
                />
              </label>
              <button type="submit" disabled={updating}>Aktualisieren</button>
            </form>
          </section>

          <section className="event-history">
            <h3>Ereignishistorie</h3>
            {pipette.events.length === 0 ? (
              <p>Keine Ereignisse.</p>
            ) : (
              <ul>
                {pipette.events.map((ev) => (
                  <li key={ev.id}>
                    <strong>{new Date(ev.event_date).toLocaleString()}</strong> – {ev.event_type}
                    {ev.old_value !== undefined && ev.new_value !== undefined && (
                      <span>
                        : {ev.old_value} → {ev.new_value}
                      </span>
                    )}
                    {ev.notes && <div>Notiz: {ev.notes}</div>}
                    {ev.created_by && <div>Von: {ev.created_by}</div>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </section>
  );
}
