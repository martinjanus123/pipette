# Evaluation

Die Bewertung wird pro Run ueber Docker Compose ausgefuehrt und schreibt ihre Ergebnisse in `evaluation-results/`.

## Befehl

```powershell
.\evaluation\run-evaluation.ps1 -RunPath .\runs\<run-folder>
```

## Ausgaben

- `summary.json`: Exitcodes und Zeitstempel.
- `backend-pytest.txt`: Backend-Testausgabe.
- `frontend-test.txt`: Frontend-Testausgabe.
- `sonar-scanner.txt`: Sonar-Scanner-Ausgabe, wenn Sonar aktiviert ist.

## Sonar aktivieren

Sonar ist optional, weil ein lokaler Token und ein laufender SonarQube-Server benoetigt werden.

```powershell
$env:SONAR_HOST_URL = "http://localhost:9000"
$env:SONAR_TOKEN = "<token>"
.\evaluation\run-evaluation.ps1 -RunPath .\runs\<run-folder> -RunSonar
```

Der Scanner wird ueber Docker gestartet.
