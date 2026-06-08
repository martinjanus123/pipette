import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";

import { App } from "../src/App";

const detail = {
  id: 88,
  register_number: 88,
  inventory_number: "TIMELINE-UI",
  serial_number: "TIMELINE-UI-SN",
  description: "Hidden Timeline UI",
  manufacturer: "Hidden",
  model_name: "Timeline",
  channel_count: 1,
  nominal_volume_ul: 100,
  calibration_interval_months: 12,
  status: "active",
  room: "Labor 1a",
  use: "FuE",
  application: "PCR",
  pipette_type: "Luftpolsterpipette",
};

const timeline = [
  {
    type: "event",
    date: "2026-06-01T12:00:00Z",
    title: "Raum verlegt",
    detail: "Von Labor 1a nach Labor 3",
    source: "pipette_event",
  },
  {
    type: "calibration",
    date: "2026-05-20",
    title: "Kalibrierung bestanden",
    detail: "Zertifikat TIMELINE-CERT",
    source: "calibration",
  },
];

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/health")) {
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      }
      if (url.includes("/api/pipettes/88/timeline")) {
        return new Response(JSON.stringify(timeline), { status: 200 });
      }
      if (url.includes("/api/pipettes/88")) {
        return new Response(JSON.stringify(detail), { status: 200 });
      }
      return new Response(JSON.stringify({ detail: "not found" }), { status: 404 });
    }),
  );
});

test("detail page renders timeline entries and filters them by type", async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/pipettes/88"]}>
      <App />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(screen.getByText("Hidden Timeline UI")).toBeInTheDocument();
  });
  expect(screen.getByText("Raum verlegt")).toBeInTheDocument();
  expect(screen.getByText("Kalibrierung bestanden")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /ereignisse/i }));
  expect(screen.getByText("Raum verlegt")).toBeInTheDocument();
  expect(screen.queryByText("Kalibrierung bestanden")).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /kalibrier/i }));
  expect(screen.queryByText("Raum verlegt")).not.toBeInTheDocument();
  expect(screen.getByText("Kalibrierung bestanden")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /alle/i }));
  expect(screen.getByText("Raum verlegt")).toBeInTheDocument();
  expect(screen.getByText("Kalibrierung bestanden")).toBeInTheDocument();
});
