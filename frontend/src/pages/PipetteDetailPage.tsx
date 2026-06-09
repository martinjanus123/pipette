import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getPipette, getPipetteTimeline } from "../api/pipettes";
import type { PipetteListItem, TimelineEntry } from "../api/types";

export function PipetteDetailPage(): JSX.Element {
  const { id } = useParams();
  const [pipette, setPipette] = useState<PipetteListItem | null>(null);
  const [pipetteError, setPipetteError] = useState<string | null>(null);

  const [timeline, setTimeline] = useState<TimelineEntry[] | null>(null);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [timelineLoading, setTimelineLoading] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    if (!id) return;
    // Load pipette details
    getPipette(id)
      .then((item) => {
        setPipette(item);
        setPipetteError(null);
      })
      .catch(() => setPipetteError("Pipette konnte nicht geladen werden."));

    // Load timeline
    setTimelineLoading(true);
    getPipetteTimeline(id)
      .then((entries) => {
        setTimeline(entries);
        setTimelineError(null);
      })
      .catch(() => setTimelineError("Timeline konnte nicht geladen werden."))
      .finally(() => setTimelineLoading(false));
  }, [id]);

  const filteredTimeline = timeline?.filter((e) => {
    if (filter === "All") return true;
    if (filter === "Events") return e.type === "event";
    if (filter === "Calibrations") return e.type === "calibration";
    return true;
  }) ?? [];

  return (
    <section className="page">
      <p className="eyebrow">Details</p>
      <h2>Pipettendetails</h2>
      {pipetteError && <p className="error">{pipetteError}</p>}
      {!pipette && !pipetteError && <p>Pipette wird geladen.</p>}
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
      {timelineError && <p className="error">{timelineError}</p>}
      {timelineLoading && <p>Timeline wird geladen.</p>}
      {!timelineLoading && !timelineError && (
        <>
          <label htmlFor="timeline-filter">Filter:</label>
          <select
            id="timeline-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option>All</option>
            <option>Events</option>
            <option>Calibrations</option>
          </select>
          {filteredTimeline.length === 0 ? (
            <p>Keine Einträge gefunden.</p>
          ) : (
            <ul className="timeline-list">
              {filteredTimeline.map((entry, idx) => (
                <li key={idx} className="timeline-item">
                  <strong>{new Date(entry.date).toLocaleString()}</strong> - {entry.title}
                  <p>{entry.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
