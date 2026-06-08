import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getPipettes, bulkMovePipettes } from "../api/pipettes";
import { getDropdownData } from "../api/dropdowns";
import type { PipetteListItem, ReferenceItem, BulkRoomMoveRequest } from "../api/types";

export function PipetteListPage(): JSX.Element {
  const [query, setQuery] = useState("");
  const [pipettes, setPipettes] = useState<PipetteListItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [rooms, setRooms] = useState<ReferenceItem[]>([]);
  const [targetRoomId, setTargetRoomId] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load pipettes list
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

  // Load reference rooms for dialog
  useEffect(() => {
    getDropdownData()
      .then((data) => setRooms(data.rooms))
      .catch(() => setRooms([]));
  }, []);

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const openDialog = () => {
    if (selectedIds.size === 0) return;
    setDialogError(null);
    setTargetRoomId("");
    setNotes("");
    setCreatedBy("");
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
  };

  const handleBulkMove = async () => {
    if (targetRoomId === "" || createdBy.trim() === "") {
      setDialogError("Bitte Zielraum und Benutzer angeben.");
      return;
    }
    const payload: BulkRoomMoveRequest = {
      pipette_ids: Array.from(selectedIds),
      target_room_id: Number(targetRoomId),
      notes: notes || undefined,
      created_by: createdBy,
    };
    try {
      await bulkMovePipettes(payload);
      setSuccessMessage("Pipetten erfolgreich verlegt.");
      setSelectedIds(new Set());
      // refresh list
      const refreshed = await getPipettes(query);
      setPipettes(refreshed);
      closeDialog();
    } catch (e) {
      setDialogError("Verlegen fehlgeschlagen.");
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
      {successMessage && <p className="success">{successMessage}</p>}
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
                      checked={selectedIds.has(pipette.id)}
                      onChange={() => toggleSelect(pipette.id)}
                      aria-label={`${pipette.inventory_number} ${pipette.description}`}
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
          <h3>Verlegen</h3>
          {dialogError && <p className="error">{dialogError}</p>}
          <label>
            Zielraum
            <select
              value={targetRoomId}
              onChange={(e) => setTargetRoomId(Number(e.target.value) || "")}
            >
              <option value="">--Bitte wählen--</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Notiz
            <input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <label>
            Benutzer
            <input value={createdBy} onChange={(e) => setCreatedBy(e.target.value)} />
          </label>
          <button onClick={handleBulkMove}>Speichern</button>
          <button onClick={closeDialog}>Abbrechen</button>
        </div>
      )}
    </section>
  );
}
