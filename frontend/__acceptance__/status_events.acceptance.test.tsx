import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";

import { App } from "../src/App";

const detail = {
  id: 77,
  register_number: 77,
  inventory_number: "STATUS-UI-1",
  serial_number: "STATUS-UI-SN-1",
  description: "Hidden Status UI",
  manufacturer: "Hidden",
  model_name: "Status",
  channel_count: 1,
  nominal_volume_ul: 100,
  calibration_interval_months: 12,
  status: "active",
  room: "Labor 1a",
  use: "FuE",
  application: "PCR",
  pipette_type: "Luftpolsterpipette",
  events: [
    {
      id: 1,
      event_type: "created",
      event_date: "2026-05-01T10:00:00Z",
      old_value: null,
      new_value: "Hidden Status UI",
      notes: "Created",
      created_by: "system",
    },
  ],
};

let patchBody: unknown;
let detailRequests = 0;

beforeEach(() => {
  patchBody = undefined;
  detailRequests = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      if (url.includes("/api/health")) {
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      }
      if (url.includes("/api/pipettes/77/status") && method === "PATCH") {
        patchBody = JSON.parse(String(init?.body));
        return new Response(JSON.stringify({ ...detail, status: "maintenance" }), { status: 200 });
      }
      if (url.includes("/api/pipettes/77")) {
        detailRequests += 1;
        return new Response(JSON.stringify(detail), { status: 200 });
      }
      return new Response(JSON.stringify({ detail: "not found" }), { status: 404 });
    }),
  );
});

test("detail page can submit a status change and displays event history", async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/pipettes/77"]}>
      <App />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(screen.getByText("Hidden Status UI")).toBeInTheDocument();
  });
  expect(screen.getByText(/created/i)).toBeInTheDocument();

  await user.selectOptions(screen.getByLabelText(/status/i), "maintenance");
  await user.type(screen.getByLabelText(/notiz|notes/i), "Hidden maintenance note");
  await user.type(screen.getByLabelText(/benutzer|user|erstellt/i), "hidden-user");
  await user.click(screen.getByRole("button", { name: /status.*speichern|status.*aendern|status.*ändern/i }));

  await waitFor(() => {
    expect(patchBody).toMatchObject({
      status: "maintenance",
      notes: "Hidden maintenance note",
      created_by: "hidden-user",
    });
  });
  await waitFor(() => {
    expect(detailRequests).toBeGreaterThanOrEqual(2);
  });
});
