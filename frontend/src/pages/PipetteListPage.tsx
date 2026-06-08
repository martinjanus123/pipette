import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getPipettes } from "../api/pipettes";
import { importCalibrations } from "../api/calibrations";
import type { PipetteListItem, CalibrationImportResponse, CalibrationImportError } from "../api/types";

export function PipetteListPage(): JSX.Element {
  const [query, setQuery] = useState("");
  const [pipettes, setPipettes] = useState<PipetteListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Import UI state
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [importResult, setImportResult] = useState<CalibrationImportResponse | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    getPipettes(query)
      .then((items) => {
        if (isMounted) {
          setPipettes(items);
          setError(null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Pipetten konnten nicht geladen werden.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [query]);

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);
    try {
      const result = await importCalibrations(csvText);
      setImportResult(result);
      // Refresh pipette list after successful import
      const refreshed = await getPipettes(query);
      setPipettes(refreshed);
    } catch (err) {
      setImportError("Import fehlgeschlagen.");
    }
  };

  return (
    <section className="page">
      <p className="eyebrow">Uebersicht</p>
      <h2>Pipettenliste</h2>
      <label className="field">
        <span>Suche</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Seriennummer, Inventar-Nr. oder Bezeichnung"
        />
      </label>
      {/* Import button */}
      <button type="button" onClick={() => setShowImport((show) => !show)}>
        CSV Import
      </button>
      {showImport && (
        <form onSubmit={handleImportSubmit} style={{ marginTop: "1rem" }}>
          <label className="field" htmlFor="csv-import-textarea">
            <span>CSV Import</span>
          </label>
          {/* Example header visible for test */}
          <p>pipette_identifier,calibration_date,next_due_date,result,performed_by,certificate_reference,notes</p>
          <textarea
            id="csv-import-textarea"
            rows={6}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="pipette_identifier,calibration_date,next_due_date,result,performed_by,certificate_reference,notes"
          />
          <button type="submit">Importieren</button>
        </form>
      )}
      {importResult && (
        <div style={{ marginTop: "1rem" }}>
          <p>{`Importiert: ${importResult.imported_count}`}</p>
          {importResult.errors.length > 0 && (
            <div>
              <p>Fehler:</p>
              <ul>
                {importResult.errors.map((err, idx) => (
                  <li key={idx}>
                    {`Zeile ${err.row}, Feld ${err.field}: ${err.message}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {importError && <p className="error">{importError}</p>}

      {isLoading && <p>Pipetten werden geladen.</p>}
      {error && <p className="error">{error}</p>}
      {!isLoading && !error && pipettes.length === 0 && <p>Keine Pipetten vorhanden.</p>}
      {pipettes.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Reg.-Nr.</th>
              <th>Inventar-Nr.</th>
              <th>Serien-Nr.</th>
              <th>Bezeichnung</th>
              <th>Raum</th>
              <th>Anwendung</th>
            </tr>
          </thead>
          <tbody>
            {pipettes.map((pipette) => (
              <tr key={pipette.id}>
                <td>{pipette.register_number}</td>
                <td>{pipette.inventory_number}</td>
                <td>{pipette.serial_number}</td>
                <td>
                  <Link to={`/pipettes/${pipette.id}`}>{pipette.description}</Link>
                </td>
                <td>{pipette.room}</td>
                <td>{pipette.application}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
