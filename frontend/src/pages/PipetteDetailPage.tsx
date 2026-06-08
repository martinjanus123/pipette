import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getPipette, getTimeline, type TimelineEntry } from "../api/pipettes";
import type { PipetteListItem } from "../api/types";

export function PipetteDetailPage(): JSX.Element {
  const { id } = useParams();
  const [pipette, setPipette] = useState<PipetteListItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Timeline state
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

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
    getTimeline(id)
      .then((entries) => {
        setTimeline(entries);
        setTimelineError(null);
      })
      .catch(() => setTimelineError("Timeline konnte nicht geladen werden."));
  }, [id]);

  const filteredTimeline = timeline.filter((e) => filter === "all" || e.type === filter);

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

      {/* Timeline Section */}
      <h3>Timeline</h3>
      {timelineError && <p className="error">{timelineError}</p>}
      {!timeline.length && !timelineError && <p>Timeline wird geladen.</p>}
      {timeline.length > 0 && (
        <>
          <div className="timeline-filters" style={{ marginBottom: "0.5rem" }}>
            <button onClick={() => setFilter("all")} disabled={filter === "all"}>
              Alle
            </button>
            <button onClick={() => setFilter("event")} disabled={filter === "event"} style={{ marginLeft: "0.5rem" }}>
              Ereignisse
            </button>
            <button onClick={() => setFilter("calibration")} disabled={filter === "calibration"} style={{ marginLeft: "0.5rem" }}>
              Kalibrierungen
            </button>
          </div>
          <ul className="timeline-list" style={{ listStyle: "none", padding: 0 }}>
            {filteredTimeline.map((entry, idx) => (
              <li key={idx} style={{ marginBottom: "0.5rem" }}>
                <strong>{entry.title}</strong>
                <p>{entry.detail}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
