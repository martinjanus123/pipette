import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getPipette, createCalibration } from "../api/pipettes";
import type { PipetteDetail, CalibrationCreatePayload, Calibration } from "../api/types";

export function PipetteDetailPage(): JSX.Element {
  const { id } = useParams();
  const [pipette, setPipette] = useState<PipetteDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<CalibrationCreatePayload>({
    calibration_date: "",
    next_due_date: "",
    result: "",
    performed_by: "",
    certificate_reference: "",
    notes: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    // Simple validation for required fields
    if (!form.calibration_date || !form.next_due_date) {
      setFormError("Kalibrierdatum und nächstes Fälligkeitsdatum sind erforderlich.");
      return;
    }
    const payload: CalibrationCreatePayload = { ...form };
    createCalibration(id, payload)
      .then(() => {
        setFormError(null);
        // Reset form
        setForm({
          calibration_date: "",
          next_due_date: "",
          result: "",
          performed_by: "",
          certificate_reference: "",
          notes: "",
        });
        // Refresh pipette detail to show new calibration
        loadPipette();
      })
      .catch(() => setFormError("Kalibrierung konnte nicht angelegt werden."));
  };

  return (
    <main className="page">
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
            <table className="calibration-table">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Nächstes Fälligkeitsdatum</th>
                  <th>Ergebnis</th>
                  <th>Durchgeführt von</th>
                  <th>Zertifikatsref.</th>
                  <th>Notizen</th>
                </tr>
              </thead>
              <tbody>
                {pipette.calibrations.map((c) => (
                  <tr key={c.id}>
                    <td>{new Date(c.calibration_date).toLocaleDateString()}</td>
                    <td>{new Date(c.next_due_date).toLocaleDateString()}</td>
                    <td>{c.result ?? "-"}</td>
                    <td>{c.performed_by ?? "-"}</td>
                    <td>{c.certificate_reference ?? "-"}</td>
                    <td>{c.notes ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <h3>Neue Kalibrierung erfassen</h3>
          {formError && <p className="error">{formError}</p>}
          <form onSubmit={handleSubmit} className="calibration-form">
            <label>
              Kalibrierdatum*:
              <input
                type="date"
                name="calibration_date"
                value={form.calibration_date}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              Nächstes Fälligkeitsdatum*:
              <input
                type="date"
                name="next_due_date"
                value={form.next_due_date}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              Ergebnis:
              <input type="text" name="result" value={form.result || ""} onChange={handleInputChange} />
            </label>
            <label>
              Durchgeführt von:
              <input type="text" name="performed_by" value={form.performed_by || ""} onChange={handleInputChange} />
            </label>
            <label>
              Zertifikatsreferenz:
              <input type="text" name="certificate_reference" value={form.certificate_reference || ""} onChange={handleInputChange} />
            </label>
            <label>
              Notizen:
              <textarea name="notes" value={form.notes || ""} onChange={handleInputChange} />
            </label>
            <button type="submit">Kalibrierung speichern</button>
          </form>
        </>
      )}
    </main>
  );
}
