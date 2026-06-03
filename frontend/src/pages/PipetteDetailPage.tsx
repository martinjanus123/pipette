import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getPipette, createCalibration } from "../api/pipettes";
import type { PipetteDetail, CalibrationCreatePayload } from "../api/types";

export function PipetteDetailPage(): JSX.Element {
  const { id } = useParams();
  const [pipette, setPipette] = useState<PipetteDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [calDate, setCalDate] = useState<string>("");
  const [nextDue, setNextDue] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [performedBy, setPerformedBy] = useState<string>("");
  const [certificateRef, setCertificateRef] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const loadPipette = () => {
    if (!id) return;
    getPipette(id)
      .then((item) => {
        setPipette(item);
        setError(null);
      })
      .catch(() => setError("Pipette konnte nicht geladen werden."));
  };

  useEffect(() => {
    loadPipette();
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const payload: CalibrationCreatePayload = {
      calibration_date: calDate,
      next_due_date: nextDue,
    };
    if (result) payload.result = result;
    if (performedBy) payload.performed_by = performedBy;
    if (certificateRef) payload.certificate_reference = certificateRef;
    if (notes) payload.notes = notes;

    createCalibration(id, payload)
      .then(() => {
        setFormError(null);
        // Reset form fields
        setCalDate("");
        setNextDue("");
        setResult("");
        setPerformedBy("");
        setCertificateRef("");
        setNotes("");
        // Reload pipette to show new entry
        loadPipette();
      })
      .catch(() => setFormError("Kalibrierung konnte nicht gespeichert werden."));
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
          <h3>Kalibrierhistorie</h3>
          {pipette.calibrations.length === 0 ? (
            <p>Keine Kalibrierungen vorhanden.</p>
          ) : (
            <table className="detail-list">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Nächstes Fällig</th>
                  <th>Ergebnis</th>
                  <th>Durchgeführt von</th>
                  <th>Zertifikat</th>
                  <th>Notizen</th>
                </tr>
              </thead>
              <tbody>
                {pipette.calibrations.map((c) => (
                  <tr key={c.id}>
                    <td>{c.calibration_date}</td>
                    <td>{c.next_due_date}</td>
                    <td>{c.result || "-"}</td>
                    <td>{c.performed_by || "-"}</td>
                    <td>{c.certificate_reference || "-"}</td>
                    <td>{c.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <h3>Neue Kalibrierung erfassen</h3>
          {formError && <p className="error">{formError}</p>}
          <form onSubmit={handleSubmit} className="detail-list">
            <label>
              Kalibrierdatum*:
              <input
                type="date"
                value={calDate}
                onChange={(e) => setCalDate(e.target.value)}
                required
              />
            </label>
            <label>
              Nächstes Fälligkeitsdatum*:
              <input
                type="date"
                value={nextDue}
                onChange={(e) => setNextDue(e.target.value)}
                required
              />
            </label>
            <label>
              Ergebnis:
              <input type="text" value={result} onChange={(e) => setResult(e.target.value)} />
            </label>
            <label>
              Durchgeführt von:
              <input type="text" value={performedBy} onChange={(e) => setPerformedBy(e.target.value)} />
            </label>
            <label>
              Zertifikatsreferenz:
              <input type="text" value={certificateRef} onChange={(e) => setCertificateRef(e.target.value)} />
            </label>
            <label>
              Notizen:
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <button type="submit">Speichern</button>
          </form>
        </>
      )}
    </section>
  );
}
