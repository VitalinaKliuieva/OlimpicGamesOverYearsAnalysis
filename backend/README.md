# Backend

## Setup

```bash
cd backend
python -m venv .venv
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
```

Put the Olympic athlete/event CSV in `backend/data/`. The default preferred filename is
`athlete_events.csv`. The app maps common
column names (including `NOC`, `Team`, and `Country`) automatically.

Start the API:

```bash
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

