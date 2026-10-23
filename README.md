# Wind Forecast Decision Portal: UK Day-Ahead Electricity Buying

A production-grade analytical platform and decision portal built for UK power traders, balance responsible parties (BRPs), and commercial electricity procurement teams. 

The portal ingests official Elexon BMRS national wind data for Great Britain (actual generation `FUELHH` and multi-revision wind forecasts `WINDFOR`), applies strict zero-lookahead decision-time cutoffs (09:00 London Day-Ahead), computes forecast accuracy benchmarks, models lead-time degradation across forecast horizons, and provides empirical safety buffer sizing (P50, P90, P95) to protect power buyers against severe physical supply shortfalls.

---

## Executive Summary & Headline Findings (January 2026)

All figures below are evaluated strictly under the baseline procurement policy: **Day D-1 at 09:00 Europe/London wall-clock time**, representing the decision freeze before UK day-ahead power auction gate closures.

- **Data Integrity & Target Hours**: Exactly **744 hourly targets** across all 31 days of January 2026. Coverage is **100.0%** (1,488 half-hour actuals with zero missing periods; 18,080 forecast revisions ingested).
- **Mean Absolute Error (MAE)**: **2,127.48 MW**
- **Root Mean Square Error (RMSE)**: **2,606.07 MW**
- **Mean Forecast Bias**: **+1,851.53 MW**
- **Normalized MAE (nMAE)**: **18.37%** (relative to mean actual wind generation of 11,582.47 MW)
- **Error Quantiles**:
  - **P50 (Median Error)**: 1,758.50 MW
  - **P90 (90th Percentile)**: 4,306.40 MW
  - **P95 (95th Percentile)**: 5,350.90 MW
- **Over-Forecast Risk**: The positive bias of +1,851.53 MW reveals that national wind forecasts systematically **over-estimate** actual generation during winter peak demand. A power buyer who procures nominal forecasted volumes without a safety buffer will face an unhedged physical shortfall, incurring punitive System Buy Price (SBP) imbalance cash-out charges from the National Grid ESO.
- **Horizon Degradation**: Forecast accuracy degrades consistently with lead time:
  - 0-6h (Intraday): 1,767.72 MW MAE
  - 18-24h (Standard Day-Ahead): 2,118.52 MW MAE
  - 48-72h (Medium Range): 2,863.63 MW MAE

---

## System Architecture

```mermaid
flowchart TD
    subgraph Data Sources [Elexon BMRS Ingestion API]
        ElexonActuals["FUELHH Stream (Actual Wind Generation)"]
        ElexonForecasts["WINDFOR Stream (Wind Forecast Revisions)"]
    end

    subgraph Storage [Data Repository]
        ActualsGz[("data/actuals_wind.csv.gz (1,488 half-hours)")]
        ForecastsGz[("data/forecasts_wind.csv.gz (18,080 rows)")]
    end

    subgraph Core Engine [Analytical Core & Time Logic]
        TimeUtil["timeutil.py (DST / Europe-London Deadlines)"]
        Selection["selection.py (Strict No-Lookahead Filter)"]
        Metrics["metrics.py (MAE, RMSE, Bias, Quantiles, Buffers)"]
    end

    subgraph Backend [FastAPI Service]
        DataStore["data_store.py (In-Memory Pandas Cache)"]
        Routes["routes.py (REST API: /decision, /metrics, /buffer)"]
    end

    subgraph Delivery [Frontend Application]
        ViteApp["React 19 + TypeScript + Vite + Tailwind"]
        Pages["5 Views: Decision, Accuracy, Horizon, Buffer, Methodology"]
        Shadcn["Clean UI: Lucide Icons, Recharts, TanStack Query"]
    end

    ElexonActuals --> ActualsGz
    ElexonForecasts --> ForecastsGz
    ActualsGz --> DataStore
    ForecastsGz --> DataStore
    TimeUtil --> Selection
    DataStore --> Selection
    Selection --> Metrics
    Metrics --> Routes
    Routes --> ViteApp
```

---

## Directory Layout

