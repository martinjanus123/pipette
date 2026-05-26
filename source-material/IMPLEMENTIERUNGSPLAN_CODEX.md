# Implementierungsplan Pipettentool

Ziel: Die bestehende Excel-basierte Pipettenverwaltung wird durch eine Client-Server-Anwendung ersetzt. Das System besteht aus einem React-Frontend, einem Python-Backend und einer relationalen Datenbank. Die Excel-Datei dient nur noch als Migrationsquelle und optional als Exportformat.

## 1. Zielbild der Anwendung

Die Anwendung verwaltet Pipetten mit Stammdaten, Standort, Verwendung, Kalibrierstatus, Historie, Fälligkeiten und optionalen Benachrichtigungen. Nutzer sollen Pipetten suchen, Details anzeigen, neue Pipetten erfassen und fällige oder überfällige Kalibrierungen erkennen können.

### Muss-Anforderungen

- Hauptseite mit Suche nach Seriennummer, Inventar-Nr. und weiteren relevanten Feldern.
- Anzeige je Pipette von:
  - Standort / Laborraum
  - Verwendung, z. B. `FuE` oder `Prüfungen`
  - Platz / Anwendung
  - nächster Kalibriertermin
  - Historie
- Historie je Pipette mit mindestens:
  - letzter Kalibrierung
  - Sperrung / Entsperrung
  - Standortänderung
  - Änderung von Platz / Anwendung
  - Einsendung zu Sartorius inklusive Datum
- Anzeige demnächst zu kalibrierender Pipetten.
- Standard-Fälligkeitsfenster: Pipetten, die innerhalb von 14 Tagen fällig werden.
- Anzeige überfälliger Pipetten.
- Ampelsystem:
  - grün: nicht bald fällig
  - gelb: innerhalb von 14 Tagen fällig
  - rot: Kalibriertermin überschritten
  - grau: gesperrt / außer Betrieb
- Kennzeichnung von Pipetten, die zu Sartorius eingeschickt werden müssen.
- Sartorius-Regel: alle Pipetten mit Nennvolumen `<= 25 µL`.
- Button `Neue Pipette eintragen`.
- Eingabeseite für neue Pipetten mit allen geforderten Feldern.
- Dropdowns für Verwendung, Typ, Kalibrierintervall, Platz / Anwendung und Raum.
- Platz / Anwendung soll optional erweiterbar sein: Neue Einträge werden gespeichert und künftig im Dropdown angezeigt.
- Beim Anlegen einer neuen Pipette werden automatisch ergänzt:
  - Registriernummer / laufende Nr.
  - Bezeichnung
  - Kalibrierstufen
  - Fehlergrenzen, sofern fachliche Regeln aus Excel bzw. Konfiguration vorhanden sind.

## 2. Empfohlener Tech-Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- TanStack Query für API-Zugriffe
- React Hook Form für Formulare
- Zod für Frontend-Validierung
- UI-Komponenten: MUI oder shadcn/ui

### Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- Alembic
- APScheduler für einfache tägliche Benachrichtigungsjobs

### Datenbank

- Entwicklung: SQLite
- Produktiv: PostgreSQL

### Betrieb

- Docker Compose mit Services für:
  - Backend
  - Frontend
  - Datenbank

## 3. Ziel-Projektstruktur

```text
pipettentool/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── pipette.py
│   │   │   ├── calibration.py
│   │   │   ├── pipette_event.py
│   │   │   ├── room.py
│   │   │   ├── application.py
│   │   │   └── user.py
│   │   ├── schemas/
│   │   │   ├── pipette.py
│   │   │   ├── calibration.py
│   │   │   ├── pipette_event.py
│   │   │   ├── room.py
│   │   │   └── application.py
│   │   ├── routers/
│   │   │   ├── pipettes.py
│   │   │   ├── calibrations.py
│   │   │   ├── rooms.py
│   │   │   ├── applications.py
│   │   │   └── dashboard.py
│   │   ├── services/
│   │   │   ├── pipette_service.py
│   │   │   ├── calibration_service.py
│   │   │   ├── due_date_service.py
│   │   │   ├── history_service.py
│   │   │   ├── excel_import_service.py
│   │   │   └── notification_service.py
│   │   └── tests/
│   ├── alembic/
│   ├── pyproject.toml
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── PipetteListPage.tsx
│   │   │   ├── PipetteDetailPage.tsx
│   │   │   └── PipetteCreatePage.tsx
│   │   ├── forms/
│   │   ├── hooks/
│   │   ├── routes/
│   │   └── types/
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
├── README.md
└── IMPLEMENTIERUNGSPLAN_CODEX.md
```

