import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getPipette } from "../api/pipettes";
import type { PipetteListItem } from "../api/types";

export function PipetteDetailPage(): JSX.Element {
  const { id } = useParams();
  const [pipette, setPipette] = useState<PipetteListItem | null>(null);
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
  }, [id]);

  return (
    <section className="page">
      <p className="eyebrow">Details</p>
      <h2>Pipettendetails</h2>
      {error && <p className="error">{error}</p>}
      {!pipette && !error && <p>Pipette wird geladen.</p>}
      {pipette && (
        <dl className="detail-list">
          <dt>Bezeichnung</dt>
          <dd>
            {pipette.description}
            {pipette.requires_sartorius && (
              <span style={{ marginLeft: "0.5rem", color: "red" }}>Sartorius</span>
            )}
          </dd>
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
    </section>
  );
}