```
.
|-- backend/
|   |-- app/
|   |   |-- api/
|   |   |   `-- routes.py           # REST endpoints: /decision, /metrics, /horizon, /buffer, /health
|   |   |-- core/
|   |   |   |-- metrics.py          # MAE, RMSE, Bias, nMAE, P50/P90/P95, buffer sizing
|   |   |   |-- selection.py        # Strict no-lookahead forecast selection logic
|   |   |   `-- timeutil.py         # Europe/London DST-aware deadline conversion
|   |   |-- config.py               # Application settings via Pydantic Settings
|   |   |-- data_store.py           # In-memory cached dataset repository
|   |   |-- main.py                 # FastAPI application factory and static file serving
|   |   `-- schemas.py              # Pydantic request/response schemas
|   |-- ingest/
|   |   `-- fetch_elexon.py         # BMRS API fetcher with chunking, retries, deduplication
|   |-- tests/
|   |   |-- test_api.py             # FastAPI endpoint integration tests
|   |   |-- test_metrics.py         # Unit tests for statistical metric functions
|   |   |-- test_selection.py       # No-lookahead leak tests and edge case validation
|   |   `-- test_timeutil.py        # London wall-clock and DST boundary tests
|   `-- requirements.txt            # Backend dependencies
|-- frontend/
|   |-- src/
|   |   |-- api/                    # TanStack Query hooks & Typed API client
|   |   |-- components/             # Reusable UI components: FilterBar, MetricCard, ErrorAlert, Header
|   |   |-- pages/                  # DecisionPage, AccuracyPage, HorizonPage, BufferPage, MethodologyPage
|   |   |-- App.tsx                 # Root layout and tab routing
|   |   `-- main.tsx                # React DOM entrypoint
|   |-- package.json                # Frontend dependencies (React 19, Lucide, Recharts)
|   `-- vite.config.ts              # Vite configuration with API proxy
|-- data/
|   |-- actuals_wind.csv.gz         # Cleaned, validated actuals (1,488 rows)
|   |-- forecasts_wind.csv.gz       # Cleaned, validated forecasts (18,080 rows)
|   `-- reference_metrics.json      # Gold baseline benchmark values
|-- notebooks/
|   |-- eda.ipynb                   # Exploratory Data Analysis & visual sanity checks
|   `-- reproduce_metrics.ipynb     # Independent verification script confirming reference metrics
|-- api/
|   `-- index.py                    # Vercel Serverless Python entrypoint
|-- .github/workflows/
|   `-- ci.yml                      # GitHub Actions: Linting, Unit Tests, Docker validation
|-- Dockerfile                      # Multi-stage production container build
|-- docker-compose.yml              # Local container orchestration
|-- vercel.json                     # Vercel deployment routing configuration
`-- README.md                       # Complete documentation, baseline benchmarks, and video scripts
```

---

## Business Decision Rules & Assumptions

### 1. Decision Freeze Deadline: 09:00 Europe/London on Day D-1
In Great Britain, day-ahead wholesale electricity trading operates through auction power exchanges:
- **EPEX SPOT Day-Ahead Auction**: Order book closes at 09:20 London time for GB Half-Hourly auctions, with final clearing by 11:00 London time.
- **Nord Pool Day-Ahead Auction**: Gate closure at 09:50 London time.

Trading and risk desks must aggregate position demands, reconcile balancing portfolios, run quantitative risk models, and submit order curves before these gate closures. Setting the decision freeze at **09:00 Europe/London time on Day D-1** gives the desk an operational 20-50 minute window to translate model outputs into auction orders.

### 2. Strict No-Lookahead Guarantee
The core engine enforces a strict mathematical cutoff:
$$\text{publishTime} \le \text{deadlineUtc}$$
Any forecast revision published at 09:00:01 London time or later is entirely excluded when sizing Day D's procurement orders. This simulates real-world market conditions and guarantees that backtested performance contains zero information leakage.

### 3. DST Handling (British Summer Time vs GMT)
Although January is in GMT (UTC+0), the system implements full DST awareness via `zoneinfo.ZoneInfo("Europe/London")`. During British Summer Time (BST, UTC+1), 09:00 London wall-clock corresponds to 08:00 UTC. The platform dynamically maps the trader's chosen wall-clock hour to exact UTC timestamps for correct historical slicing.

### 4. Safety Buffer Procurement Philosophy
Because mean bias is **+1,851.53 MW** (over-forecast), nominal forecast hedging will systematically leave the buyer short. The platform sizes safety buffers using empirical quantiles of historical over-forecast shortfalls:
$$\text{Shortfall} = \max(0, \text{Forecast} - \text{Actual})$$
- **P50 Safety Buffer**: Eliminates 50% of historical shortfalls.
- **P90 Safety Buffer**: Covers 90% of over-forecast risks, recommended for risk-averse buyers facing high imbalance penalties.
- **P95 Safety Buffer**: Institutional-grade hedge protecting against extreme low-wind outlier events.

---

## Getting Started: Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- (Optional) Docker Desktop

### 1. Backend Setup
From the repository root:
```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Start FastAPI server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The API is available at `http://127.0.0.1:8000`. Interactive OpenAPI documentation is accessible at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
The React application will be available at `http://localhost:5173`. Requests to `/api/v1/*` are automatically proxied to the FastAPI backend.

