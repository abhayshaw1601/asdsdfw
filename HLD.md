# HLD: Wind Forecast Decision Portal

## 1. Architecture
```
 Elexon BMRS API ──(offline ingest script)──> data/*.csv.gz (snapshot, committed)
                                                   │
                                        FastAPI backend (Vercel Python function; loads into pandas once per instance)
                                         ├─ forecast selection service
                                         ├─ metrics service
                                         └─ REST /api/v1/*
                                                   │ JSON
                                        React SPA (Vite + TS + Recharts)
```
**Production (Vercel):** React is built to static files served from Vercel's CDN; FastAPI runs as a Python serverless function at `/api/*` (entry `api/index.py`, data files bundled via `vercel.json` `includeFiles`). Same origin, so no CORS.

**Local / reviewer (Docker):** a multi-stage Dockerfile builds React and runs uvicorn serving both API and static files (`docker compose up`). Docker is not used by Vercel; it exists for reproducible local runs and to meet the brief.

## 2. Components
| Component | Responsibility |
|---|---|
| `ingest/` CLI | Pull FUELHH (WIND) and WINDFOR for the window, normalize, dedupe, write compressed CSV |
| `core/selection` | For each target time and deadline, pick latest publish <= deadline |
| `core/metrics` | MAE, RMSE, bias, quantiles, breakdowns |
| `api/` | FastAPI routers, Pydantic schemas, validation |
| `frontend/` | Pages: Decision view, Accuracy, Horizon analysis, Methodology |
| `notebooks/` | EDA and validation of methodology |

## 3. Key design decisions
1. **Snapshot data, not live calls.** Deterministic, fast, avoids rate limits and runtime failure in demo. Ingest script is reproducible. CSV.gz instead of Parquet keeps the serverless bundle small.
2. **Pandas in-memory.** Dataset is tiny (~1.5k half-hours x many forecast revisions), so no DB needed.
3. **Selection logic isolated and pure** so it is easy to test and explain.
4. **UTC internally**, Europe/London for deadline computation only.
5. **Vercel free tier** for hosting (static + Python function); **Docker** for local runs.
6. **Single Vercel project** serving SPA + API avoids CORS and a second deployment.
7. **Serverless caveats handled:** load data at module import (reused on warm instances), keep dependencies lean, no writes to disk.

## 4. Data flow (decision-time forecast)
1. Request: `day=2026-01-15`, `deadline_hour=9`.
2. Compute deadline = 2026-01-14 09:00 Europe/London -> UTC.
3. Filter forecasts with `startTime` in day D and `publishTime <= deadline`.
4. Group by `startTime`, take max `publishTime`.
5. Left-join actuals on `startTime`. Compute error. Return.

## 5. API surface
- `GET /api/v1/health`
- `GET /api/v1/meta` (data range, default deadline, counts)
- `GET /api/v1/forecast/decision?day=&deadline_hour=`
- `GET /api/v1/series?start=&end=&deadline_hour=`
- `GET /api/v1/metrics?start=&end=&deadline_hour=`
- `GET /api/v1/metrics/by-hour?...`
- `GET /api/v1/metrics/horizon?start=&end=`
- `GET /api/v1/buffer?start=&end=&quantile=0.95&deadline_hour=`

## 6. Quality and ops
- pytest (selection, metrics, API), ruff, mypy optional; vitest for key UI utils.
- GitHub Actions: lint + test + docker build (Vercel deploys from Git on push).
- Config via env vars (`DEFAULT_DEADLINE_HOUR`, `DATA_DIR`, `PORT` for Docker).
- Structured logging, `/api/v1/health` for checks.

## 7. Deployment
**Choice: Vercel** (the brief allows Vercel or Heroku; Heroku removed its free tier in Nov 2022, so Vercel is the only free option).
Vercel: connect the GitHub repo (or `vercel --prod` via CLI). `vercel.json` sets the frontend build/output dir, rewrites `/api/(.*)` to the Python function, and includes `data/**` in the function bundle. Verify the live URL in incognito.
