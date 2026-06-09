import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getDropdownData } from "../api/dropdowns";
import { createPipette } from "../api/pipettes";
import type { DropdownData, PipetteCreatePayload } from "../api/types";

const initialForm = {
  manufacturer: "",
  model_name: "",
  inventory_number: "",
  serial_number: "",
  channel_count: "1",
  use_id: "",
  pipette_type_id: "",
  nominal_volume_ul: "",
  calibration_interval_months: "12",
  application_id: "",
  room_id: ""
};

export function PipetteCreatePage(): JSX.Element {
  const navigate = useNavigate();
  const [dropdowns, setDropdowns] = useState<DropdownData | null>(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getDropdownData()
      .then((data) => {
        setDropdowns(data);
        setForm((current) => ({
          ...current,
          use_id: String(data.uses[0]?.id ?? ""),
          pipette_type_id: String(data.pipetteTypes[0]?.id ?? ""),
          application_id: String(data.applications[0]?.id ?? ""),
          room_id: String(data.rooms[0]?.id ?? "")
        }));
      })
      .catch(() => setError("Dropdown-Daten konnten nicht geladen werden."));
  }, []);

  const isReady = useMemo(() => dropdowns !== null, [dropdowns]);

  function updateField(name: keyof typeof form, value: string): void {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const payload: PipetteCreatePayload = {
      manufacturer: form.manufacturer,
      model_name: form.model_name,
      inventory_number: form.inventory_number,
      serial_number: form.serial_number,
      channel_count: Number(form.channel_count),
      use_id: Number(form.use_id),
      pipette_type_id: Number(form.pipette_type_id),
      nominal_volume_ul: Number(form.nominal_volume_ul),
      calibration_interval_months: Number(form.calibration_interval_months) as 6 | 12,
      application_id: Number(form.application_id),
      room_id: Number(form.room_id)
    };

    try {
      const created = await createPipette(payload);
      navigate(`/pipettes/${created.id}`);
    } catch {
      setError("Pipette konnte nicht gespeichert werden.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="page">
      <p className="eyebrow">Erfassung</p>
      <h2>Neue Pipette eintragen</h2>
      {!isReady && !error && <p>Formular wird geladen.</p>}
      {error && <p className="error">{error}</p>}
      {dropdowns && (
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Hersteller</span>
            <input
              required
              value={form.manufacturer}
              onChange={(event) => updateField("manufacturer", event.target.value)}
            />
          </label>
          <label className="field">
            <span>Modell</span>
            <input
              required
              value={form.model_name}
              onChange={(event) => updateField("model_name", event.target.value)}
            />
          </label>
          <label className="field">
            <span>Inventar-Nr.</span>
            <input
              required
              value={form.inventory_number}
              onChange={(event) => updateField("inventory_number", event.target.value)}
            />
          </label>
          <label className="field">
            <span>Serien-Nr.</span>
            <input
              required
              value={form.serial_number}
              onChange={(event) => updateField("serial_number", event.target.value)}
            />
          </label>
          <label className="field">
            <span>Anzahl Kanaele</span>
            <input
              required
              min="1"
              type="number"
              value={form.channel_count}
              onChange={(event) => updateField("channel_count", event.target.value)}
            />
          </label>
          <label className="field">
            <span>Nennvolumen in µL</span>
            <input
              required
              min="0.01"
              step="0.01"
              type="number"
              value={form.nominal_volume_ul}
              onChange={(event) => updateField("nominal_volume_ul", event.target.value)}
            />
          </label>
          <label className="field">
            <span>Kalibrierintervall</span>
            <select
              value={form.calibration_interval_months}
              onChange={(event) => updateField("calibration_interval_months", event.target.value)}
            >
              <option value="6">6 Monate</option>
              <option value="12">12 Monate</option>
            </select>
          </label>
          <label className="field">
            <span>Verwendung</span>
            <select value={form.use_id} onChange={(event) => updateField("use_id", event.target.value)}>
              {dropdowns.uses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Typ</span>
            <select
              value={form.pipette_type_id}
              onChange={(event) => updateField("pipette_type_id", event.target.value)}
            >
              {dropdowns.pipetteTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Anwendung</span>
            <select
              value={form.application_id}
              onChange={(event) => updateField("application_id", event.target.value)}
            >
              {dropdowns.applications.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Raum</span>
            <select value={form.room_id} onChange={(event) => updateField("room_id", event.target.value)}>
              {dropdowns.rooms.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Speichern..." : "Speichern"}
          </button>
        </form>
      )}
    </section>
  );
}
