# Aufgabe fuer den Coding-Agenten

Implementiere genau die Coding-Anforderung, die dir fuer diesen Experiment-Run gegeben wird.
Baue keine neue Infrastruktur auf.

## Startzustand

Das Repository enthaelt bereits:

- FastAPI-Backend mit Healthcheck.
- React/Vite-Frontend mit Routing und Healthcheck-Anzeige.
- PostgreSQL via Docker Compose.
- SQLAlchemy-Datenbankanbindung.
- Alembic-Initialmigration.
- Datenbankmodelle fuer Pipetten, Stammdaten, Kalibrierungen und Historie.
- Seed-Daten fuer Raeume, Anwendungen, Verwendungen und Pipettentypen.
- Basis-API fuer Stammdaten und Pipetten.
- Frontend-Basis fuer Pipettenliste, Detailseite und Neuanlage.
- Test-Grundgeruest fuer Backend und Frontend.
- SonarQube-Konfiguration fuer die spaetere Codequalitaetsbewertung.

## Fachliches Ziel

Die Anwendung ersetzt eine bestehende Excel-basierte Pipettenverwaltung. Excel ist nur Migrationsquelle und optional spaeter Exportformat. Die Datenbank ist das fuehrende System.

## Offene Coding-Anforderungen fuer Experimente

Die Agenten sollen nur kleine, klar abgegrenzte Anforderungen bearbeiten. Beispiele:

- Sartorius-Hinweis fuer Pipetten mit Nennvolumen `<= 25 µL`.
- Kalibrier-Ampel fuer `green`, `yellow`, `red`, `gray`.
- Neue Anwendung im Formular anlegen und direkt auswaehlen.

Die genaue Aufgabe fuer den Run steht im Prompt des jeweiligen Experiments.

## Architekturregeln

- Fachlogik gehoert ins Backend.
- Frontend zeigt berechnete Werte nur an.
- Dropdown-Werte kommen aus der Datenbank.
- Keine erfundenen Fehlergrenzen.
- Keine Excel-Datei als Primaerspeicher.
- Tests fuer zentrale Fachregeln schreiben.
- Bestehende Baseline-Funktionen nicht neu aufbauen.
- Keine unnoetigen Refactorings ausserhalb der gegebenen Coding-Anforderung.

## Bewertung

Der Durchlauf wird ueber funktionale Tests und statische Analyse bewertet. Achte auf wartbaren, verstaendlichen Code mit niedriger unnoetiger Komplexitaet.
