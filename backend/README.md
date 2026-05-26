# Backend

FastAPI-Skeleton fuer das Pipettentool-Experiment.

## Start lokal

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .
uvicorn app.main:app --reload
```

## Tests

```powershell
pytest
```
