import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";

import { App } from "../src/App";

const pipettes = [
  {
    id: 1,
    register_number: 20,
    inventory_number: "INV-B",
    serial_number: "SER-B",
    description: "Hidden Beta",
    manufacturer: "Hidden",
    model_name: "Beta",
    channel_count: 1,
    nominal_volume_ul: 100,
    calibration_interval_months: 12,
    status: "maintenance",
    room: "Labor 3",
    use: "Pruefung",
    application: "Zellkultur",
    pipette_type: "Luftpolsterpipette",
  },
  {
    id: 2,
    register_number: 10,
    inventory_number: "INV-A",
    serial_number: "SER-A",
    description: "Hidden Alpha",
    manufacturer: "Hidden",
    model_name: "Alpha",
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

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/health")) {
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      }
      if (url.includes("/api/pipettes")) {
        return new Response(JSON.stringify(pipettes), { status: 200 });
      }
      return new Response(JSON.stringify({ detail: "not found" }), { status: 404 });
    }),
  );
});

function rowTexts(): string[] {
  return screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => row.textContent ?? "");
}

test("pipette list can be sorted by table headers in both directions", async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/pipettes"]}>
      <App />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(screen.getByText("Hidden Beta")).toBeInTheDocument();
  });

  const registerHeader = screen.getByRole("button", { name: /reg/i });
  await user.click(registerHeader);
  expect(rowTexts()[0]).toContain("10");
  expect(rowTexts()[0]).toContain("Hidden Alpha");
  expect(registerHeader).toHaveAttribute("aria-sort", "ascending");

  await user.click(registerHeader);
  expect(rowTexts()[0]).toContain("20");
  expect(rowTexts()[0]).toContain("Hidden Beta");
  expect(registerHeader).toHaveAttribute("aria-sort", "descending");

  const roomHeader = screen.getByRole("button", { name: /raum/i });
  await user.click(roomHeader);
  expect(rowTexts()[0]).toContain("Labor 1a");
  expect(roomHeader).toHaveAttribute("aria-sort", "ascending");
});

test("empty and error states remain visible in the worklist", async () => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/health")) {
      return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
    }
    if (url.includes("/api/pipettes")) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    return new Response(JSON.stringify({ detail: "not found" }), { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);

  const { unmount } = render(
    <MemoryRouter initialEntries={["/pipettes"]}>
      <App />
    </MemoryRouter>,
  );

  expect(await screen.findByText(/keine pipetten|keine ergebnisse/i)).toBeInTheDocument();
  unmount();

  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/health")) {
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      }
      return new Response(JSON.stringify({ detail: "boom" }), { status: 500 });
    }),
  );

  render(
    <MemoryRouter initialEntries={["/pipettes"]}>
      <App />
    </MemoryRouter>,
  );

  const main = await screen.findByRole("main");
  expect(within(main).getByText(/konnten nicht geladen|fehler/i)).toBeInTheDocument();
});
