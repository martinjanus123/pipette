import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";

import { App } from "../src/App";

const pipettes = [
  {
    id: 1,
    register_number: 1,
    inventory_number: "INV-1",
    serial_number: "SER-1",
    description: "Hidden Alpha",
    manufacturer: "Hidden",
    model_name: "Alpha",
    channel_count: 1,
    nominal_volume_ul: 100,
    calibration_interval_months: 12,
    status: "active",
    room: "Labor 1a",
    use: "FuE",
    application: "PCR-Platz",
    pipette_type: "Luftpolsterpipette",
  },
  {
    id: 2,
    register_number: 2,
    inventory_number: "INV-2",
    serial_number: "SER-2",
    description: "Hidden Beta",
    manufacturer: "Hidden",
    model_name: "Beta",
    channel_count: 1,
    nominal_volume_ul: 100,
    calibration_interval_months: 12,
    status: "active",
    room: "Labor 1b",
    use: "Pruefung",
    application: "HPLC",
    pipette_type: "Luftpolsterpipette",
  },
];

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
      if (url.includes("/api/pipettes")) {
        pipetteUrls.push(url);
        return new Response(JSON.stringify(pipettes), { status: 200 });
      }
      return new Response(JSON.stringify({ detail: "not found" }), { status: 404 });
    }),
  );
});

test("list shows result count and search reset reloads without q", async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/pipettes"]}>
      <App />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(screen.getByText("Hidden Alpha")).toBeInTheDocument();
  });

  expect(
    screen.getByText(/(2.*(Pipetten|Ergebnisse|Treffer)|(Pipetten|Ergebnisse|Treffer).*2)/i),
  ).toBeInTheDocument();

  expect(
    screen.queryByRole("button", { name: /zuruecksetzen|zurücksetzen|reset|leeren/i }),
  ).not.toBeInTheDocument();

  await user.type(screen.getByLabelText(/suche/i), "SER-1");

  const resetButton = await screen.findByRole("button", {
    name: /zuruecksetzen|zurücksetzen|reset|leeren/i,
  });
  expect(resetButton).toBeInTheDocument();

  await user.click(resetButton);

  await waitFor(() => {
    expect(screen.getByLabelText(/suche/i)).toHaveValue("");
  });

  await waitFor(() => {
    expect(pipetteUrls.at(-1)).not.toContain("q=");
  });
});
