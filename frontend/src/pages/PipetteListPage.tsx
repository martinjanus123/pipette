import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getPipettes, bulkRoomMove } from "../api/pipettes";
import { getDropdownData } from "../api/dropdowns";
import type { PipetteListItem, ReferenceItem } from "../api/types";

export function PipetteListPage(): JSX.Element {
  const [query, setQuery] = useState("");
  const [pipettes, setPipettes] = useState<PipetteListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showDialog, setShowDialog] = useState(false);
  const [rooms, setRooms] = useState<ReferenceItem[]>([]);
  const [targetRoom, setTargetRoom] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  // load pipettes
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

  // load rooms for bulk move dialog
  useEffect(() => {
    getDropdownData()
      .then((data) => setRooms(data.rooms))
      .catch(() => setRooms([]));
  }, []);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) {
        copy.delete(id);
      } else {
        copy.add(id);
      }
      return copy;
    });
  };

  const openDialog = () => {
    if (selectedIds.size > 0) {
      setShowDialog(true);
    }
  };

  const closeDialog = () => {
    setShowDialog(false);
    setTargetRoom("");
    setNotes("");
    setCreatedBy("");
  };

  const handleBulkMove = async () => {
    if (!targetRoom) return;
    try {
      const payload = {
        pipette_ids: Array.from(selectedIds),
        target_room_id: Number(targetRoom),
        notes: notes || undefined,
        created_by: createdBy,
      };
      await bulkRoomMove(payload);
      setMessage("Pipetten erfolgreich verlegt.");
      // refresh list
      const refreshed = await getPipettes(query);
      setPipettes(refreshed);
      setSelectedIds(new Set());
      closeDialog();
    } catch (e) {
      setMessage("Fehler beim Verlegen der Pipetten.");
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
      {isLoading && <p>Pipetten werden geladen.</p>}
      {error && <p className="error">{error}</p>}
      {message && <p>{message}</p>}
      {!isLoading && !error && pipettes.length === 0 && <p>Keine Pipetten vorhanden.</p>}
      {pipettes.length > 0 && (
        <>
          <button onClick={openDialog} disabled={selectedIds.size === 0}>
            Verlegen
          </button>
          <table>
            <thead>
              <tr>
                <th></th>
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
                      checked={selectedIds.has(pipette.id)}
                      onChange={() => toggleSelect(pipette.id)}
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
        <div className="modal">
          <h3>Pipetten verlegen</h3>
          <label className="field">
            <span>Zielraum</span>
            <select
              aria-label="Zielraum"
              value={targetRoom}
              onChange={(e) => setTargetRoom(Number(e.target.value) || "")}
            >
              <option value="">-- bitte wählen --</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Notiz</span>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <label className="field">
            <span>Benutzer</span>
            <input value={createdBy} onChange={(e) => setCreatedBy(e.target.value)} />
          </label>
          <button onClick={handleBulkMove}>Verlegen</button>
          <button onClick={closeDialog}>Abbrechen</button>
        </div>
      )}
    </section>
  );
}
