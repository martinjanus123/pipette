import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";

import { App } from "../src/App";

const rooms = [
  { id: 1, name: "Labor 1a", is_active: true },
  { id: 2, name: "Labor 3", is_active: true },
];
const applications = [{ id: 10, name: "PCR", is_active: true }];
const uses = [{ id: 20, name: "FuE", is_active: true }];
const pipetteTypes = [{ id: 30, name: "Luftpolsterpipette", is_active: true }];
const page = {
  items: [
    {
      id: 1,
      register_number: 1,
      inventory_number: "PAGE-UI-1",
      serial_number: "PAGE-UI-SN-1",
      description: "Hidden Paged Result",
      manufacturer: "Hidden",
      model_name: "Paged",
      channel_count: 1,
      nominal_volume_ul: 100,
      calibration_interval_months: 12,
      status: "active",
      room: "Labor 1a",
      use: "FuE",
      application: "PCR",
      pipette_type: "Luftpolsterpipette",
    },
  ],
  total: 26,
  limit: 10,
  offset: 0,
};

let pipetteUrls: string[];

beforeEach(() => {
  pipetteUrls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/health")) {
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      }
      if (url.endsWith("/api/rooms")) {
        return new Response(JSON.stringify(rooms), { status: 200 });
      }
      if (url.endsWith("/api/applications")) {
        return new Response(JSON.stringify(applications), { status: 200 });
      }
      if (url.endsWith("/api/uses")) {
        return new Response(JSON.stringify(uses), { status: 200 });
      }
      if (url.endsWith("/api/pipette-types")) {
        return new Response(JSON.stringify(pipetteTypes), { status: 200 });
      }
      if (url.includes("/api/pipettes")) {
        pipetteUrls.push(url);
        return new Response(JSON.stringify(page), { status: 200 });
      }
      return new Response(JSON.stringify({ detail: "not found" }), { status: 404 });
    }),
  );
});

test("worklist sends filters and pagination to the backend", async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/pipettes"]}>
      <App />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(screen.getByText("Hidden Paged Result")).toBeInTheDocument();
  });
  expect(screen.getByText(/26/)).toBeInTheDocument();

  await user.type(screen.getByLabelText(/suche/i), "PAGE-UI");
  await user.selectOptions(screen.getByLabelText(/raum/i), "1");
  await user.selectOptions(screen.getByLabelText(/anwendung/i), "10");
  await user.selectOptions(screen.getByLabelText(/verwendung/i), "20");
  await user.selectOptions(screen.getByLabelText(/typ/i), "30");
  await user.selectOptions(screen.getByLabelText(/status/i), "active");

  await waitFor(() => {
    const latest = pipetteUrls.at(-1) ?? "";
    expect(latest).toContain("q=PAGE-UI");
    expect(latest).toContain("room_id=1");
    expect(latest).toContain("application_id=10");
    expect(latest).toContain("use_id=20");
    expect(latest).toContain("pipette_type_id=30");
    expect(latest).toContain("status=active");
    expect(latest).toContain("limit=");
    expect(latest).toContain("offset=");
  });

  await user.click(screen.getByRole("button", { name: /weiter|naechste|nächste/i }));

  await waitFor(() => {
    expect(pipetteUrls.at(-1) ?? "").toMatch(/offset=(10|20)/);
  });
});

test("reset clears server-side filters instead of client filtering", async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/pipettes"]}>
      <App />
    </MemoryRouter>,
  );

  await screen.findByText("Hidden Paged Result");
  await user.type(screen.getByLabelText(/suche/i), "PAGE-UI");
  await user.click(screen.getByRole("button", { name: /zuruecksetzen|zurücksetzen|reset/i }));

  await waitFor(() => {
    const latest = pipetteUrls.at(-1) ?? "";
    expect(latest).not.toContain("q=");
    expect(latest).not.toContain("room_id=");
    expect(latest).not.toContain("application_id=");
    expect(latest).not.toContain("status=");
  });
});