## 4. Implementierungsreihenfolge

Die Reihenfolge ist wichtig. Suche, Dashboard und Eingabeformular dürfen erst umgesetzt werden, wenn Client, Server, API und Datenmodell grundsätzlich funktionieren.

---

# Phase 1: Projektgrundlage und Client-Server-Basis

## 1.1 Repository und Grundstruktur anlegen

### Aufgabe

Lege die oben beschriebene Projektstruktur an.

### Akzeptanzkriterien

- `backend/` und `frontend/` existieren.
- Backend startet lokal.
- Frontend startet lokal.
- Beide Services können separat entwickelt werden.

## 1.2 Backend-Grundgerüst mit FastAPI

### Aufgabe

Erstelle ein FastAPI-Backend mit Healthcheck.

### Endpunkt

```http
GET /api/health
```

### Beispielantwort

```json
{
  "status": "ok"
}
```

### Akzeptanzkriterien

- Backend ist über `/api/health` erreichbar.
- API-Dokumentation ist über FastAPI Swagger UI erreichbar.
- CORS ist für das lokale Frontend konfiguriert.

## 1.3 Frontend-Grundgerüst mit React

### Aufgabe

Erstelle ein React-TypeScript-Projekt mit Routing.

### Seiten-Platzhalter

- `/` Dashboard
- `/pipettes` Pipettenliste
- `/pipettes/new` Neue Pipette eintragen
- `/pipettes/:id` Pipettendetails

### Akzeptanzkriterien

- Frontend startet mit Vite.
- Navigation zwischen Seiten funktioniert.
- Frontend ruft `/api/health` auf und zeigt den Backend-Status an.

## 1.4 Docker Compose

### Aufgabe

Erstelle eine lokale Entwicklungsumgebung mit Docker Compose.

### Services

- `backend`
- `frontend`
- `db`

### Akzeptanzkriterien

- `docker compose up` startet Frontend, Backend und Datenbank.
- Frontend kann Backend erreichen.
- Backend kann Datenbank erreichen.

---

# Phase 2: Datenmodell und Datenbank

## 2.1 SQLAlchemy und Alembic einrichten

### Aufgabe

Richte Datenbankverbindung, SQLAlchemy-Base und Alembic-Migrationen ein.

### Akzeptanzkriterien

- Datenbankverbindung ist konfigurierbar.
- Erste Migration kann ausgeführt werden.
- Tabellen werden reproduzierbar erstellt.

## 2.2 Stammdatentabellen erstellen

### Tabellen

#### `rooms`

```text
id
name
is_active
created_at
updated_at
```

Startwerte:

- `Labor 1a`
- `Labor 1b`
- `Labor 3`

#### `applications`

```text
id
name
is_active
created_at
updated_at
```

Startwerte:

- `Sterilwerkbank`
- `Assays`
- `Qubit/Bioanalyzer`
- `PCR-Platz`
- `Extraktion cf-DNA`
- `Prüfungen`
- `Countess`
- `ddPCR`

#### `uses`

```text
id
name
is_active
```

Startwerte:

- `FuE`
- `Prüfungen`

#### `pipette_types`

```text
id
name
is_active
```

Startwerte:

- `Luftpolsterpipette`
- `Direktverdränger`

### Akzeptanzkriterien

- Alle Dropdown-Werte kommen aus der Datenbank.
- Neue Anwendungen können später ergänzt werden.
- Inaktive Werte können ausgeblendet werden, ohne alte Pipetten zu beschädigen.

## 2.3 Pipetten-Tabelle erstellen

### Tabelle `pipettes`

```text
id
register_number
inventory_number
serial_number
manufacturer
model_name
description
channel_count
use_id
pipette_type_id
nominal_volume_ul
calibration_interval_months
application_id
room_id
status
created_at
updated_at
```

### Statuswerte

```text
active
blocked
out_of_service
sent_to_sartorius
```

### Validierungen

- `inventory_number` ist Pflichtfeld.
- `serial_number` ist Pflichtfeld.
- `channel_count` muss größer als 0 sein.
- `nominal_volume_ul` muss größer als 0 sein.
- `calibration_interval_months` ist nur `6` oder `12`.
- `register_number` wird automatisch vergeben.

