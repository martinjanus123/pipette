import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getPipette, getTimeline } from "../api/pipettes";
import type { PipetteListItem, TimelineEntry } from "../api/types";

export function PipetteDetailPage(): JSX.Element {
  const { id } = useParams();
  const [pipette, setPipette] = useState<PipetteListItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "event" | "calibration">("all");

  useEffect(() => {
    if (!id) {
      return;
    }
    // Load pipette details
    getPipette(id)
      .then((item) => {
        setPipette(item);
        setError(null);
      })
      .catch(() => setError("Pipette konnte nicht geladen werden."));

    // Load timeline
    setTimelineLoading(true);
    getTimeline(id)
      .then((entries) => {
        setTimeline(entries);
        setTimelineError(null);
      })
      .catch(() => setTimelineError("Timeline konnte nicht geladen werden."))
      .finally(() => setTimelineLoading(false));
  }, [id]);

  const filteredTimeline = timeline.filter((e) => filter === "all" || e.type === filter);

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
          <h3>Timeline</h3>
          <div className="timeline-filters">
            <button onClick={() => setFilter("all")}>
              Alle
            </button>
            <button onClick={() => setFilter("event")}>
              Ereignisse
            </button>
            <button onClick={() => setFilter("calibration")}>
              Kalibrierungen
            </button>
          </div>
          {timelineError && <p className="error">{timelineError}</p>}
          {timelineLoading && !timelineError && <p>Timeline wird geladen.</p>}
          {!timelineLoading && filteredTimeline.length === 0 && !timelineError && (
            <p>Keine Einträge vorhanden.</p>
          )}
          <ul className="timeline-list">
            {filteredTimeline.map((entry, idx) => (
              <li key={idx} className="timeline-item">
                <strong>{entry.title}</strong> – {new Date(entry.date).toLocaleString()}
                {entry.detail && <p>{entry.detail}</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
