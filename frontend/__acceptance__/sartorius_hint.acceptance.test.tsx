import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";

import { App } from "../src/App";

const relevant = {
  id: 25,
  register_number: 25,
  inventory_number: "SART-25",
  serial_number: "SART-SN-25",
  description: "Hidden Relevant 25 µL",
  manufacturer: "Hidden",
  model_name: "LowVolume",
  channel_count: 1,
  nominal_volume_ul: 25,
  calibration_interval_months: 12,
  status: "active",
  room: "Labor 1a",
  use: "FuE",
  application: "PCR-Platz",
  pipette_type: "Luftpolsterpipette",
  requires_sartorius: true,
};

const normal = {
  ...relevant,
  id: 100,
  register_number: 100,
  inventory_number: "SART-100",
  serial_number: "SART-SN-100",
  description: "Hidden Normal 100 µL",
  nominal_volume_ul: 100,
  requires_sartorius: false,
};

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/health")) {
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      }
      if (url.includes("/api/pipettes/25")) {
        return new Response(JSON.stringify(relevant), { status: 200 });
      }
      if (url.includes("/api/pipettes/100")) {
        return new Response(JSON.stringify(normal), { status: 200 });
      }
      if (url.includes("/api/pipettes")) {
        return new Response(JSON.stringify([relevant, normal]), { status: 200 });
      }
      return new Response(JSON.stringify({ detail: "not found" }), { status: 404 });
    }),
  );
});

test("list shows a Sartorius hint when API marks a pipette as relevant", async () => {
  render(
    <MemoryRouter initialEntries={["/pipettes"]}>
      <App />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(screen.getByText("Hidden Relevant 25 µL")).toBeInTheDocument();
  });

  expect(screen.getByText(/Sartorius/i)).toBeInTheDocument();
});

test("detail page only shows Sartorius hint for API value true", async () => {
  const { unmount } = render(
    <MemoryRouter initialEntries={["/pipettes/25"]}>
      <App />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(screen.getByText("Hidden Relevant 25 µL")).toBeInTheDocument();
  });
  expect(screen.getByText(/Sartorius/i)).toBeInTheDocument();

  unmount();

  render(
    <MemoryRouter initialEntries={["/pipettes/100"]}>
      <App />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(screen.getByText("Hidden Normal 100 µL")).toBeInTheDocument();
  });
  expect(screen.queryByText(/Sartorius/i)).not.toBeInTheDocument();
});
