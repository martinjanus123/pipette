import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";

import { App } from "../src/App";

const detail = {
  id: 42,
  register_number: 42,
  inventory_number: "CAL-HIST-UI",
  serial_number: "CAL-HIST-UI-SN",
  description: "Hidden Calibration UI",
  manufacturer: "Hidden",
  model_name: "Calibration",
  channel_count: 1,
  nominal_volume_ul: 100,
  calibration_interval_months: 12,
  status: "active",
  room: "Labor 1a",
  use: "FuE",
  application: "PCR",
  pipette_type: "Luftpolsterpipette",
  calibrations: [
    {
      id: 7,
      calibration_date: "2026-05-20",
      next_due_date: "2027-05-20",
      result: "passed",
      performed_by: "Hidden Technician",
      certificate_reference: "CERT-HIDDEN-UI",
      notes: "Already imported",
    },
  ],
};

let postBody: unknown;
let detailRequests = 0;

beforeEach(() => {
  postBody = undefined;
  detailRequests = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      if (url.includes("/api/health")) {
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      }
      if (url.includes("/api/pipettes/42/calibrations") && method === "POST") {
        postBody = JSON.parse(String(init?.body));
        return new Response(JSON.stringify({ id: 99, ...(postBody as object) }), { status: 201 });
      }
      if (url.includes("/api/pipettes/42")) {
        detailRequests += 1;
        return new Response(JSON.stringify(detail), { status: 200 });
      }
      return new Response(JSON.stringify({ detail: "not found" }), { status: 404 });
    }),
  );
});

test("detail page shows calibration history and posts new calibrations", async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/pipettes/42"]}>
      <App />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(screen.getByText("Hidden Calibration UI")).toBeInTheDocument();
  });
  expect(screen.getByText("CERT-HIDDEN-UI")).toBeInTheDocument();
  expect(screen.getByText("Hidden Technician")).toBeInTheDocument();

  await user.type(screen.getByLabelText(/kalibrierdatum/i), "2026-06-01");
  await user.type(screen.getByLabelText(/faellig|fällig|due/i), "2027-06-01");
  await user.type(screen.getByLabelText(/ergebnis/i), "passed");
  await user.type(screen.getByLabelText(/durchgef|person|techniker/i), "Second Technician");
  await user.type(screen.getByLabelText(/zertifikat/i), "CERT-HIDDEN-2");
  await user.type(screen.getByLabelText(/notiz|notes/i), "Follow-up hidden calibration");
  await user.click(screen.getByRole("button", { name: /kalibrierung.*speichern|speichern/i }));

  await waitFor(() => {
    expect(postBody).toMatchObject({
      calibration_date: "2026-06-01",
      next_due_date: "2027-06-01",
      result: "passed",
      performed_by: "Second Technician",
      certificate_reference: "CERT-HIDDEN-2",
      notes: "Follow-up hidden calibration",
    });
  });
  await waitFor(() => {
    expect(detailRequests).toBeGreaterThanOrEqual(2);
  });

  const main = screen.getByRole("main");
  expect(within(main).getByText(/kalibrier/i)).toBeInTheDocument();
});
