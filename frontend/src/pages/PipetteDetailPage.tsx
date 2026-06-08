import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getPipette, patchPipetteStatus } from "../api/pipettes";
import type { PipetteDetail } from "../api/types";

export function PipetteDetailPage(): JSX.Element {
  const { id } = useParams();
  const [pipette, setPipette] = useState<PipetteDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [status, setStatus] = useState<string>("active");
  const [notes, setNotes] = useState<string>("");
  const [createdBy, setCreatedBy] = useState<string>("");

  useEffect(() => {
    if (!id) {
      return;
    }
    getPipette(id)
      .then((item) => {
        setPipette(item);
        setError(null);
        setStatus(item.status);
      })
      .catch(() => setError("Pipette konnte nicht geladen werden."));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pipette) return;
    try {
      await patchPipetteStatus(pipette.id.toString(), {
        status,
        notes: notes || undefined,
        created_by: createdBy || undefined,
      });
      // reload detail to get updated status and events
      const refreshed = await getPipette(pipette.id.toString());
      setPipette(refreshed);
      // clear optional fields
      setNotes("");
      setCreatedBy("");
    } catch (err) {
      setError("Status konnte nicht geändert werden.");
    }
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

          <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
            <label className="field">
              <span>Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                aria-label="Status"
              >
                <option value="active">active</option>
                <option value="maintenance">maintenance</option>
                <option value="retired">retired</option>
              </select>
            </label>
            <label className="field">
              <span>Notiz / Notes</span>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                aria-label="Notiz"
              />
            </label>
            <label className="field">
              <span>Benutzer / User / Erstellt</span>
              <input
                type="text"
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
                aria-label="Benutzer"
              />
            </label>
            <button type="submit" className="primary">
              Status speichern
            </button>
          </form>

          <section style={{ marginTop: "2rem" }}>
            <h3>Ereignishistorie</h3>
            {pipette.events && pipette.events.length > 0 ? (
              <ul>
                {pipette.events.map((ev) => (
                  <li key={ev.id}>
                    <strong>{ev.event_type}</strong> – {new Date(ev.event_date).toLocaleString()}
                    {ev.notes && <>, {ev.notes}</>}
                    {ev.created_by && <>, {ev.created_by}</>}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Keine Ereignisse.</p>
            )}
          </section>
        </>
      )}
    </section>
  );
}
