import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";

import { App } from "../src/App";

let importBody: unknown;

beforeEach(() => {
  importBody = undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      if (url.includes("/api/health")) {
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      }
      if (url.includes("/api/calibrations/import") && method === "POST") {
        importBody = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({
            imported_count: 1,
            errors: [
              {
                row: 3,
                field: "pipette_identifier",
                message: "Pipette wurde nicht gefunden",
              },
            ],
          }),
          { status: 200 },
        );
      }
      if (url.includes("/api/pipettes")) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      return new Response(JSON.stringify({ detail: "not found" }), { status: 404 });
    }),
  );
});

test("CSV import form posts csv_text and renders summary plus row errors", async () => {
  const user = userEvent.setup();
  const csvText = [
    "pipette_identifier,calibration_date,next_due_date,result,performed_by,certificate_reference,notes",
    "IMPORT-UI,2026-05-20,2027-05-20,passed,Hidden Tech,CERT-UI,Valid",
    "UNKNOWN,2026-05-21,2027-05-21,passed,Hidden Tech,CERT-BAD,Unknown",
  ].join("\n");

  render(
    <MemoryRouter initialEntries={["/pipettes"]}>
      <App />
    </MemoryRouter>,
  );

  await user.click(await screen.findByRole("button", { name: /csv|import/i }));
  expect(screen.getByText(/pipette_identifier/i)).toBeInTheDocument();

  await user.type(screen.getByLabelText(/csv|import/i), csvText);
  await user.click(screen.getByRole("button", { name: /importieren|import/i }));

  await waitFor(() => {
    expect(importBody).toEqual({ csv_text: csvText });
  });
  expect(screen.getByText(/1/)).toBeInTheDocument();
  expect(screen.getByText(/zeile\s*3|row\s*3/i)).toBeInTheDocument();
  expect(screen.getByText(/pipette_identifier/i)).toBeInTheDocument();
  expect(screen.getByText(/nicht gefunden/i)).toBeInTheDocument();
});
