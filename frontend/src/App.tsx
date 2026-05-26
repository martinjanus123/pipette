import { NavLink, Route, Routes } from "react-router-dom";

import { DashboardPage } from "./pages/DashboardPage";
import { HealthPanel } from "./components/HealthPanel";
import { PipetteCreatePage } from "./pages/PipetteCreatePage";
import { PipetteDetailPage } from "./pages/PipetteDetailPage";
import { PipetteListPage } from "./pages/PipetteListPage";

const navigation = [
  { to: "/", label: "Dashboard" },
  { to: "/pipettes", label: "Pipetten" },
  { to: "/pipettes/new", label: "Neue Pipette" }
];

export function App(): JSX.Element {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Experiment 2</p>
          <h1>Pipettentool</h1>
        </div>
        <nav aria-label="Hauptnavigation">
          {navigation.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <HealthPanel />
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/pipettes" element={<PipetteListPage />} />
          <Route path="/pipettes/new" element={<PipetteCreatePage />} />
          <Route path="/pipettes/:id" element={<PipetteDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}
