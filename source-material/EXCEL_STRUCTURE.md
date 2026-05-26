# Excel Source Structure

Quelle: `FB 085 Prüfung_Pipetten.xlsm`

Die Datei ist eine Makro-Arbeitsmappe mit neun Blättern. Für den MVP-Import ist primär `Inventar_Pipetten` relevant.

## Relevante Blätter

- `Inventar_Pipetten`: Stammdaten der Pipetten, Kalibrierstufen, Fehlergrenzen, Nutzung, Typ, Nennvolumen, Intervall, Anwendung und Raum.
- `Eingabe_Allgemein`: Eingabemaske der alten Excel-Lösung.
- `Eingabe_Messwerte_EK` und `Eingabe_Messwerte_MK`: Messwerte für Ein- und Mehrkanalpipetten.
- `Report_EK` und `Report_MK`: Report-Ausgaben.
- `Berechnungen`: berechnete Prüfvolumina und Grenzwerte.
- `Datenspeicher_EK` und `Datenspeicher_MK`: gespeicherte Messwerte und berechnete Volumina.

## Inventar_Pipetten Mapping

| Excel-Spalte | Bedeutung | Ziel im neuen System |
| --- | --- | --- |
| A | Pipette | `manufacturer` / `model_name` oder Quellbezeichnung |
| B | Register_Nr | `register_number` |
| C | Inventar-Nr. | `inventory_number` |
| D | Seriennummer | `serial_number` |
| E | Bezeichnung | `description` |
| F-H | Kalibrierstufen | `calibration_levels` |
| I-K | zulässiger systematischer Fehler | `error_limits.max_systematic_error` |
| L-N | zulässiger zufälliger Fehler | `error_limits.max_random_error` |
| O/Q | Anzahl Kanäle / Kanäle | `channel_count` |
| P | Verwendung | `use` und ggf. Statusableitung |
| R | Typ 2 | `pipette_type` |
| S | Nennvolumen [µL] | `nominal_volume_ul` |
| T | Kalibrierintervall | `calibration_interval_months` |
| U | Platz / Anwendung | `application` |
| V | Raum | `room` |

## Datenqualität

Die Datei enthält unvollständige und doppelte Werte. Der Import muss deshalb validieren und ein Protokoll erzeugen.

- Fehlende Inventar-Nummern kommen vor.
- Fehlende Seriennummern kommen vor.
- Doppelte Seriennummern kommen vor.
- Doppelte Register-Nummern kommen vor.
- `gesperrt, FuE` in `Verwendung` muss in Nutzung und Status zerlegt werden.
