import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getPipettes, bulkRoomMove } from "../api/pipettes";
import { getDropdownData } from "../api/dropdowns";
import type { PipetteListItem, DropdownData, BulkRoomMovePayload } from "../api/types";

export function PipetteListPage(): JSX.Element {
  const [query, setQuery] = useState("");
  const [pipettes, setPipettes] = useState<PipetteListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection & dialog state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [rooms, setRooms] = useState<DropdownData["rooms"]>([]);
  const [targetRoomId, setTargetRoomId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [createdBy, setCreatedBy] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  // Load pipettes (refresh on query or after a move)
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

  // Load rooms for the dialog once
  useEffect(() => {
    getDropdownData()
      .then((data) => {
        setRooms(data.rooms);
        if (data.rooms.length > 0) {
          setTargetRoomId(String(data.rooms[0].id));
        }
      })
      .catch(() => {
        // ignore for now – dialog will show empty dropdown
      });
  }, []);

  function toggleSelect(id: number, checked: boolean): void {
    setSelectedIds((prev) => {
      if (checked) {
        return [...prev, id];
      }
      return prev.filter((pid) => pid !== id);
    });
  }

  async function handleBulkMove(event: React.FormEvent) {
    event.preventDefault();
    const payload: BulkRoomMovePayload = {
      pipette_ids: selectedIds,
      target_room_id: Number(targetRoomId),
      notes: notes || undefined,
      created_by: createdBy || undefined,
    };
    try {
      await bulkRoomMove(payload);
      setMessage("Pipetten erfolgreich verlegt.");
      setSelectedIds([]);
      setShowDialog(false);
      // refresh list
      getPipettes(query).then(setPipettes);
    } catch {
      setError("Pipetten konnten nicht verlegt werden.");
    }
  }

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
      {message && <p>{message}</p>}
      {!isLoading && !error && pipettes.length === 0 && <p>Keine Pipetten vorhanden.</p>}
      {pipettes.length > 0 && (
        <>
          <button
            type="button"
            disabled={selectedIds.length === 0}
            onClick={() => setShowDialog(true)}
          >
            Pipetten verlegen
          </button>
          <table>
            <thead>
              <tr>
                <th>Auswahl</th>
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
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`${pipette.inventory_number} ${pipette.description}`}
                      checked={selectedIds.includes(pipette.id)}
                      onChange={(e) => toggleSelect(pipette.id, e.target.checked)}
                    />
                  </td>
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
        </>
      )}

      {showDialog && (
        <div className="modal" role="dialog" aria-modal="true">
          <form onSubmit={handleBulkMove}>
            <label className="field">
              <span>Zielraum</span>
              <select
                value={targetRoomId}
                onChange={(e) => setTargetRoomId(e.target.value)}
                required
              >
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Notiz</span>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Benutzer</span>
              <input
                type="text"
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
              />
            </label>
            <button type="submit">Verlegen</button>
            <button type="button" onClick={() => setShowDialog(false)}>
              Abbrechen
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