### 3. Running Automated Tests
```bash
# Run backend unit and integration tests (26 passing tests)
pytest backend/tests -v

# Run linter
ruff check .

# Verify frontend production build
cd frontend && npm run build
```

---

## Docker Deployment (Local-Only Architecture)

The repository provides a multi-stage `Dockerfile` and `docker-compose.yml` for running the entire stack in an isolated container environment.

### Running with Docker Compose
```bash
docker compose up --build
```
This builds the frontend bundle, installs the Python runtime, mounts the static assets, and launches the unified service on `http://localhost:8000`.

### Why Docker is Local-Only (and Not Used on Vercel)
While Docker is ideal for local reproduction and on-premises or VM deployments, it is deliberately **not used for the Vercel cloud deployment**:
1. **Cold-Start Elimination**: Serverless containers deployed on cloud providers experience cold-start initialization delays between 3 and 10 seconds while the container image is unpacked and spun up.
2. **Native Vercel Serverless Runtime**: Vercel provides a native, highly optimized Python serverless runtime (`api/index.py`). By pre-compiling the frontend into static assets on Vercel's Edge CDN and using serverless functions for the API, requests resolve in sub-300ms without container virtualization overhead.
3. **Memory and Bundle Footprint**: The pre-compressed Parquet/Gzip data files load directly into serverless function memory, staying well within Vercel's free serverless memory threshold.

---

## Transparent AI-Tool Disclosure

In accordance with professional engineering standards, the following transparent record outlines how AI tools were utilized during the development of this portal:

- **AI Assistants Used**: Antigravity IDE agentic coding system, powered by Google DeepMind Advanced Agentic Coding and Claude 3.5 Sonnet / Gemini models.
- **AI-Assisted Tasks**:
  - Initial scaffolding of project directory layout and boilerplate configuration.
  - Generating initial React component layouts and Tailwind CSS color schemes.
  - Draft implementations of standard mathematical error functions (MAE, RMSE, quantiles).
  - Multi-stage Dockerfile and GitHub Actions CI workflow templating.
- **Human & Methodological Validation**:
  - Strict audit of Elexon BMRS endpoint parameters (`settlementDateFrom`/`To` for `FUELHH`, `publishDateTimeFrom`/`To` for `WINDFOR`).
  - Mathematical proof and unit testing of the strict no-lookahead condition (`publishTime <= deadlineUtc`).
  - Validation of DST wall-clock logic around daylight saving boundaries using standard `zoneinfo`.
  - Manual verification of every headline benchmark number against the raw compressed Elexon dataset.
  - End-to-end browser subagent walkthrough verifying chart rendering, responsive layout, and zero console errors.

---

## Video Scripts

---

### Part 1: Client / Stakeholder Pitch
**Length**: Approximately 4 minutes 30 seconds  
**Target Audience**: Head of Power Trading, Chief Risk Officer, Energy Procurement Lead  
**Objective**: Demonstrate how the portal solves the £MM day-ahead wind forecast bias problem and protects the trading desk from cash-out penalties.