### Akzeptanzkriterien

- Pipetten können in der Datenbank gespeichert werden.
- Seriennummer und Inventar-Nr. können gesucht werden.
- Register-Nr. wird automatisch eindeutig vergeben.

## 2.4 Kalibrierungstabelle erstellen

### Tabelle `calibrations`

```text
id
pipette_id
calibration_date
next_due_date
result
performed_by
certificate_reference
notes
created_at
updated_at
```

### Akzeptanzkriterien

- Eine Pipette kann mehrere Kalibrierungen haben.
- Die letzte Kalibrierung kann eindeutig ermittelt werden.
- Der nächste Kalibriertermin kann gespeichert und angezeigt werden.

## 2.5 Historientabelle erstellen

### Tabelle `pipette_events`

```text
id
pipette_id
event_type
event_date
old_value
new_value
notes
created_by
created_at
```

### Eventtypen

```text
created
updated
calibrated
blocked
unblocked
room_changed
application_changed
sent_to_sartorius
returned_from_sartorius
status_changed
```

### Akzeptanzkriterien

- Jede relevante Änderung kann historisiert werden.
- Detailseite kann die Historie chronologisch anzeigen.
- Standortänderungen, Anwendungsänderungen, Sperrungen und Sartorius-Einsendungen sind nachvollziehbar.

---

# Phase 3: Backend-Fachlogik

## 3.1 Automatische Register-Nr.

### Aufgabe

Implementiere eine Funktion, die beim Anlegen einer Pipette automatisch die nächste freie Register-Nr. vergibt.

### Regel

```text
nächste Register-Nr. = höchste vorhandene Register-Nr. + 1
```

Falls keine Pipette existiert, starte mit `1`.

### Akzeptanzkriterien

- Nutzer gibt keine Register-Nr. manuell ein.
- Register-Nr. ist eindeutig.
- Gleichzeitige Anlagevorgänge erzeugen keine doppelte Register-Nr.

## 3.2 Automatische Bezeichnung

### Aufgabe

Erzeuge beim Speichern eine zusammengesetzte Bezeichnung.

### Vorschlag

```text
Bezeichnung = Hersteller + " " + Modell + " " + Nennvolumen + " µL"
```

### Akzeptanzkriterien

- Bezeichnung ist in der Pipettenliste sichtbar.
- Bezeichnung wird bei Änderung von Hersteller, Modell oder Nennvolumen aktualisiert.

## 3.3 Kalibrierstufen berechnen

### Aufgabe

Berechne die Kalibrierstufen automatisch aus dem Nennvolumen.

### Grundregel

```text
Stufe 1 = 10 % des Nennvolumens
Stufe 2 = 50 % des Nennvolumens
Stufe 3 = 100 % des Nennvolumens
```

### Umsetzung

Lege entweder eine Tabelle `calibration_levels` an oder berechne die Werte dynamisch im Backend.

Empfohlene Tabelle:

```text
id
pipette_id
level_percent
volume_ul
created_at
```

### Akzeptanzkriterien

- Neue Pipette erhält automatisch 3 Kalibrierstufen.
- Werte werden in der Detailansicht angezeigt.
- Berechnung ist durch Tests abgesichert.

## 3.4 Fehlergrenzen / Fehlerwerte

### Aufgabe

Implementiere eine fachliche Struktur für Fehlergrenzen. Falls die genauen Regeln noch aus der Excel-Datei übernommen werden müssen, zunächst als konfigurierbare Tabelle anlegen.

### Tabelle `error_limits`

```text
id
pipette_type_id
nominal_volume_min_ul
nominal_volume_max_ul
level_percent
max_systematic_error
max_random_error
unit
created_at
updated_at
```

### Akzeptanzkriterien

- Fehlergrenzen sind nicht hart im Code verteilt.
- Regeln können später angepasst werden.
- Neue Pipetten können passende Fehlergrenzen erhalten, wenn Regeln vorhanden sind.
- Wenn keine passende Regel existiert, wird die Pipette gespeichert und ein Hinweis angezeigt.

## 3.5 Fälligkeitsstatus berechnen

### Aufgabe

Implementiere eine Backend-Funktion für den Kalibrierstatus.

### Regeln

```text
grau: status != active
grün: next_due_date > heute + 14 Tage
gelb: heute <= next_due_date <= heute + 14 Tage
rot: next_due_date < heute
```

