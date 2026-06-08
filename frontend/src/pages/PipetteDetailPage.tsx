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
          {/* Existing fields */}
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
          {/* New technical fields */}
          <dt>Hersteller</dt>
          <dd>{pipette.manufacturer}</dd>
          <dt>Modell</dt>
          <dd>{pipette.model_name}</dd>
          <dt>Nennvolumen (µL)</dt>
          <dd>{pipette.nominal_volume_ul}</dd>
          <dt>Anzahl Kanäle</dt>
          <dd>{pipette.channel_count}</dd>
          <dt>Kalibrierintervall (Monate)</dt>
          <dd>{pipette.calibration_interval_months}</dd>
          <dt>Pipettentyp</dt>
          <dd>{pipette.pipette_type}</dd>
        </dl>
      )}
    </section>
  );
}