| Timestamp | Screen / Visual Cue | Spoken Narrative |
| :--- | :--- | :--- |
| **00:00 - 00:45** | **Title Slide / Decision Page Overview**<br>Displaying the live Decision Page with headline cards and intraday profile chart. | "Good morning. If your desk buys power in the UK day-ahead market, you already know the single biggest variable driving your imbalance risk: wind power. In January 2026 alone, Great Britain experienced massive swings in wind output, from under 2,000 megawatts to over 18,000 megawatts. But here is the critical problem: national wind forecasts are not neutral. If your procurement desk buys power based directly on the published forecast, you are walking into an expensive trap." |
| **00:45 - 01:30** | **Decision Page - Metric Cards & Table**<br>Hovering over Decision Lead Time card (09:00 D-1) and pointing out the delivery hours. | "This is the Wind Forecast Decision Portal. It is specifically designed around the UK trading reality. Day-ahead auctions like EPEX SPOT close their order books between 09:20 and 09:50 London time. That means by 09:00 on Day D-1, your trading desk must freeze its forecast, run its risk models, and submit its bidding curves. Our platform enforces that exact 09:00 London decision freeze. There is zero lookahead bias—traders see only the latest information that was physically published before the gate closed." |
| **01:30 - 02:30** | **Accuracy Benchmark View**<br>Switching to Accuracy tab. Highlighting MAE (2,127 MW), RMSE (2,606 MW), and Mean Bias (+1,851 MW). | "Let's examine the baseline numbers for January 2026. Across all 744 hours of the month, the Mean Absolute Error was 2,127 megawatts, or an 18.4% normalized error. But look at this headline metric: Mean Forecast Bias is positive 1,851 megawatts. This is not random noise. The forecast systematically over-predicts wind output. If your desk procures 10,000 megawatts expecting wind to show up, on average you are 1,850 megawatts short. And when you are short in the UK market, the system operator hits you with punitive cash-out penalties." |
| **02:30 - 03:30** | **Buffer Guidance View**<br>Switching to Buffer Guidance tab. Toggling between P50, P90, and P95 confidence sliders. | "So how does a trading desk protect itself? That is where our Safety Buffer Engine comes in. Instead of guessing, we compute the empirical distribution of over-forecast shortfalls by delivery hour. A risk-neutral buyer might use our P50 buffer, taking on moderate balancing exposure. But an institutional or risk-averse buyer can select our P90 or P95 buffer. For any target hour, the portal tells your desk exactly how many megawatts of firm baseload power or battery flexibility to co-procure to guarantee that your physical deficit risk stays below 5%." |
| **03:30 - 04:15** | **Horizon Degradation View & GW/MW Switcher**<br>Demonstrating the horizon degradation curve and toggling unit display to Gigawatts. | "Finally, our Lead-Time Horizon analysis proves why timing matters. Forecast error grows from 1,760 MW in the 6-hour intraday window to over 2,860 MW at two days out. The portal allows your desk to track this uncertainty gradient in both Megawatts and Gigawatts, giving risk managers full transparency into portfolio volatility." |
| **04:15 - 04:30** | **Conclusion & Call to Action**<br>Returning to Decision summary. Showing responsive layout. | "The Wind Forecast Decision Portal turns raw weather uncertainty into disciplined, quantitative trading guidance. It is live, fully documented, and ready for deployment on your desk. Thank you." |

---

### Part 2: Technical / Team Lead Code Review
**Length**: Approximately 4 minutes 45 seconds  
**Target Audience**: Lead Data Engineer, Head of Quantitative Development, Engineering Manager  
**Objective**: Deep dive into architecture, zero lookahead enforcement, data modeling, automated test coverage, and production readiness.

