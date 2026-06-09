import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getPipettes } from "../api/pipettes";
import type { PipetteListItem } from "../api/types";

export function PipetteListPage(): JSX.Element {
  const [query, setQuery] = useState("");
  const [pipettes, setPipettes] = useState<PipetteListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // sorting state: key and direction
  const [sortKey, setSortKey] = useState<keyof PipetteListItem | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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

  // handle sorting when user clicks a header
  const handleSort = (key: keyof PipetteListItem) => {
    if (sortKey === key) {
      // toggle direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  // compute sorted list (do not mutate original state)
  const sortedPipettes = (() => {
    if (!sortKey) return pipettes;
    const sorted = [...pipettes];
    sorted.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      // numeric comparison for register_number, otherwise string comparison
      if (typeof aVal === "number" && typeof bVal === "number") {
        return aVal - bVal;
      }
      return String(aVal).localeCompare(String(bVal));
    });
    return sortDirection === "asc" ? sorted : sorted.reverse();
  })();

  // Helper to render header with button and aria-sort attribute
  const renderHeader = (label: string, key: keyof PipetteListItem) => (
    <th>
      <button
        type="button"
        onClick={() => handleSort(key)}
        aria-sort={sortKey === key ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}
        style={{ all: "unset", cursor: "pointer" }}
      >
        {label}
        {sortKey === key && (
          <span aria-hidden="true" style={{ marginLeft: "4px" }}>
            {sortDirection === "asc" ? "▲" : "▼"}
          </span>
        )}
      </button>
    </th>
  );

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
      {pipettes.length > 0 && (
        <table>
          <thead>
            <tr>
              {renderHeader("Reg.-Nr.", "register_number")}
              {renderHeader("Inventar-Nr.", "inventory_number")}
              <th>Serien-Nr.</th>
              <th>Bezeichnung</th>
              {renderHeader("Raum", "room")}
              {renderHeader("Anwendung", "application")}
              {renderHeader("Status", "status")}
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
