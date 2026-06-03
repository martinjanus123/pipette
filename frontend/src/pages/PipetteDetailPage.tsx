import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getPipette, changePipetteStatus } from "../api/pipettes";
import type { PipetteDetail } from "../api/types";

export function PipetteDetailPage(): JSX.Element {
  const { id } = useParams();
  const [pipette, setPipette] = useState<PipetteDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusSelect, setStatusSelect] = useState<string>("active");
  const [notes, setNotes] = useState<string>("");
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    loadPipette();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadPipette = () => {
    getPipette(id as string)
      .then((item) => {
        setPipette(item);
        setStatusSelect(item.status);
        setError(null);
      })
      .catch(() => setError("Pipette konnte nicht geladen werden."));
  };

  const handleStatusChange = async () => {
    if (!id) return;
    setUpdating(true);
    try {
      const updated = await changePipetteStatus(
        id as string,
        statusSelect as "active" | "maintenance" | "retired",
        notes || undefined,
        "frontend",
      );
      setPipette(updated);
      setError(null);
    } catch {
      setError("Status konnte nicht geändert werden.");
    } finally {
      setUpdating(false);
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
          <section className="status-change">
            <h3>Status ändern</h3>
            <label>
              Neuer Status:
              <select
                value={statusSelect}
                onChange={(e) => setStatusSelect(e.target.value)}
                disabled={updating}
              >
                <option value="active">active</option>
                <option value="maintenance">maintenance</option>
                <option value="retired">retired</option>
              </select>
            </label>
            <br />
            <label>
              Notiz (optional):
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                disabled={updating}
              />
            </label>
            <br />
            <button onClick={handleStatusChange} disabled={updating}>
              {updating ? "Speichert…" : "Status speichern"}
            </button>
          </section>
          <section className="event-history">
            <h3>Ereignishistorie</h3>
            {pipette.events.length === 0 ? (
              <p>Keine Ereignisse vorhanden.</p>
            ) : (
              <ul>
                {pipette.events.map((e) => (
                  <li key={e.id}>
                    <strong>{e.event_type}</strong> am {new Date(e.event_date).toLocaleString()}
                    {e.notes && <span>: {e.notes}</span>}
                    {e.old_value !== undefined && (
                      <span>
                        {' '}(von "{e.old_value}" zu "{e.new_value}")
                      </span>
                    )}
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