### Rückgabewert

```json
{
  "calibration_status": "green|yellow|red|gray",
  "days_until_due": 12,
  "is_due_soon": true,
  "is_overdue": false
}
```

### Akzeptanzkriterien

- Status ist serverseitig berechnet.
- Frontend zeigt nur das Ergebnis an.
- Berechnung ist getestet.

## 3.6 Sartorius-Regel implementieren

### Aufgabe

Implementiere eine Funktion, die erkennt, ob eine Pipette zu Sartorius geschickt werden muss.

### Regel

```text
requires_sartorius = nominal_volume_ul <= 25
```

### Akzeptanzkriterien

- Pipetten mit `<= 25 µL` werden markiert.
- Dashboard kann diese Pipetten separat anzeigen.
- Detailseite zeigt einen Hinweis an.

---

# Phase 4: Backend-API

## 4.1 API für Dropdown-Daten

### Endpunkte

```http
GET /api/rooms
GET /api/applications
POST /api/applications
GET /api/uses
GET /api/pipette-types
```

### Akzeptanzkriterien

- Frontend lädt Dropdowns aus dem Backend.
- Neue Anwendungen können über API erstellt werden.
- Nur aktive Werte werden standardmäßig zurückgegeben.

## 4.2 API für Pipetten anlegen

### Endpunkt

```http
POST /api/pipettes
```

### Request

```json
{
  "manufacturer": "Eppendorf",
  "model_name": "Research plus",
  "inventory_number": "L00123",
  "serial_number": "SN123456",
  "channel_count": 1,
  "use_id": 1,
  "pipette_type_id": 1,
  "nominal_volume_ul": 100,
  "calibration_interval_months": 12,
  "application_id": 1,
  "room_id": 1
}
```

### Server erstellt automatisch

- `register_number`
- `description`
- Kalibrierstufen
- Fehlergrenzen-Zuordnung, wenn möglich
- Historieneintrag `created`
- Sartorius-Hinweis, falls Nennvolumen `<= 25 µL`

### Akzeptanzkriterien

- Neue Pipette ist nach dem Speichern in der Liste sichtbar.
- Automatische Felder sind gesetzt.
- Historie enthält Anlageereignis.

## 4.3 API für Pipettenliste und Suche

### Endpunkt

```http
GET /api/pipettes
```

### Query-Parameter

```text
q
serial_number
inventory_number
room_id
application_id
use_id
status
calibration_status
requires_sartorius
limit
offset
sort
```

### Rückgabe pro Pipette

```json
{
  "id": 1,
  "register_number": 1,
  "inventory_number": "L00123",
  "serial_number": "SN123456",
  "description": "Eppendorf Research plus 100 µL",
  "room": "Labor 1a",
  "use": "FuE",
  "application": "PCR-Platz",
  "next_due_date": "2026-06-01",
  "calibration_status": "yellow",
  "requires_sartorius": false
}
```

### Akzeptanzkriterien

- Suche nach Seriennummer funktioniert.
- Suche nach Inventar-Nr. funktioniert.
- Freitextsuche findet relevante Pipetten.
- Standort, Verwendung, Anwendung und nächster Kalibriertermin werden angezeigt.
- Pagination ist vorhanden.

## 4.4 API für Pipettendetails

### Endpunkt

```http
GET /api/pipettes/{id}
```

### Rückgabe enthält

- Stammdaten
- Raum
- Verwendung
- Platz / Anwendung
- letzte Kalibrierung
- nächster Kalibriertermin
- Kalibrierstatus
- Sartorius-Hinweis
- Kalibrierstufen
- Fehlergrenzen, falls vorhanden

### Akzeptanzkriterien

- Detailseite kann alle Informationen ohne Zusatzlogik aus dem Frontend anzeigen.

## 4.5 API für Pipetten bearbeiten

### Endpunkt

```http
PATCH /api/pipettes/{id}
```

### Aufgabe

Änderungen an Raum, Anwendung, Status oder relevanten Stammdaten müssen Historieneinträge erzeugen.

### Akzeptanzkriterien

- Raumänderung erzeugt Event `room_changed`.
- Anwendungsänderung erzeugt Event `application_changed`.
- Sperrung erzeugt Event `blocked` oder `status_changed`.
- Entsperrung erzeugt Event `unblocked` oder `status_changed`.

## 4.6 API für Historie

### Endpunkt

