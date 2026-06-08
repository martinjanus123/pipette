import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getPipettes } from "../api/pipettes";
import type { PipetteListItem } from "../api/types";

export function PipetteListPage(): JSX.Element {
  const [query, setQuery] = useState("");
  const [pipettes, setPipettes] = useState<PipetteListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // CSV import UI state
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [importResult, setImportResult] = useState<
    { imported_count: number; errors: Array<{ row: number; field: string; message: string }> } | null
  >(null);
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

  const handleImport = async () => {
    setImportError(null);
    setImportResult(null);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL ?? ""}/api/calibrations/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv_text: csvText }),
      });
      if (!response.ok) {
        throw new Error("Import failed");
      }
      const data = await response.json();
      setImportResult(data);
    } catch (e) {
      setImportError("Import konnte nicht durchgeführt werden.");
    }
  };

  return (
    <section className="page">
      <p className="eyebrow">Uebersicht</p>
      <h2>Pipettenliste</h2>
      {/* CSV Import button and form */}
      <button type="button" onClick={() => setShowImport(!showImport)}>
        CSV-Import
      </button>
      {showImport && (
        <div className="import-form" style={{ marginTop: "1em" }}>
          <p>Beispiel Header: pipette_identifier,calibration_date,next_due_date,result,performed_by,certificate_reference,notes</p>
          <label className="field">
            <span>CSV Import</span>
            <textarea
              aria-label="CSV Import"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={6}
              style={{ width: "100%" }}
            />
          </label>
          <button type="button" onClick={handleImport}>
            Importieren
          </button>
          {importError && <p className="error">{importError}</p>}
          {importResult && (
            <div className="import-result" style={{ marginTop: "1em" }}>
              <p>Importierte Zeilen: {importResult.imported_count}</p>
              {importResult.errors && importResult.errors.length > 0 && (
                <ul>
                  {importResult.errors.map((err, idx) => (
                    <li key={idx}>
                      Zeile {err.row}: {err.field} – {err.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
      <label className="field">
        <span>Suche</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Seriennummer, Inventar-Nr. oder Bezeichnung"
        />
      </label>
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
