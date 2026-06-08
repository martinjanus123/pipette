import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";

import { App } from "../src/App";

const detail = {
  id: 42,
  register_number: 7,
  inventory_number: "INV-HIDDEN-42",
  serial_number: "SER-HIDDEN-42",
  description: "HiddenTest Research Detail",
  manufacturer: "Hidden Hersteller",
  model_name: "Hidden Modell",
  channel_count: 12,
  nominal_volume_ul: 100,
  calibration_interval_months: 6,
  status: "active",
  room: "Labor 1a",
  use: "FuE",
  application: "PCR-Platz",
  pipette_type: "Luftpolsterpipette",
};

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/health")) {
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      }
      if (url.includes("/api/pipettes/42")) {
        return new Response(JSON.stringify(detail), { status: 200 });
      }
      return new Response(JSON.stringify({ detail: "not found" }), { status: 404 });
    }),
  );
});

test("detail page renders existing technical fields from the API response", async () => {
  render(
    <MemoryRouter initialEntries={["/pipettes/42"]}>
      <App />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(screen.getByText("HiddenTest Research Detail")).toBeInTheDocument();
  });

  expect(screen.getByText("Hidden Hersteller")).toBeInTheDocument();
  expect(screen.getByText("Hidden Modell")).toBeInTheDocument();
  expect(screen.getByText(/100/)).toBeInTheDocument();
  expect(screen.getByText("12")).toBeInTheDocument();
  expect(screen.getByText(/6/)).toBeInTheDocument();
  expect(screen.getByText("Luftpolsterpipette")).toBeInTheDocument();
  expect(screen.getByText("INV-HIDDEN-42")).toBeInTheDocument();
  expect(screen.getByText("SER-HIDDEN-42")).toBeInTheDocument();
});