```http
GET /api/pipettes/{id}/events
```

### Akzeptanzkriterien

- Historie wird chronologisch absteigend zurückgegeben.
- Historie enthält Kalibrierungen, Sperrungen, Standortwechsel, Anwendungswechsel und Sartorius-Ereignisse.

## 4.7 API für Kalibrierungen

### Endpunkte

```http
GET /api/pipettes/{id}/calibrations
POST /api/pipettes/{id}/calibrations
```

### Beim Anlegen einer Kalibrierung

- `calibration_date` speichern.
- `next_due_date` berechnen:

```text
next_due_date = calibration_date + calibration_interval_months
```

- Historieneintrag `calibrated` erzeugen.

### Akzeptanzkriterien

- Letzte Kalibrierung wird korrekt angezeigt.
- Nächster Kalibriertermin wird aktualisiert.
- Fälligkeitsstatus ändert sich entsprechend.

## 4.8 API für Dashboard

### Endpunkte

```http
GET /api/dashboard/summary
GET /api/dashboard/due-soon
GET /api/dashboard/overdue
GET /api/dashboard/requires-sartorius
```

### Summary-Rückgabe

```json
{
  "total_pipettes": 120,
  "due_soon_count": 8,
  "overdue_count": 3,
  "blocked_count": 2,
  "requires_sartorius_count": 14
}
```

### Akzeptanzkriterien

- Dashboard zeigt fällige Pipetten innerhalb von 14 Tagen.
- Dashboard zeigt überfällige Pipetten.
- Dashboard zeigt Sartorius-Pipetten.
- Ampelsystem ist sichtbar.

---

# Phase 5: Frontend-Implementierung

## 5.1 API-Client im Frontend

### Aufgabe

Erstelle einen zentralen API-Client.

### Dateien

```text
frontend/src/api/client.ts
frontend/src/api/pipettes.ts
frontend/src/api/dropdowns.ts
frontend/src/api/dashboard.ts
```

### Akzeptanzkriterien

- API-Basis-URL ist konfigurierbar.
- Fehler werden einheitlich behandelt.
- TanStack Query wird für Datenabrufe verwendet.

## 5.2 Layout und Navigation

### Aufgabe

Erstelle ein Grundlayout mit Navigation.

### Navigation

- Dashboard
- Pipetten
- Neue Pipette

### Akzeptanzkriterien

- Nutzer kann alle Hauptseiten erreichen.
- Aktive Seite ist erkennbar.

## 5.3 Dashboard-Seite

### Aufgabe

Implementiere das Dashboard.

### Inhalte

- Gesamtzahl Pipetten
- Anzahl demnächst fälliger Pipetten
- Anzahl überfälliger Pipetten
- Anzahl gesperrter Pipetten
- Anzahl Sartorius-Pipetten
- Tabelle `In 14 Tagen fällig`
- Tabelle `Überfällig`
- Tabelle `Zu Sartorius einschicken`

### Akzeptanzkriterien

- Daten kommen aus Backend-API.
- Ampelfarben werden angezeigt.
- Klick auf eine Pipette führt zur Detailseite.

## 5.4 Pipettenliste mit Suche

### Aufgabe

Implementiere eine Pipettenliste mit Suche und Filtern.

### Suchfelder

- Freitextsuche
- Seriennummer
- Inventar-Nr.
- Raum
- Verwendung
- Platz / Anwendung
- Status
- Kalibrierstatus

### Tabellenspalten

- Register-Nr.
- Inventar-Nr.
- Serien-Nr.
- Bezeichnung
- Nennvolumen
- Kanäle
- Verwendung
- Platz / Anwendung
- Raum
- nächster Kalibriertermin
- Ampelstatus
- Sartorius-Hinweis

### Akzeptanzkriterien

- Suche wird an Backend gesendet.
- Ergebnisse werden paginiert.
- Ampelstatus ist sichtbar.
- Klick auf Zeile öffnet Detailseite.

## 5.5 Neue Pipette eintragen

### Aufgabe

Implementiere die Eingabeseite `/pipettes/new`.

### Felder

- Pipette / Firma und Bezeichnung:
  - `manufacturer`
  - `model_name`
- Inventar-Nr.
- Serien-Nr.
- Anzahl Kanäle
- Verwendung Dropdown:
  - `FuE`
  - `Prüfungen`
- Typ Dropdown:
  - `Luftpolsterpipette`
  - `Direktverdränger`
