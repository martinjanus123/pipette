import { useEffect, useState, FormEvent } from "react";
import { useParams } from "react-router-dom";

import { getPipette, createCalibration } from "../api/pipettes";
import type { PipetteDetail, CalibrationRead } from "../api/types";

export function PipetteDetailPage(): JSX.Element {
  const { id } = useParams();
  const [pipette, setPipette] = useState<PipetteDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<Omit<CalibrationRead, "id">>({
    calibration_date: "",
    next_due_date: "",
    result: "",
    performed_by: "",
    certificate_reference: "",
    notes: "",
  });

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    // send only non-empty optional fields? backend accepts nulls, so send as is
    createCalibration(id, form)
      .then(() => {
        // reset form
        setForm({
          calibration_date: "",
          next_due_date: "",
          result: "",
          performed_by: "",
          certificate_reference: "",
          notes: "",
        });
        loadPipette();
      })
      .catch(() => setError("Kalibrierung konnte nicht angelegt werden."));
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
            <table className="calibration-table">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Nächste Fälligkeit</th>
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
          <form onSubmit={handleSubmit} className="calibration-form">
            <label>
              Kalibrierdatum:
              <input type="date" name="calibration_date" value={form.calibration_date} onChange={handleChange} required />
            </label>
            <label>
              Nächstes Fälligkeitsdatum:
              <input type="date" name="next_due_date" value={form.next_due_date} onChange={handleChange} required />
            </label>
            <label>
              Ergebnis:
              <input type="text" name="result" value={form.result} onChange={handleChange} />
            </label>
            <label>
              Durchgeführt von:
              <input type="text" name="performed_by" value={form.performed_by} onChange={handleChange} />
            </label>
            <label>
              Zertifikatsreferenz:
              <input type="text" name="certificate_reference" value={form.certificate_reference} onChange={handleChange} />
            </label>
            <label>
              Notizen:
              <textarea name="notes" value={form.notes} onChange={handleChange} />
            </label>
            <button type="submit">Kalibrierung speichern</button>
          </form>
        </>
      )}
    </section>
  );
}
