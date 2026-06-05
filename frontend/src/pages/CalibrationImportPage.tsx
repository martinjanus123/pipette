import React, { useState } from "react";
import { importCalibrations } from "../api/calibration";

const exampleCsv = `pipette_identifier,calibration_date,next_due_date,result,performed_by,certificate_reference,notes
INV-001,2023-01-15,2024-01-15,Pass,John Doe,REF-123,Initial calibration`;

export default function CalibrationImportPage() {
  const [csvText, setCsvText] = useState(exampleCsv);
  const [result, setResult] = useState<{ imported: number; errors: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await importCalibrations(csvText);
      setResult(res);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "1rem" }}>
      <h2>Kalibrierungen per CSV importieren</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="csvText">CSV-Text (mit Header Zeile):</label>
        <textarea
          id="csvText"
          rows={10}
          style={{ width: "100%", fontFamily: "monospace" }}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
        />
        <button type="submit" disabled={loading} style={{ marginTop: "0.5rem" }}>
          {loading ? "Importiere…" : "Import starten"}
        </button>
      </form>
      {error && <p style={{ color: "red" }}>Fehler: {error}</p>}
      {result && (
        <div style={{ marginTop: "1rem" }}>
          <p>Erfolgreich importierte Kalibrierungen: {result.imported}</p>
          {result.errors.length > 0 && (
            <div>
              <h4>Fehlerhafte Zeilen:</h4>
              <ul>
                {result.errors.map((err, idx) => (
                  <li key={idx}>
                    Zeile {err.line}, Feld "{err.field}": {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