- Nennvolumen in `µL`
- Kalibrierintervall Dropdown:
  - `6`
  - `12`
- Platz / Anwendung Dropdown:
  - `Sterilwerkbank`
  - `Assays`
  - `Qubit/Bioanalyzer`
  - `PCR-Platz`
  - `Extraktion cf-DNA`
  - `Prüfungen`
  - `Countess`
  - `ddPCR`
- Möglichkeit zum Neueintrag einer Anwendung
- Raum Dropdown:
  - `Labor 1a`
  - `Labor 1b`
  - `Labor 3`

### Akzeptanzkriterien

- Pflichtfelder werden validiert.
- Dropdowns werden aus API geladen.
- Neue Anwendung kann angelegt und sofort ausgewählt werden.
- Nach Speichern Weiterleitung zur Detailseite.
- Backend ergänzt Register-Nr., Bezeichnung, Kalibrierstufen und Fehlergrenzen.

## 5.6 Pipettendetailseite

### Aufgabe

Implementiere `/pipettes/:id`.

### Inhalte

- Stammdaten
- Standort / Raum
- Verwendung
- Platz / Anwendung
- Status
- Nennvolumen
- Kalibrierintervall
- letzte Kalibrierung
- nächster Kalibriertermin
- Ampelstatus
- Sartorius-Hinweis
- Kalibrierstufen
- Fehlergrenzen
- Historie

### Aktionen

- Pipette bearbeiten
- Pipette sperren
- Pipette entsperren
- Kalibrierung eintragen
- Zu Sartorius geschickt markieren
- Von Sartorius zurück markieren

### Akzeptanzkriterien

- Alle Informationen werden aus Backend geladen.
- Historie ist sichtbar.
- Aktionen erzeugen Historieneinträge.

## 5.7 Bearbeitungsdialog

### Aufgabe

Implementiere Bearbeiten von Stammdaten, Raum, Anwendung, Verwendung und Status.

### Akzeptanzkriterien

- Änderungen werden über `PATCH /api/pipettes/{id}` gespeichert.
- Backend erzeugt Historieneinträge.
- Nach Speichern werden Detaildaten aktualisiert.

## 5.8 Kalibrierung erfassen

### Aufgabe

Implementiere Formular zum Erfassen einer Kalibrierung.

### Felder

- Kalibrierdatum
- Ergebnis
- durchgeführt von
- Zertifikat / Referenz
- Notizen

### Akzeptanzkriterien

- Neue Kalibrierung wird gespeichert.
- Nächster Kalibriertermin wird berechnet.
- Historie enthält Kalibrierung.
- Ampelstatus aktualisiert sich.

---

# Phase 6: Excel-Migration und Excel-Ablösung

## 6.1 Excel-Importskript

### Aufgabe

Implementiere ein Importskript für die bestehende Excel-Datei.

### Ziel

Die vorhandenen Pipetten werden einmalig in die Datenbank übernommen.

### Importlogik

- Excel-Datei lesen.
- Relevante Spalten den neuen Datenbankfeldern zuordnen.
- Pflichtfelder validieren.
- Duplikate erkennen.
- Räume und Anwendungen gegen Stammdaten prüfen.
- Fehlerprotokoll erzeugen.
- Gültige Datensätze importieren.

### Akzeptanzkriterien

- Import kann mehrfach testweise ausgeführt werden.
- Doppelte Seriennummern werden erkannt.
- Ungültige Datensätze werden protokolliert.
- Import schreibt keine unvollständigen Pipetten ohne Hinweis in die Datenbank.

## 6.2 Excel wird nicht mehr als Primärspeicher genutzt

### Aufgabe

Stelle sicher, dass neue Pipetten nicht mehr primär in Excel geschrieben werden.

### Neue Regel

```text
Datenbank ist führendes System.
Excel ist nur Import- und optional Exportformat.
```

### Akzeptanzkriterien

- Neue Pipetten werden in der Datenbank gespeichert.
- Die Anwendung funktioniert ohne Excel-Datei.
- Optionaler Excel-Export kann später ergänzt werden.

## 6.3 Optionaler Excel-Export

### Aufgabe

Implementiere später einen Export, falls Fachbereich weiterhin Excel-Ausgaben benötigt.

### Endpunkt

```http
GET /api/reports/pipettes.xlsx
```

### Akzeptanzkriterien

