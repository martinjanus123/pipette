import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";

import { getPipettes } from "../api/pipettes";
import type { PipetteListItem } from "../api/types";

export function PipetteListPage(): JSX.Element {
  const [query, setQuery] = useState("");
  const [pipettes, setPipettes] = useState<PipetteListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // sorting state: column key and direction (asc/desc)
  const [sortColumn, setSortColumn] = useState<keyof PipetteListItem | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

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

  // compute sorted list (stable) based on selected column
  const sortedPipettes = useMemo(() => {
    if (!sortColumn) return pipettes;
    const sorted = [...pipettes].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      // Convert to string for generic comparison, numbers stay numbers
      if (typeof aVal === "number" && typeof bVal === "number") {
        return aVal - bVal;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr < bStr) return -1;
      if (aStr > bStr) return 1;
      return 0;
    });
    return sortAsc ? sorted : sorted.reverse();
  }, [pipettes, sortColumn, sortAsc]);

  const handleHeaderClick = (column: keyof PipetteListItem) => {
    if (sortColumn === column) {
      // toggle direction
      setSortAsc(!sortAsc);
    } else {
      setSortColumn(column);
      setSortAsc(true);
    }
  };

  const renderSortIndicator = (column: keyof PipetteListItem) => {
    if (sortColumn !== column) return null;
    return sortAsc ? " \u25B2" : " \u25BC"; // ▲ or ▼
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
      {isLoading && <p>Pipetten werden geladen.</p>}
      {error && <p className="error">{error}</p>}
      {!isLoading && !error && pipettes.length === 0 && <p>Keine Pipetten vorhanden.</p>}
      {sortedPipettes.length > 0 && (
        <table>
          <thead>
            <tr>
              <th onClick={() => handleHeaderClick("register_number")}>Reg.-Nr.{renderSortIndicator("register_number")}</th>
              <th onClick={() => handleHeaderClick("inventory_number")}>Inventar-Nr.{renderSortIndicator("inventory_number")}</th>
              <th>Serien-Nr.</th>
              <th>Bezeichnung</th>
              <th onClick={() => handleHeaderClick("room")}>Raum{renderSortIndicator("room")}</th>
              <th onClick={() => handleHeaderClick("application")}>Anwendung{renderSortIndicator("application")}</th>
              <th onClick={() => handleHeaderClick("status")}>Status{renderSortIndicator("status")}</th>
            </tr>
          </thead>
          <tbody>
            {sortedPipettes.map((pipette) => (
              <tr key={pipette.id}>
                <td>{pipette.register_number}</td>
                <td>{pipette.inventory_number}</td>
                <td>{pipette.serial_number}</td>
                <td>
                  <Link to={`/pipettes/${pipette.id}`}>{pipette.description}</Link>
                </td>
                <td>{pipette.room}</td>
                <td>{pipette.application}</td>
                <td>{pipette.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
