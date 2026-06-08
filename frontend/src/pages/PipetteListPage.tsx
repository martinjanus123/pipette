import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getPipettes } from "../api/pipettes";
import type { PipetteListItem } from "../api/types";

export function PipetteListPage(): JSX.Element {
  const [query, setQuery] = useState("");
  const [pipettes, setPipettes] = useState<PipetteListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // sorting state
  const [sortKey, setSortKey] = useState<keyof PipetteListItem | null>(null);
  const [ascending, setAscending] = useState(true);

  const handleHeaderClick = (key: keyof PipetteListItem) => {
    if (sortKey === key) {
      setAscending(!ascending);
    } else {
      setSortKey(key);
      setAscending(true);
    }
  };

  // sort helper – returns a new sorted array without mutating original state
  const getSortedPipettes = (): PipetteListItem[] => {
    if (!sortKey) return pipettes;
    const sorted = [...pipettes].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      // Numbers are compared arithmetically, everything else lexicographically
      if (typeof aVal === "number" && typeof bVal === "number") {
        return aVal - bVal;
      }
      const aStr = aVal?.toString().toLowerCase() ?? "";
      const bStr = bVal?.toString().toLowerCase() ?? "";
      return aStr.localeCompare(bStr);
    });
    return ascending ? sorted : sorted.reverse();
  };

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

  const displayedPipettes = getSortedPipettes();

  // helper to render ARIA sort attribute for button headers
  const ariaSort = (key: keyof PipetteListItem) => {
    if (sortKey !== key) return undefined;
    return ascending ? "ascending" : "descending";
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
      {!isLoading && !error && displayedPipettes.length === 0 && (
        <p>Keine Pipetten vorhanden.</p>
      )}
      {displayedPipettes.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>
                <button
                  type="button"
                  onClick={() => handleHeaderClick("register_number")}
                  aria-sort={ariaSort("register_number")}
                >
                  Reg.-Nr.
                </button>
              </th>
              <th>
                <button
                  type="button"
                  onClick={() => handleHeaderClick("inventory_number")}
                  aria-sort={ariaSort("inventory_number")}
                >
                  Inventar-Nr.
                </button>
              </th>
              <th>Serien-Nr.</th>
              <th>
                <button
                  type="button"
                  onClick={() => handleHeaderClick("description")}
                  aria-sort={ariaSort("description")}
                >
                  Bezeichnung
                </button>
              </th>
              <th>
                <button
                  type="button"
                  onClick={() => handleHeaderClick("room")}
                  aria-sort={ariaSort("room")}
                >
                  Raum
                </button>
              </th>
              <th>
                <button
                  type="button"
                  onClick={() => handleHeaderClick("application")}
                  aria-sort={ariaSort("application")}
                >
                  Anwendung
                </button>
              </th>
              <th>
                <button
                  type="button"
                  onClick={() => handleHeaderClick("status")}
                  aria-sort={ariaSort("status")}
                >
                  Status
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedPipettes.map((pipette) => (
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
