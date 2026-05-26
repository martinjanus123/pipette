# SKILL.md — Pipettentool

Diese Skill-Datei beschreibt, wie ein Coding-Agent an diesem Projekt arbeiten soll. Ziel ist eine robuste Client-Server-Anwendung zur Verwaltung von Pipetten als Ersatz für die bisherige Excel-Lösung.

## Projektziel

Baue eine Webanwendung zur Verwaltung von Pipetten mit:

- React-Frontend
- Python/FastAPI-Backend
- relationaler Datenbank
- Import aus der bestehenden Excel-Datei
- Suche, Anzeige, Eingabe, Historie, Fälligkeiten und Benachrichtigungen

Die Excel-Datei ist **nicht** die neue Datenhaltung. Sie dient nur als Migrationsquelle und optional später als Exportformat.

## Grundprinzipien

1. **Client-Server zuerst**
   - Backend, Datenbank und Frontend müssen lauffähig stehen, bevor fachliche Features umgesetzt werden.
   - Keine fachliche Logik nur im Frontend implementieren.
   - Das Backend ist die Quelle der Wahrheit.

2. **Fachlogik ins Backend**
   - Fälligkeiten, Ampelstatus, Sartorius-Regel, Registriernummern, Kalibrierstufen und Fehlergrenzen gehören ins Backend.
   - Frontend zeigt berechnete Werte nur an.

3. **Excel entkoppeln**
   - Excel-Strukturen nicht 1:1 nachbauen.
   - Excel-Spalten fachlich analysieren und in ein sauberes Datenmodell überführen.
   - Importskripte müssen validieren und Fehler protokollieren.

4. **Iterativ entwickeln**
   - Erst ein kleiner lauffähiger MVP.
   - Danach Historie, Benachrichtigungen, Reports und Komfortfunktionen ergänzen.
   - Jede Implementierungsstufe muss testbar und startbar sein.

5. **Keine stillen Annahmen bei Fachregeln**
   - Wenn eine Regel aus der Excel-Datei nicht eindeutig ableitbar ist, als TODO markieren und konfigurierbar vorbereiten.
   - Keine Grenzwerte oder Fehlergrenzen frei erfinden.

## Empfohlener Tech-Stack

### Backend

- Python 3.11+
- FastAPI
- Pydantic
- SQLAlchemy
- Alembic
- pytest
- openpyxl für Excel-Import
- APScheduler für einfache tägliche Jobs

### Frontend

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- React Hook Form
- Zod
- Eine UI-Bibliothek, bevorzugt MUI oder shadcn/ui

### Datenbank

- SQLite für lokale Entwicklung
- PostgreSQL für produktiven Betrieb

### Betrieb

- Docker Compose mit mindestens:
  - backend
  - frontend
  - database

## Zielstruktur

