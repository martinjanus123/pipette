import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";

import { getPipettes } from "../api/pipettes";
import type { PipetteListItem } from "../api/types";

export function PipetteListPage(): JSX.Element {
  const [query, setQuery] = useState("");
  const [pipettes, setPipettes] = useState<PipetteListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const toggleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedPipettes = useMemo(() => {
    if (!sortColumn) return pipettes;
    const sorted = [...pipettes];
    sorted.sort((a, b) => {
      const aVal: any = (a as any)[sortColumn];
      const bVal: any = (b as any)[sortColumn];
      // numeric compare for register_number, otherwise string compare
      if (sortColumn === "register_number") {
        return aVal - bVal;
      }
      // ensure strings for localeCompare
      const aStr = aVal?.toString() ?? "";
      const bStr = bVal?.toString() ?? "";
      return aStr.localeCompare(bStr);
    });
    return sortDirection === "asc" ? sorted : sorted.reverse();
  }, [pipettes, sortColumn, sortDirection]);

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
              {/* Sortable columns */}
              <th aria-sort={sortColumn === "register_number" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>
                <button type="button" onClick={() => toggleSort("register_number")}>Reg.-Nr.{sortColumn === "register_number" && (sortDirection === "asc" ? " ▲" : " ▼")}</button>
              </th>
              <th aria-sort={sortColumn === "inventory_number" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>
                <button type="button" onClick={() => toggleSort("inventory_number")}>Inventar-Nr.{sortColumn === "inventory_number" && (sortDirection === "asc" ? " ▲" : " ▼")}</button>
              </th>
              <th>Serien-Nr.</th>
              <th>Bezeichnung</th>
              <th aria-sort={sortColumn === "room" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>
                <button type="button" onClick={() => toggleSort("room")}>Raum{sortColumn === "room" && (sortDirection === "asc" ? " ▲" : " ▼")}</button>
              </th>
              <th aria-sort={sortColumn === "application" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>
                <button type="button" onClick={() => toggleSort("application")}>Anwendung{sortColumn === "application" && (sortDirection === "asc" ? " ▲" : " ▼")}</button>
              </th>
              <th aria-sort={sortColumn === "status" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>
                <button type="button" onClick={() => toggleSort("status")}>Status{sortColumn === "status" && (sortDirection === "asc" ? " ▲" : " ▼")}</button>
              </th>
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
