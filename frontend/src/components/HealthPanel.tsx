import { useEffect, useState } from "react";

import { getHealthStatus } from "../api/client";

type HealthState = "loading" | "ok" | "error";

export function HealthPanel(): JSX.Element {
  const [state, setState] = useState<HealthState>("loading");

  useEffect(() => {
    let isMounted = true;

    getHealthStatus()
      .then((status) => {
        if (isMounted) {
          setState(status === "ok" ? "ok" : "error");
        }
      })
      .catch(() => {
        if (isMounted) {
          setState("error");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="health-panel" aria-label="Backend status">
      <span className={`status-dot ${state}`} aria-hidden="true" />
      <span>
        {state === "loading" && "Backend wird geprueft"}
        {state === "ok" && "Backend erreichbar"}
        {state === "error" && "Backend nicht erreichbar"}
      </span>
    </section>
  );
}