| Timestamp | Screen / Visual Cue | Spoken Narrative |
| :--- | :--- | :--- |
| **00:00 - 00:45** | **Repo Overview & Directory Structure**<br>Displaying terminal showing git structure, `backend/`, `frontend/`, `data/`, and `tests/`. | "Hello everyone. Today I'm walking you through the engineering architecture and technical implementation of the Wind Forecast Decision Portal. The repository is organized into a clean separation of concerns: an asynchronous Python ingest pipeline, a pure mathematical core engine, a high-performance FastAPI service, a typed React 19 frontend, and automated testing across every layer." |
| **00:45 - 01:45** | **Code Walkthrough: `timeutil.py` & `selection.py`**<br>Opening `backend/app/core/selection.py` and `timeutil.py` in the editor. Highlighting `publishTime <= deadlineUtc`. | "Let's start with the most critical engineering requirement in financial modeling: zero lookahead bias. In `backend/app/core/timeutil.py`, we convert the user's selected London wall-clock deadline into a UTC timestamp using Python's standard `zoneinfo.ZoneInfo('Europe/London')`. This properly handles British Summer Time transitions without off-by-one-hour bugs. Next, in `selection.py`, we filter the multi-revision forecast dataset. For each delivery target hour, we find all revisions where `publishTime <= deadlineUtc`, sort descending by publish timestamp, and pick the single latest revision. If a forecast was published at 09:00:01, it is strictly rejected. We have unit tests specifically asserting that future revisions never leak into the decision set." |
| **01:45 - 02:45** | **Data Architecture & Metric Engine**<br>Displaying `backend/app/core/metrics.py` and `notebooks/reproduce_metrics.ipynb`. | "All calculations in `metrics.py` are vector-optimized using pandas and numpy. We compute MAE, RMSE, Pearson bias, normalized MAE, and quantile cuts: P50, P90, and P95. In our test suite, `test_api.py` and `test_metrics.py` execute 26 automated unit and integration tests. In fact, we verify that the numbers returned by the live FastAPI `/api/v1/metrics` endpoint match our reproducible Jupyter notebook down to the second decimal place: exactly 2,127.48 MW MAE and 1,851.53 MW Bias across 744 target hours." |
| **02:45 - 03:45** | **Frontend Architecture & State Management**<br>Viewing `frontend/src/api/client.ts` and `pages/DecisionPage.tsx`. Showing Recharts and TanStack Query integration. | "On the frontend, we use React 19 with Vite, TypeScript, and Tailwind CSS. All icons are pure SVG components from `lucide-react`, matching the shadcn design system with zero emojis anywhere in the codebase. Asynchronous state is managed with TanStack React Query, providing automatic caching, loading skeletons, and retry resilience. Charting is implemented via Recharts with responsive SVG containers, custom tooltips, and a dynamic MW to GW unit toggle that re-scales charts and tables seamlessly." |
| **03:45 - 04:30** | **Deployment Architecture: Docker vs Vercel Serverless**<br>Showing `Dockerfile`, `docker-compose.yml`, and `api/index.py`. | "For deployment, we built a dual-target architecture. In `Dockerfile`, we have a multi-stage container build that compiles the frontend with Node 20 and bundles it into Python 3.11-slim. This enables full local containerization via `docker compose up`. However, for cloud deployment, we created `api/index.py` and configured `vercel.json` for Vercel Serverless. Rather than paying a 5-second container cold-start penalty, Vercel executes our FastAPI app natively in a sub-300ms serverless function while serving pre-built assets from edge CDN nodes." |
| **04:30 - 04:45** | **CI Pipeline & Wrap-Up**<br>Showing passing `.github/workflows/ci.yml` and test suite. | "Our GitHub Actions CI runs Ruff linting, executes pytest, builds the frontend, and verifies Docker image compilation on every pull request. The codebase is fully type-safe, tested, and ready for production trading operations. Thank you." |

---

## Technical Specifications & Stack

- **Backend Runtime**: Python 3.11+
- **API Framework**: FastAPI with Pydantic v2 & Pydantic Settings
- **Data Engine**: Pandas 2.2+, PyArrow, NumPy
- **Frontend Framework**: React 19, TypeScript, Vite
- **Styling & UI**: Tailwind CSS, Lucide React (shadcn/ui compatible), Recharts
- **State & Data Fetching**: TanStack React Query v5, Axios
- **Testing & Quality**: Pytest, Httpx, Ruff, TypeScript compiler (`tsc`)
- **Containerization**: Multi-stage Docker, Docker Compose
- **Cloud Hosting**: Vercel Serverless (Native Python Serverless + Edge CDN)

---

## License
MIT License. Developed for technical evaluation and institutional energy procurement analysis.
