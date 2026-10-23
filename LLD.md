# LLD: Wind Forecast Decision Portal

## 1. Repo layout
```
/
├─ api/index.py            # Vercel entry: `from backend.app.main import app`
├─ vercel.json             # build, rewrites, includeFiles
├─ requirements.txt        # root, used by Vercel (fastapi, pandas, numpy, pydantic)
├─ backend/
│  ├─ app/
│  │  ├─ main.py            # FastAPI app (routes under /api/v1); static mount only when STATIC_DIR set (Docker)
│  │  ├─ config.py          # settings (pydantic-settings)
│  │  ├─ data_store.py      # loads CSV.gz once at import; exposes actuals_df, forecasts_df
│  │  ├─ core/
│  │  │  ├─ timeutil.py     # deadline_utc(day, hour, tz)
│  │  │  ├─ selection.py    # select_decision_forecasts(...)
│  │  │  └─ metrics.py      # compute_metrics, by_hour, horizon_bins, buffer
│  │  ├─ api/routes.py
│  │  └─ schemas.py
│  ├─ ingest/fetch_elexon.py
│  ├─ tests/
│  └─ requirements.txt
├─ frontend/ (Vite + React + TS)
│  └─ src/{api/,components/,pages/,hooks/,lib/}
├─ data/{actuals_wind.csv.gz, forecasts_wind.csv.gz}
├─ notebooks/eda.ipynb
├─ Dockerfile, docker-compose.yml   # local/reviewer use only
├─ .github/workflows/ci.yml
└─ README.md
```

## 2. Ingest (`fetch_elexon.py`)
- Base (confirmed working): `https://data.elexon.co.uk/bmrs/api/v1/datasets/{FUELHH|WINDFOR}/stream`
  - Required query params: `from=<ISO-date>` and `to=<ISO-date>` (e.g. `?from=2026-01-01&to=2026-01-08`).
  - ⚠️ Opening the URL in a browser **without params returns 404** — this is expected; always pass date params in code.
  - The `bmrs.elexon.co.uk/api-documentation/...` links in the spec are the JS doc portal, not callable API URLs.
- FUELHH: window startTime 2026-01-01..2026-02-01 UTC; keep `fuelType == "WIND"`; columns `startTime`, `generation`.
- WINDFOR: publishTime window 2025-12-15..2026-01-31; keep rows with `startTime` in Jan 2026; columns `startTime`, `publishTime`, `generation`.
- Chunk requests by 3-7 days if the API limits ranges; retry with backoff; parse ISO to tz-aware UTC.
- Dedupe: actuals on `startTime` (keep last); forecasts on (`startTime`, `publishTime`).
- Write `csv.gz` (ISO UTC timestamps); print summary (row counts, missing half-hours: expect 1488 for Jan).

## 3. Core logic
```python
# timeutil.py
def deadline_utc(day: date, hour: int = 9, tz="Europe/London") -> pd.Timestamp:
    local = pd.Timestamp(datetime.combine(day - timedelta(days=1), time(hour)), tz=tz)
    return local.tz_convert("UTC")


# selection.py
def select_decision_forecasts(fc: DataFrame, start: date, end: date, hour: int) -> DataFrame:
    """Per target startTime, latest forecast with publishTime <= deadline(day(startTime)).
    Vectorized: add column deadline = f(startTime local date), filter publishTime<=deadline,
    sort by publishTime, groupby startTime .tail(1). Adds horizon_h = (startTime-publishTime)/1h.
    Targets with no eligible forecast are dropped and counted."""
```
Note: day D is the **Europe/London** date of `startTime`.

```python
# metrics.py
err = forecast - actual
MAE=abs(err).mean(); RMSE=sqrt((err**2).mean()); bias=err.mean()
nMAE = MAE / actual.mean()
P50/P90/P95 = abs(err).quantile([.5,.9,.95])
by_hour: groupby local hour-of-day (0-23, half-hour as 0..47 optional)
horizon_bins: use ALL forecasts (not only decision-time), bin horizon_h by [0,6,12,18,24,36,48,72], metrics per bin
buffer(q, hour): quantile q of max(err,0) grouped by hour-of-day  # over-forecast risk
```

## 4. API schemas (Pydantic)
- `SeriesPoint {startTime, forecast, actual|null, publishTime, horizonHours, error|null}`
- `Metrics {n, mae, rmse, bias, nmae, p50, p90, p95}`
- `HourMetrics {hour, n, mae, rmse, bias}`
- `HorizonMetrics {binLabel, n, mae, rmse, bias}`
- `BufferRow {hour, bufferMw}`
- `DecisionResponse {day, deadlineUtc, deadlineLocal, points[], summary{minMw,maxMw,meanMw}}`
Validation: dates within Jan 2026 (+ meta range), hour 0-23, quantile in (0,1); 422 on bad input.

## 5. Frontend
- Libraries: React 18, TypeScript, Vite, Recharts, TanStack Query, Tailwind.
- Global filter bar: date range, deadline hour (default 09).
- Pages/tabs:
  1. **Decision**: day picker, KPI cards (deadline, mean forecast, peak, last publishTime), line chart forecast (+ actual overlay when available), table with publishTime.
  2. **Accuracy**: KPI cards (MAE, RMSE, bias, P95), actual vs forecast line, error histogram, scatter, by-hour bar.
  3. **Horizon**: error vs horizon bar/line; callout showing the chosen deadline's typical horizon.
  4. **Buffer**: P90/P95 buffer by hour; plain-English interpretation.
  5. **Methodology**: assumptions, definitions.
- UX: loading skeletons, error toasts, units (MW/GW) toggle, consistent colors (forecast blue, actual orange), empty state when no actuals yet.

## 6. Tests
- selection: forecast published after deadline is never chosen; ties; no eligible forecast; DST-safe deadline conversion (test with a summer date for tz logic).
- metrics: hand-computed small fixture.
- API: 200 shapes, 422 on invalid input.
- Cross-check API metrics vs notebook output.

## 7. Vercel config
`vercel.json` (outline):
```json
{
  "buildCommand": "cd frontend && npm ci && npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [{ "source": "/api/(.*)", "destination": "/api/index.py" }],
  "functions": { "api/index.py": { "includeFiles": "data/**" } }
}
```
Notes: FastAPI app must expose `app`; paths inside FastAPI keep the `/api/v1` prefix so rewrites need no stripping; use relative `/api/v1/...` URLs in the frontend; `DATA_DIR` resolves relative to the file, not CWD. Keep bundle well below 250 MB (no pyarrow, no matplotlib/jupyter in root requirements; put dev deps in `backend/requirements-dev.txt`). If framework detection misbehaves, check Vercel's current FastAPI/Python docs.

## 8. Dockerfile (local only, outline)
```
FROM node:20 AS fe; WORKDIR /fe; COPY frontend .; RUN npm ci && npm run build
FROM python:3.12-slim; WORKDIR /app
COPY backend/requirements.txt .; RUN pip install -r requirements.txt
COPY backend .; COPY data /app/data; COPY --from=fe /fe/dist /app/static
ENV STATIC_DIR=/app/static
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```
Set `STATIC_DIR=/app/static` in Docker so FastAPI serves the SPA there. `docker-compose.yml` maps 8000:8000.