```text
pipettentool/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routers/
│   │   ├── services/
│   │   └── tests/
│   ├── alembic/
│   ├── scripts/
│   ├── pyproject.toml
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
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

## Fachliche Muss-Anforderungen

Alle folgenden Anforderungen müssen im System abgebildet werden.

### Hauptseite

Die Hauptseite enthält:

- Suchfunktion
- Pipettenübersicht
- Fälligkeitsübersicht
- Ampelstatus
- Button `Neue Pipette eintragen`

Die Suche muss mindestens unterstützen:

- Seriennummer
- Inventar-Nr.
- Registriernummer
- Hersteller / Bezeichnung
- Raum
- Verwendung
- Platz / Anwendung

Je Treffer sollen angezeigt werden:

- Standort / Laborraum
- Verwendung, z. B. `FuE` oder `Prüfungen`
- Platz / Anwendung
- nächster Kalibriertermin
- Ampelstatus
- Hinweis, ob Sartorius-relevant

### Detailseite

Jede Pipette braucht eine Detailseite mit:

- Stammdaten
- Standort
- Verwendung
- Platz / Anwendung
- aktuellem Kalibrierstatus
- letzter Kalibrierung
- nächstem Kalibriertermin
- Historie
- Sperrstatus
- Einsendungen zu Sartorius

### Neue Pipette eintragen

Das Formular muss folgende Felder enthalten:

- Pipette: Firma und Bezeichnung
- Inventar-Nr.
- Serien-Nr.
- Anzahl Kanäle
- Verwendung: Dropdown mit `FuE`, `Prüfungen`
- Typ: Dropdown mit `Luftpolsterpipette`, `Direktverdränger`
- Nennvolumen in µL
- Kalibrierintervall: Dropdown mit `6`, `12` Monate
- Platz / Anwendung: Dropdown mit:
  - `Sterilwerkbank`
  - `Assays`
  - `Qubit/Bioanalyzer`
  - `PCR-Platz`
  - `Extraktion cf-DNA`
  - `Prüfungen`
  - `Countess`
  - `ddPCR`
- Raum: Dropdown mit:
  - `Labor 1a`
  - `Labor 1b`
  - `Labor 3`

Optional, aber vorzubereiten:

- Neue Plätze / Anwendungen dürfen angelegt werden.
- Neue Einträge erscheinen danach dauerhaft im Dropdown.

Beim Speichern automatisch ergänzen:

- Registriernummer / laufende Nr.
- Bezeichnung, falls ableitbar
- Kalibrierstufen
- Fehlergrenzen, sofern fachliche Regeln vorhanden sind

### Fälligkeiten und Ampelsystem

Das Backend berechnet den Kalibrierstatus.

Standardregel:

- `grün`: nächster Kalibriertermin liegt mehr als 14 Tage in der Zukunft
- `gelb`: nächster Kalibriertermin liegt innerhalb der nächsten 14 Tage
- `rot`: Kalibriertermin ist überschritten
- `grau`: Pipette ist gesperrt oder außer Betrieb

Das Fälligkeitsfenster ist zunächst 14 Tage, muss aber später konfigurierbar sein.

### Sartorius-Regel

Eine Pipette ist als `requires_sartorius = true` zu markieren, wenn:

```text
nennvolumen_ul <= 25
```

Diese Regel gehört ins Backend und muss getestet werden.

### Historie

Änderungen an Pipetten müssen als Ereignisse gespeichert werden.

Mindestens folgende Eventtypen:

- `created`
- `updated`
- `room_changed`
- `application_changed`
- `calibrated`
- `blocked`
- `unblocked`
- `sent_to_sartorius`
- `returned_from_sartorius`
- `deleted` oder `deactivated`

Historieneinträge enthalten mindestens:

- Pipetten-ID
- Eventtyp
- Datum/Zeit
- alte Werte, soweit relevant
- neue Werte, soweit relevant
- Kommentar
- Benutzer, falls Authentifizierung vorhanden ist

### Benachrichtigungen

Vorbereiten und später implementieren:

- täglicher Job zur Prüfung fälliger Pipetten
- Liste aller in 14 Tagen fälligen Pipetten
- Liste aller überfälligen Pipetten
- optional E-Mail-Benachrichtigung
- Kalenderbenachrichtigung nur als spätere Erweiterung

E-Mail ist zuerst umzusetzen, Kalenderintegration später.

## Datenmodell

Starte mit folgenden Tabellen/Modellen.

### pipettes

Pflichtfelder:

- id
- register_number
- inventory_number
- serial_number
- manufacturer
- model_name
- description
- channel_count
- usage
- pipette_type
- nominal_volume_ul
- calibration_interval_months
- room_id
- application_id
- status
- created_at
- updated_at

Berechnete oder gespeicherte Zusatzfelder:

- requires_sartorius
- current_due_status
- latest_calibration_date
- next_calibration_due_date

Berechnete Felder sollen bevorzugt im Service erzeugt werden, nicht redundant gespeichert werden, außer Performance oder Reporting erfordern es.

### rooms

- id
- name
- active

Initialwerte:

- `Labor 1a`
- `Labor 1b`
- `Labor 3`

### applications

- id
- name
- active

Initialwerte:

- `Sterilwerkbank`
- `Assays`
- `Qubit/Bioanalyzer`
- `PCR-Platz`
- `Extraktion cf-DNA`
- `Prüfungen`
- `Countess`
- `ddPCR`

### calibrations

- id
- pipette_id
- calibration_date
- next_due_date
- result
- performed_by
- notes
- created_at

### pipette_events

- id
- pipette_id
- event_type
- event_date
- old_values_json
- new_values_json
- comment
- created_by

### shipments

Für Sartorius-Einsendungen:

- id
- pipette_id
- destination
- sent_date
- returned_date
- reason
- status
- notes

## Backend-Regeln

### Registriernummer

- Beim Anlegen einer Pipette automatisch vergeben.
- Muss eindeutig sein.
- Nicht im Frontend berechnen.
- Für MVP ist `max(register_number) + 1` erlaubt.
- Später besser Sequenz oder eigene Nummerntabelle verwenden.

### Kalibrierstufen

Grundregel, sofern fachlich bestätigt:

```text
10 % des Nennvolumens
50 % des Nennvolumens
100 % des Nennvolumens
```

Falls Excel abweichende Regeln enthält:

- Regeln extrahieren.
- In Service oder Konfiguration abbilden.
- Tests ergänzen.

### Fehlergrenzen

- Nicht frei erfinden.
- Aus Excel oder fachlicher Konfiguration ableiten.
- Solange unklar: Modell und Service vorbereiten, TODO setzen.

## API-Anforderungen

Implementiere die API in sinnvoller Reihenfolge.

### Health und Basis

- `GET /api/health`
- `GET /api/version`

### Pipetten

- `GET /api/pipettes`
- `GET /api/pipettes/{id}`
- `POST /api/pipettes`
- `PATCH /api/pipettes/{id}`
- optional statt Delete: `PATCH /api/pipettes/{id}/deactivate`

`GET /api/pipettes` muss Filter unterstützen:

- `q`
- `serial_number`
- `inventory_number`
- `register_number`
- `room_id`
- `application_id`
- `usage`
- `due_status`
- `requires_sartorius`

### Dashboard

- `GET /api/dashboard/summary`
- `GET /api/dashboard/due-soon`
- `GET /api/dashboard/overdue`
- `GET /api/dashboard/requires-sartorius`

### Kalibrierungen

- `GET /api/pipettes/{id}/calibrations`
- `POST /api/pipettes/{id}/calibrations`

### Historie

- `GET /api/pipettes/{id}/events`

### Stammdaten

- `GET /api/rooms`
- `POST /api/rooms`
- `GET /api/applications`
- `POST /api/applications`

## Frontend-Anforderungen

### Seiten

Implementiere folgende Seiten in dieser Reihenfolge:

1. Layout / App Shell
2. Dashboard
3. Pipettenliste
4. Pipetten-Detailseite
5. Neue Pipette eintragen
6. Pipette bearbeiten
7. Stammdatenverwaltung für Räume und Anwendungen
8. Import-/Adminseite, falls benötigt

### Komponenten

Wichtige Komponenten:

- `PipetteTable`
- `PipetteSearchBar`
- `DueStatusBadge`
- `SartoriusBadge`
- `PipetteForm`
- `PipetteDetailCard`
- `PipetteHistoryTimeline`
- `DashboardMetricCard`
- `CalibrationDueList`

### Frontend-Regeln

- API-Typen zentral definieren.
- Formulare mit Validierung bauen.
- Dropdown-Werte vom Backend laden.
- Keine doppelten Fachregeln im Frontend.
- Ampelfarbe aus Backend-Status ableiten, nicht neu berechnen.
- Fehlerzustände und Ladezustände anzeigen.

## Excel-Import

Implementiere ein Importskript oder einen Backend-Service.

Anforderungen:

- Excel-Datei lesen.
- Relevante Blätter erkennen.
- Spalten mappen.
- Datentypen bereinigen.
- Pflichtfelder validieren.
- Duplikate erkennen.
- Räume und Anwendungen gegen Stammdaten prüfen.
- Unbekannte Werte wahlweise anlegen oder als Fehler melden.
- Importprotokoll erzeugen.

Import darf keine unvollständigen oder widersprüchlichen Daten still übernehmen.

Mindestens zu prüfende Fehler:

- fehlende Seriennummer
- fehlende Inventar-Nr.
- doppelte Seriennummer
- ungültiges Nennvolumen
- ungültige Kanalanzahl
- unbekannter Raum
- unbekannte Anwendung
- ungültiges Kalibrierintervall

## Tests

Erstelle Tests für Backend-Services und API.

Pflichttests:

- Pipette anlegen erzeugt Registriernummer.
- Pipette mit `nominal_volume_ul <= 25` ist Sartorius-relevant.
- Pipette mit `nominal_volume_ul > 25` ist nicht Sartorius-relevant.
- Fälligkeit in mehr als 14 Tagen ergibt `green`.
- Fälligkeit innerhalb von 14 Tagen ergibt `yellow`.
- Überfällige Kalibrierung ergibt `red`.
- Gesperrte Pipette ergibt `gray`.
- Änderung am Raum erzeugt Historieneintrag.
- Änderung an Anwendung erzeugt Historieneintrag.
- Neue Anwendung kann angelegt und danach im Dropdown geladen werden.
- Excel-Import erkennt Duplikate.

## Implementierungsreihenfolge

Arbeite strikt in dieser Reihenfolge, außer ein bestehender Codebestand macht eine kleine Abweichung sinnvoll.

### Phase 1: Grundgerüst

- Repository-Struktur anlegen.
- Backend mit FastAPI starten.
- Frontend mit React/Vite starten.
- Docker Compose anlegen.
- Health-Endpunkt implementieren.
- Frontend ruft Health-Endpunkt auf.

Akzeptanzkriterium:

- `docker compose up` startet Backend und Frontend.
- Frontend zeigt an, dass Backend erreichbar ist.

### Phase 2: Datenbank und Stammdaten

- SQLAlchemy konfigurieren.
- Alembic konfigurieren.
- Modelle für Räume und Anwendungen anlegen.
- Seed-Daten für Räume und Anwendungen anlegen.
- API für Räume und Anwendungen implementieren.
- Frontend lädt Dropdown-Werte aus API.

Akzeptanzkriterium:

- Dropdowns im Frontend kommen aus der Datenbank.

### Phase 3: Pipetten-Stammdaten

- Pipettenmodell implementieren.
- Pydantic-Schemas implementieren.
- `POST /api/pipettes` implementieren.
- automatische Registriernummer implementieren.
- Sartorius-Regel implementieren.
- Pipettenliste `GET /api/pipettes` implementieren.
- Frontend: Pipettenliste anzeigen.

Akzeptanzkriterium:

- Eine neue Pipette kann angelegt und in der Liste angezeigt werden.

### Phase 4: Suche und Filter

- Query-Parameter für Suche und Filter implementieren.
- Frontend-Suche implementieren.
- Filter für Raum, Anwendung, Verwendung und Fälligkeitsstatus vorbereiten.

Akzeptanzkriterium:

- Suche nach Seriennummer und Inventar-Nr. funktioniert.

### Phase 5: Detailseite und Historie

- Pipettendetail-Endpoint implementieren.
- Eventmodell implementieren.
- History-Service implementieren.
- Automatische Historieneinträge bei Anlage und Änderung erzeugen.
- Frontend-Detailseite implementieren.
- Historie anzeigen.

Akzeptanzkriterium:

- Änderungen an Raum oder Anwendung erscheinen in der Historie.

### Phase 6: Kalibrierungen und Fälligkeit

- Kalibrierungsmodell implementieren.
- Kalibrierung anlegen.
- nächsten Kalibriertermin berechnen.
- Ampelstatus berechnen.
- Dashboardlisten für `due-soon` und `overdue` implementieren.
- Frontend zeigt Ampelstatus und fällige Pipetten.

Akzeptanzkriterium:

- Fällige, überfällige und nicht fällige Pipetten werden korrekt angezeigt.

### Phase 7: Eingabeformular finalisieren

- Alle Pflichtfelder des Formulars ergänzen.
- Validierung in Frontend und Backend ergänzen.
- Erweiterbare Anwendungen umsetzen.
- Fehlerzustände sauber anzeigen.

Akzeptanzkriterium:

- Das Formular entspricht vollständig den Anforderungen und speichert valide Daten.

### Phase 8: Excel-Import

- Excel-Importskript implementieren.
- Mapping dokumentieren.
- Importvalidierung implementieren.
- Importprotokoll erzeugen.
- Optional Admin-Endpoint oder CLI-Befehl bereitstellen.

Akzeptanzkriterium:

- Bestehende Excel-Daten können nachvollziehbar importiert werden.

### Phase 9: Benachrichtigungen

- Fälligkeitsjob implementieren.
- E-Mail-Konfiguration vorbereiten.
- tägliche Prüfung fälliger und überfälliger Pipetten.
- E-Mail-Versand optional aktivierbar machen.

Akzeptanzkriterium:

- Job kann lokal ausgeführt werden und erzeugt eine Liste fälliger Pipetten.

### Phase 10: Qualität, Sicherheit, Betrieb

- Tests vervollständigen.
- README ergänzen.
- Docker Setup stabilisieren.
- Logging ergänzen.
- Basisauthentifizierung oder Rollenmodell vorbereiten, falls benötigt.
- Fehlerbehandlung verbessern.

Akzeptanzkriterium:

- Projekt ist lokal reproduzierbar startbar und zentrale Fachregeln sind getestet.

## Coding-Konventionen

### Backend

- Router enthalten nur HTTP-spezifische Logik.
- Fachlogik liegt in Services.
- Datenbankmodelle liegen in `models`.
- API-Schemas liegen in `schemas`.
- Keine zirkulären Imports.
- Fehler mit passenden HTTP-Statuscodes beantworten.
- IDs nicht als fachliche Nummern missbrauchen.

### Frontend

- Komponenten klein halten.
- API-Zugriffe in `src/api` kapseln.
- Wiederverwendbare UI-Komponenten in `src/components`.
- Seiten in `src/pages`.
- TypeScript-Typen zentral pflegen.
- Keine `any`-Typen ohne Grund.

### Datenbank

- Eindeutige Constraints für Seriennummer, Inventar-Nr. und Registriernummer prüfen.
- Soft Delete bevorzugen, wenn Historie relevant ist.
- Migrationen immer mit Alembic erzeugen.

## Definition of Done

Eine Aufgabe ist fertig, wenn:

- Backend und Frontend starten.
- Relevante API-Endpunkte dokumentiert oder über OpenAPI sichtbar sind.
- Fachlogik im Backend liegt.
- Tests für neue Fachlogik vorhanden sind.
- Fehlerfälle behandelt werden.
- Frontend Lade-, Leer- und Fehlerzustände anzeigt.
- Keine Excel-Abhängigkeit in der normalen Laufzeit besteht.
- README oder Implementierungsplan aktualisiert wurde, falls Verhalten geändert wurde.

## Was vermieden werden soll

- Keine neue Excel-basierte Primärdatenhaltung.
- Keine Fachlogik nur im React-Code.
- Keine hart codierten Dropdowns im Frontend, außer als temporärer Startwert mit TODO.
- Keine ungeprüften Excel-Importe.
- Keine erfundenen Fehlergrenzen.
- Kein Löschen historisch relevanter Daten ohne Historieneintrag.
- Keine großen ungetesteten Refactorings in einem Schritt.

## Nächste sinnvolle Aufgabe für Codex

Beginne mit Phase 1:

1. Repository-Struktur anlegen.
2. FastAPI-Backend mit `/api/health` erstellen.
3. React/Vite-Frontend erstellen.
4. Frontend Health-Check gegen Backend anzeigen.
5. Docker Compose für Frontend und Backend ergänzen.
6. README mit Startanleitung schreiben.

Danach erst mit Datenbank, Stammdaten und Pipettenmodell fortfahren.