- Export enthält aktuelle Daten aus der Datenbank.
- Export verändert keine Daten.

---

# Phase 7: Benachrichtigungen

## 7.1 E-Mail-Benachrichtigung

### Aufgabe

Implementiere einen täglichen Job, der fällige und überfällige Pipetten prüft.

### Inhalt der E-Mail

- Pipetten, die innerhalb von 14 Tagen fällig sind.
- Pipetten, deren Kalibriertermin überschritten ist.
- Pipetten, die zu Sartorius eingeschickt werden müssen.

### Akzeptanzkriterien

- Job läuft täglich konfigurierbar.
- Empfänger sind konfigurierbar.
- Mail wird nur verschickt, wenn relevante Pipetten vorhanden sind oder alternativ immer mit leerem Report, abhängig von Konfiguration.

## 7.2 Kalenderbenachrichtigung optional

### Aufgabe

Kalenderintegration erst nach stabiler E-Mail-Benachrichtigung planen.

### Akzeptanzkriterien

- Nicht Teil des MVP.
- Technisch als spätere Erweiterung vorgesehen.

---

# Phase 8: Tests

## 8.1 Backend-Unit-Tests

### Testfälle

- Register-Nr. wird automatisch vergeben.
- Bezeichnung wird korrekt erzeugt.
- Kalibrierstufen werden korrekt berechnet.
- Sartorius-Regel funktioniert für `25 µL`, kleiner als `25 µL` und größer als `25 µL`.
- Ampelstatus:
  - grün bei Fälligkeit in mehr als 14 Tagen
  - gelb bei Fälligkeit innerhalb von 14 Tagen
  - rot bei überschrittenem Termin
  - grau bei gesperrter Pipette
- nächste Kalibrierung wird aus Kalibrierdatum und Intervall berechnet.
- Historieneinträge werden bei Änderungen erzeugt.

### Akzeptanzkriterien

- Tests laufen automatisch mit `pytest`.
- Fachlogik ist unabhängig von Frontend getestet.

## 8.2 API-Tests

### Testfälle

- Pipette anlegen.
- Pipette suchen nach Seriennummer.
- Pipette suchen nach Inventar-Nr.
- Pipettendetails laden.
- Kalibrierung anlegen.
- Historie laden.
- Dashboard-Daten laden.

### Akzeptanzkriterien

- API-Endpunkte liefern erwartete Daten.
- Fehlerfälle liefern verständliche HTTP-Fehler.

## 8.3 Frontend-Tests

### Testfälle

- Dashboard rendert Kennzahlen.
- Pipettenliste zeigt Suchergebnisse.
- Formular validiert Pflichtfelder.
- Neue Anwendung kann angelegt werden.
- Detailseite zeigt Historie.

### Akzeptanzkriterien

- Kritische UI-Flows sind getestet.

---

# Phase 9: Benutzerrollen und Audit, falls benötigt

## 9.1 Rollenmodell

### Minimalrollen

- `viewer`: darf anzeigen und suchen.
- `editor`: darf Pipetten anlegen und ändern.
- `admin`: darf Stammdaten und Fehlergrenzen pflegen.

### Akzeptanzkriterien

- Rollen können später ergänzt werden.
- Schreibaktionen sind geschützt, wenn Login aktiviert wird.

## 9.2 Audit-Informationen

### Aufgabe

Speichere bei Änderungen den Benutzer, sofern Authentifizierung vorhanden ist.

### Akzeptanzkriterien

- Historie zeigt, wer eine Änderung durchgeführt hat.
- Ohne Login kann initial ein technischer Benutzer verwendet werden.

---

# Phase 10: MVP-Definition

Der erste produktiv nutzbare MVP umfasst nur die Kernfunktionen.

## MVP enthalten

- Client-Server-Grundsystem
- Datenbank
- Pipettenmodell
- Stammdaten für Räume, Verwendungen, Typen und Anwendungen
- Pipettenliste
- Suche nach Seriennummer und Inventar-Nr.
- Anzeige Standort, Verwendung, Anwendung, nächster Kalibriertermin
- Neue Pipette eintragen
- automatische Register-Nr.
- automatische Bezeichnung
- automatische Kalibrierstufen
- Fälligkeitsstatus mit Ampel
- Anzeige fällig in 14 Tagen
- Anzeige überfällig
- Sartorius-Hinweis für Pipetten `<= 25 µL`
- Detailseite
- Historie
- Kalibrierung erfassen
- Excel-Import

