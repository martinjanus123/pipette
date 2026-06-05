import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getPipettes, bulkMovePipettes } from "../api/pipettes";
import { getDropdownData } from "../api/dropdowns";
import type { PipetteListItem, ReferenceItem, BulkMovePayload } from "../api/types";

export function PipetteListPage(): JSX.Element {
  const [query, setQuery] = useState("");
  const [pipettes, setPipettes] = useState<PipetteListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [rooms, setRooms] = useState<ReferenceItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [targetRoomId, setTargetRoomId] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState<string>("");
  const [movedBy, setMovedBy] = useState<string>("");
  const [moveError, setMoveError] = useState<string | null>(null);

  // Load pipettes
  const loadPipettes = () => {
    setIsLoading(true);
    getPipettes(query)
      .then((items) => {
        setPipettes(items);
        setError(null);
      })
      .catch(() => {
        setError("Pipetten konnten nicht geladen werden.");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadPipettes();
  }, [query]);

  // Load dropdown data for rooms (once)
  useEffect(() => {
    getDropdownData()
      .then((data) => setRooms(data.rooms))
      .catch(() => setRooms([]));
  }, []);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openMoveDialog = () => {
    setDialogOpen(true);
    setTargetRoomId(undefined);
    setNotes("");
    setMovedBy("");
    setMoveError(null);
  };

  const closeMoveDialog = () => {
    setDialogOpen(false);
  };

  const handleMove = async () => {
    if (!targetRoomId) {
      setMoveError("Bitte Zielraum auswählen.");
      return;
    }
    if (!movedBy) {
      setMoveError("Bitte Benutzer angeben.");
      return;
    }
    const payload: BulkMovePayload = {
      pipette_ids: Array.from(selectedIds),
      target_room_id: targetRoomId,
      notes: notes || undefined,
      moved_by: movedBy,
    };
    try {
      await bulkMovePipettes(payload);
      closeMoveDialog();
      setSelectedIds(new Set());
      loadPipettes();
    } catch (e) {
      setMoveError("Verlegung fehlgeschlagen.");
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
      {selectedIds.size > 0 && (
        <button onClick={openMoveDialog}>Ausgewählte verlegen</button>
      )}
      {isLoading && <p>Pipetten werden geladen.</p>}
      {error && <p className="error">{error}</p>}
      {!isLoading && !error && pipettes.length === 0 && <p>Keine Pipetten vorhanden.</p>}
      {pipettes.length > 0 && (
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
      )}
      {dialogOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Verlegung von {selectedIds.size} Pipette(n)</h3>
            {moveError && <p className="error">{moveError}</p>}
            <label className="field">
              <span>Zielraum</span>
              <select
                value={targetRoomId ?? ""}
                onChange={(e) => setTargetRoomId(Number(e.target.value))}
              >
                <option value="" disabled>Bitte auswählen</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Notizen (optional)</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <label className="field">
              <span>Benutzer</span>
              <input value={movedBy} onChange={(e) => setMovedBy(e.target.value)} />
            </label>
            <button onClick={handleMove}>Verlegen</button>
            <button onClick={closeMoveDialog}>Abbrechen</button>
          </div>
        </div>
      )}
    </section>
  );
}
