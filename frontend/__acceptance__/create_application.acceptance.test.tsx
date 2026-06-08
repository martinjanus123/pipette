import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";

import { App } from "../src/App";

const rooms = [{ id: 1, name: "Labor 1a", is_active: true }];
const applications = [{ id: 1, name: "PCR-Platz", is_active: true }];
const uses = [{ id: 1, name: "FuE", is_active: true }];
const pipetteTypes = [{ id: 1, name: "Luftpolsterpipette", is_active: true }];

let applicationPostBody: unknown;

beforeEach(() => {
  applicationPostBody = undefined;
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
      if (url.endsWith("/api/uses")) {
        return new Response(JSON.stringify(uses), { status: 200 });
      }
      if (url.endsWith("/api/pipette-types")) {
        return new Response(JSON.stringify(pipetteTypes), { status: 200 });
      }
      if (url.endsWith("/api/applications") && method === "GET") {
        return new Response(JSON.stringify(applications), { status: 200 });
      }
      if (url.endsWith("/api/applications") && method === "POST") {
        applicationPostBody = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({ id: 99, name: "Hidden Neue Anwendung", is_active: true }),
          { status: 201 },
        );
      }
      return new Response(JSON.stringify({ detail: "not found" }), { status: 404 });
    }),
  );
});

test("create form can add a new application and selects it in the dropdown", async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/pipettes/new"]}>
      <App />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(screen.getByRole("heading", { name: /Neue Pipette/i })).toBeInTheDocument();
  });

  const newApplicationInput = await screen.findByRole("textbox", {
    name: /neue anwendung|anwendung anlegen|andere anwendung/i,
  });
  await user.type(newApplicationInput, "Hidden Neue Anwendung");

  await user.click(
    screen.getByRole("button", {
      name: /anwendung.*(anlegen|hinzufuegen|hinzufügen)|neue anwendung/i,
    }),
  );

  await waitFor(() => {
    expect(applicationPostBody).toEqual({ name: "Hidden Neue Anwendung" });
  });

  const applicationSelect = screen.getByLabelText(/^Anwendung$/i);
  expect(within(applicationSelect).getByRole("option", { name: "Hidden Neue Anwendung" })).toBeInTheDocument();
  expect(applicationSelect).toHaveValue("99");
});
