import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";

import { App } from "../src/App";

const rooms = [
  { id: 1, name: "Labor 1a", is_active: true },
  { id: 2, name: "Labor 3", is_active: true },
];
const pipettes = [
  {
    id: 11,
    register_number: 11,
    inventory_number: "MOVE-UI-A",
    serial_number: "MOVE-UI-SN-A",
    description: "Hidden Move A",
    manufacturer: "Hidden",
    model_name: "Move",
    channel_count: 1,
    nominal_volume_ul: 100,
    calibration_interval_months: 12,
    status: "active",
    room: "Labor 1a",
    use: "FuE",
    application: "PCR",
    pipette_type: "Luftpolsterpipette",
  },
  {
    id: 12,
    register_number: 12,
    inventory_number: "MOVE-UI-B",
    serial_number: "MOVE-UI-SN-B",
    description: "Hidden Move B",
    manufacturer: "Hidden",
    model_name: "Move",
    channel_count: 1,
    nominal_volume_ul: 100,
    calibration_interval_months: 12,
    status: "active",
    room: "Labor 1a",
    use: "FuE",
    application: "PCR",
    pipette_type: "Luftpolsterpipette",
  },
];

let moveBody: unknown;
let listRequests = 0;

beforeEach(() => {
  moveBody = undefined;
  listRequests = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      if (url.includes("/api/health")) {
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      }
      if (url.endsWith("/api/rooms")) {
        return new Response(JSON.stringify(rooms), { status: 200 });
      }
      if (url.includes("/api/pipettes/bulk-room-move") && method === "POST") {
        moveBody = JSON.parse(String(init?.body));
        return new Response(JSON.stringify({ moved_ids: [11, 12] }), { status: 200 });
      }
      if (url.includes("/api/pipettes")) {
        listRequests += 1;
        return new Response(JSON.stringify(pipettes), { status: 200 });
      }
      return new Response(JSON.stringify({ detail: "not found" }), { status: 404 });
    }),
  );
});

test("selected pipettes can be moved to another room in one request", async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/pipettes"]}>
      <App />
    </MemoryRouter>,
  );

  await screen.findByText("Hidden Move A");
  await user.click(screen.getByRole("checkbox", { name: /MOVE-UI-A|Hidden Move A/i }));
  await user.click(screen.getByRole("checkbox", { name: /MOVE-UI-B|Hidden Move B/i }));
  await user.click(screen.getByRole("button", { name: /verlegen|verschieben|raum/i }));
  await user.selectOptions(screen.getByLabelText(/zielraum|raum/i), "2");
  await user.type(screen.getByLabelText(/notiz|notes/i), "Hidden bulk move");
  await user.type(screen.getByLabelText(/benutzer|user/i), "hidden-mover");
  await user.click(screen.getByRole("button", { name: /verlegen|verschieben|speichern/i }));

  await waitFor(() => {
    expect(moveBody).toMatchObject({
      pipette_ids: [11, 12],
      target_room_id: 2,
      notes: "Hidden bulk move",
      created_by: "hidden-mover",
    });
  });
  await waitFor(() => {
    expect(listRequests).toBeGreaterThanOrEqual(2);
  });
  expect(screen.getByText(/erfolgreich|verschoben|verlegt/i)).toBeInTheDocument();
});
