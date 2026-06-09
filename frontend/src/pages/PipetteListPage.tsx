import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getDropdownData } from "../api/dropdowns";
import { getPipettes } from "../api/pipettes";
import type { DropdownData, PipetteListItem, PipettePaginatedResponse } from "../api/types";

export function PipetteListPage(): JSX.Element {
  // Filter states
  const [query, setQuery] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [applicationId, setApplicationId] = useState<string>("");
  const [useId, setUseId] = useState<string>("");
  const [typeId, setTypeId] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  // Pagination
  const limit = 10;
  const [offset, setOffset] = useState<number>(0);

  // Data states
  const [items, setItems] = useState<PipetteListItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Dropdown data
  const [dropdowns, setDropdowns] = useState<DropdownData | null>(null);

  // Load dropdown data once
  useEffect(() => {
    let mounted = true;
    getDropdownData()
      .then((data) => {
        if (mounted) setDropdowns(data);
      })
      .catch(() => {
        // ignore for now
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch pipettes when filters or pagination change
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    const options = {
      q: query || undefined,
      room_id: roomId ? Number(roomId) : undefined,
      application_id: applicationId ? Number(applicationId) : undefined,
      use_id: useId ? Number(useId) : undefined,
      pipette_type_id: typeId ? Number(typeId) : undefined,
      status: status || undefined,
      limit,
      offset,
    };
    getPipettes(options)
      .then((resp: PipettePaginatedResponse) => {
        if (mounted) {
          setItems(resp.items);
          setTotal(resp.total);
          setError(null);
        }
      })
      .catch(() => {
        if (mounted) setError("Pipetten konnten nicht geladen werden.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [query, roomId, applicationId, useId, typeId, status, offset]);

  const resetFilters = () => {
    setQuery("");
    setRoomId("");
    setApplicationId("");
    setUseId("");
    setTypeId("");
    setStatus("");
    setOffset(0);
  };

  const nextPage = () => {
    if (offset + limit < total) {
      setOffset(offset + limit);
    }
  };

  const prevPage = () => {
    if (offset - limit >= 0) {
      setOffset(offset - limit);
    }
  };

  // Whenever any filter changes, reset to first page
  useEffect(() => {
    setOffset(0);
  }, [query, roomId, applicationId, useId, typeId, status]);

  return (
    <section className="page">
      <p className="eyebrow">Uebersicht</p>
      <h2>Pipettenliste</h2>
      <label className="field">
        <span>Suche</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Seriennummer, Inventar-Nr. oder Bezeichnung"
        />
      </label>
      {/* Dropdown filters */}
      {dropdowns && (
        <>
          <label className="field">
            <span>Raum</span>
            <select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
              <option value="">Alle</option>
              {dropdowns.rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Anwendung</span>
            <select value={applicationId} onChange={(e) => setApplicationId(e.target.value)}>
              <option value="">Alle</option>
              {dropdowns.applications.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Verwendung</span>
            <select value={useId} onChange={(e) => setUseId(e.target.value)}>
              <option value="">Alle</option>
              {dropdowns.uses.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Typ</span>
            <select value={typeId} onChange={(e) => setTypeId(e.target.value)}>
              <option value="">Alle</option>
              {dropdowns.pipetteTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Alle</option>
              <option value="active">active</option>
              <option value="maintenance">maintenance</option>
              <option value="retired">retired</option>
            </select>
          </label>
          <button type="button" onClick={resetFilters}>
            Reset
          </button>
        </>
      )}
      {isLoading && <p>Pipetten werden geladen.</p>}
      {error && <p className="error">{error}</p>}
      {!isLoading && !error && items.length === 0 && <p>Keine Pipetten vorhanden.</p>}
      {items.length > 0 && (
        <>
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
              {items.map((pipette) => (
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
          <div className="pagination">
            <button onClick={prevPage} disabled={offset === 0}>
              Vorherige
            </button>
            <span>
              {offset / limit + 1} / {Math.ceil(total / limit)}
            </span>
            <button onClick={nextPage} disabled={offset + limit >= total}>
              Weiter
            </button>
          </div>
        </>
      )}
    </section>
  );
}
