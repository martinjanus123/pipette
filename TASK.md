# Aufgabe fuer den Coding-Agenten

Baue aus diesem Infra-Skeleton ein Pipettentool als Webanwendung.

## Startzustand

Das Repository enthaelt bereits:

- FastAPI-Backend mit Healthcheck.
- React/Vite-Frontend mit Routing und Healthcheck-Anzeige.
- PostgreSQL via Docker Compose.
- Test-Grundgeruest fuer Backend und Frontend.
- SonarQube-Konfiguration fuer die spaetere Codequalitaetsbewertung.

## Fachliches Ziel

Die Anwendung ersetzt eine bestehende Excel-basierte Pipettenverwaltung. Excel ist nur Migrationsquelle und optional spaeter Exportformat. Die Datenbank ist das fuehrende System.

## Muss-Funktionen fuer den MVP

- Pipettenliste mit Suche nach Seriennummer, Inventar-Nr. und weiteren relevanten Feldern.
- Anzeige je Pipette von Standort, Verwendung, Platz/Anwendung, naechstem Kalibriertermin und Historie.
- Dashboard fuer bald faellige und ueberfaellige Kalibrierungen.
- Ampelstatus:
  - `green`: nicht bald faellig.
  - `yellow`: innerhalb von 14 Tagen faellig.
  - `red`: ueberfaellig.
  - `gray`: gesperrt oder ausser Betrieb.
- Neue Pipette eintragen mit:
  - Firma und Bezeichnung.
  - Inventar-Nr.
  - Serien-Nr.
  - Anzahl Kanaele.
  - Verwendung: `FuE`, `Pruefungen`.
  - Typ: `Luftpolsterpipette`, `Direktverdränger`.
  - Nennvolumen in `µL`.
  - Kalibrierintervall: `6` oder `12` Monate.
  - Platz/Anwendung: `Sterilwerkbank`, `Assays`, `Qubit/Bioanalyzer`, `PCR-Platz`, `Extraktion cf-DNA`, `Pruefungen`, `Countess`, `ddPCR`.
  - Raum: `Labor 1a`, `Labor 1b`, `Labor 3`.
- Neue Anwendungen koennen dauerhaft angelegt werden.
- Backend ergaenzt automatisch:
  - Register-Nr.
  - Bezeichnung.
  - Kalibrierstufen.
  - Fehlergrenzen, sofern aus Konfiguration oder Excel ableitbar.
- Sartorius-Regel: Pipetten mit Nennvolumen `<= 25 µL` werden markiert.
- Historie fuer Anlage, Aenderung, Kalibrierung, Sperrung, Entsperrung, Standortwechsel, Anwendungswechsel und Sartorius-Einsendung.
- Excel-Import mit Validierung und Importprotokoll.

## Architekturregeln

- Fachlogik gehoert ins Backend.
- Frontend zeigt berechnete Werte nur an.
- Dropdown-Werte kommen aus der Datenbank.
- Keine erfundenen Fehlergrenzen.
- Keine Excel-Datei als Primaerspeicher.
- Tests fuer zentrale Fachregeln schreiben.

## Bewertung

Der Durchlauf wird ueber funktionale Tests und statische Analyse bewertet. Achte auf wartbaren, verstaendlichen Code mit niedriger unnoetiger Komplexitaet.