## Nicht zwingend im MVP

- Kalenderintegration
- komplexes Rollenmodell
- PDF-Reports
- Excel-Export
- Zertifikatsdatei-Upload
- vollständiges Audit mit Login

---

# Phase 11: Empfohlene Codex-Arbeitspakete

Diese Arbeitspakete sollen nacheinander umgesetzt werden.

## Arbeitspaket 1: Grundsystem

```text
Erstelle ein Monorepo mit backend/ und frontend/.
Backend: FastAPI mit /api/health.
Frontend: React TypeScript mit Routing und Healthcheck-Anzeige.
Docker Compose für Frontend, Backend und Datenbank.
```

## Arbeitspaket 2: Datenbank

```text
Richte SQLAlchemy und Alembic ein.
Erstelle Modelle und Migrationen für rooms, applications, uses, pipette_types, pipettes, calibrations und pipette_events.
Seed-Daten für Räume, Anwendungen, Verwendungen und Pipettentypen anlegen.
```

## Arbeitspaket 3: Backend-Fachlogik

```text
Implementiere Services für Register-Nr., Bezeichnung, Kalibrierstufen, Fälligkeitsstatus und Sartorius-Regel.
Schreibe Unit-Tests für alle Regeln.
```

## Arbeitspaket 4: Pipetten-API

```text
Implementiere REST-Endpunkte für Dropdowns, Pipetten anlegen, Pipettenliste mit Suche, Pipettendetails, Bearbeiten, Historie und Kalibrierungen.
```

## Arbeitspaket 5: Frontend-Listen und Dashboard

```text
Implementiere Dashboard mit Kennzahlen, fälligen, überfälligen und Sartorius-Pipetten.
Implementiere Pipettenliste mit Suche, Filtern, Pagination und Ampelanzeige.
```

## Arbeitspaket 6: Neue Pipette und Details

```text
Implementiere Formular Neue Pipette mit allen Pflichtfeldern und Dropdowns.
Implementiere Neueintrag von Platz / Anwendung.
Implementiere Detailseite mit Stammdaten, Kalibrierung, Historie, Sartorius-Hinweis und Ampelstatus.
```

## Arbeitspaket 7: Historie und Aktionen

```text
Implementiere Bearbeiten, Sperren, Entsperren, Kalibrierung erfassen, zu Sartorius geschickt markieren und zurück von Sartorius markieren.
Alle Aktionen müssen Historieneinträge erzeugen.
```

## Arbeitspaket 8: Excel-Migration

```text
Implementiere ein Importskript für die bestehende Excel-Datei.
Erzeuge ein Importprotokoll mit gültigen Datensätzen, Fehlern und Duplikaten.
Die Datenbank ist danach das führende System.
```

## Arbeitspaket 9: Benachrichtigung

```text
Implementiere täglichen E-Mail-Job für fällige, überfällige und Sartorius-relevante Pipetten.
Empfänger und Versandzeit konfigurierbar machen.
```

## Arbeitspaket 10: Stabilisierung

```text
Ergänze API-Tests, Frontend-Tests, Fehlerbehandlung, Ladezustände und Dokumentation.
Erstelle README mit Setup, Migration, Start und Testausführung.
```

---

# Definition of Done

Eine Anforderung gilt erst als fertig, wenn alle Punkte erfüllt sind:

- Backend-Endpunkt existiert.
- Datenmodell unterstützt die Anforderung.
- Frontend zeigt oder nutzt die Funktion.
- Validierung ist vorhanden.
- Fehlerfälle werden behandelt.
- Relevante Historieneinträge werden erzeugt.
- Unit- oder API-Test existiert.
- Funktion ist in README oder Entwicklerdokumentation beschrieben.

---

# Wichtige Architekturregeln

- Fachlogik gehört ins Backend, nicht ins Frontend.
- Frontend zeigt Ampelstatus nur an; Berechnung erfolgt im Backend.
- Datenbank ist führendes System, nicht Excel.
- Dropdown-Werte kommen aus der Datenbank.
- Historie wird automatisch durch Backend-Services erzeugt.
- Keine Excel-Formeln in der neuen Anwendung nachbauen, sondern fachliche Regeln als Python-Code oder Konfiguration abbilden.
- Jede fachliche Regel muss testbar sein.
- Zuerst MVP stabil bauen, danach Benachrichtigung, Rollen und Exporte erweitern.
