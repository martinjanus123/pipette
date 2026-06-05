import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getPipette, getPipetteTimeline } from "../api/pipettes";
import type { PipetteListItem, TimelineEntry } from "../api/types";

export function PipetteDetailPage(): JSX.Element {
  const { id } = useParams();
  const [pipette, setPipette] = useState<PipetteListItem | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[] | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }
    getPipette(id)
      .then((item) => {
        setPipette(item);
        setError(null);
      })
      .catch(() => setError("Pipette konnte nicht geladen werden."));
    getPipetteTimeline(id)
      .then((entries) => {
        setTimeline(entries);
        setError(null);
      })
      .catch(() => setError("Timeline konnte nicht geladen werden."));
  }, [id]);

  const filteredTimeline = timeline?.filter((e) => {
    if (filter === "all") return true;
    return e.type === filter;
  }) ?? [];

  return (
    <section className="page">
      <p className="eyebrow">Details</p>
      <h2>Pipettendetails</h2>
      {error && <p className="error">{error}</p>}
      {!pipette && !error && <p>Pipette wird geladen.</p>}
      {pipette && (
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
      )}

      <h3>Timeline</h3>
      <label>
        Filter:{" "}
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Alle</option>
          <option value="event">Ereignisse</option>
          <option value="calibration">Kalibrierungen</option>
        </select>
      </label>
      {timeline === null && !error && <p>Timeline wird geladen.</p>}
      {timeline && filteredTimeline.length === 0 && <p>Keine Einträge gefunden.</p>}
      {filteredTimeline.length > 0 && (
        <ul className="timeline-list">
          {filteredTimeline.map((entry) => (
            <li key={entry.date + entry.type} className="timeline-item">
              <strong>{new Date(entry.date).toLocaleDateString()}</strong> – {entry.title}
              {entry.detail_text && <p>{entry.detail_text}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
