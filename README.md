# Experiment 2 Repository

Dieses Repository ist der gemeinsame Startzustand fuer das zweite Experiment der Bachelorarbeit. Alle Agenten-Runs sollen vom Branch `baseline` ausgehen. Der Baseline-Stand enthaelt bewusst bereits die Infrastruktur und die Basisfunktionen, damit Agenten nur noch kleine Coding-Aufgaben bearbeiten muessen.

## Struktur

```text
.
├── backend/            # FastAPI-Skeleton
├── frontend/           # React/Vite-Skeleton
├── evaluation/         # einheitliche Test- und Analyse-Scripts
├── source-material/    # Anforderungen, Excel-Quelle und Zusatzmaterial
├── TASK.md             # Aufgabe fuer den Coding-Agenten
├── docker-compose.yml
└── sonar-project.properties
```

## Was im Baseline-Stand bereits fertig ist

- FastAPI-Backend mit Healthcheck und OpenAPI.
- React/Vite-Frontend mit Routing.
- PostgreSQL ueber Docker Compose.
- SQLAlchemy-Datenbankanbindung.
- Alembic-Initialmigration.
- Modelle fuer Pipetten, Raeume, Anwendungen, Verwendungen, Pipettentypen, Kalibrierungen und Historie.
- Seed-Daten fuer alle Dropdown-Stammdaten.
- Basis-API fuer Stammdaten und Pipetten.
- Pipettenliste, Detailansicht und einfache Neuanlage im Frontend.
- Gemeinsame Evaluationspipeline fuer Backend- und Frontend-Tests.

## Baseline starten

```powershell
docker compose up --build
```

Danach sind die Services erreichbar:

- Frontend: http://localhost:5173
- Backend: http://localhost:8000/api/health
- Backend OpenAPI: http://localhost:8000/docs
- PostgreSQL: localhost:5432

## Neuen Experiment-Run als Branch erzeugen

Jeder Run muss vom gleichen Branch `baseline` starten.

```powershell
.\scripts\new-run-branch.ps1 -Architecture "single-agent-tools" -AgentName "codex" -RunNumber 1
```

Das erzeugt z. B.:

```text
run/single-agent-tools/codex-01
```

Der Agent arbeitet danach nur auf diesem Branch.

## Run bewerten

```powershell
.\evaluation\run-evaluation.ps1 -RunPath .
```

Die Ergebnisse werden in `evaluation-results/` geschrieben. Dieser Ordner ist ignoriert und wird nicht committed.

## GitHub und SonarQube

Nach dem Initial-Commit kann das Repository zu GitHub gepusht werden:

```powershell
git remote add origin <repo-url>
git push -u origin baseline
git push -u origin run/single-agent-tools/codex-01
```

SonarQube/SonarCloud kann dieses Repository ueber `sonar-project.properties` analysieren. Branches bleiben dadurch direkt vergleichbar, weil alle vom gleichen Baseline-Commit abstammen.
