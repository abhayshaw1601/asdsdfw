# Stage 1: Build React + Vite TypeScript Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Python FastAPI Backend + Static SPA
FROM python:3.11-slim
WORKDIR /app

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy self-contained backend (including backend/data) and static frontend dist
COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist /app/static

ENV STATIC_DIR=/app/static
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

EXPOSE 8000

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
