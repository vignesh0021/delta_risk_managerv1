FROM python:3.11-slim

WORKDIR /app

# Install dependencies first for better layer caching.
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the backend package.
COPY backend ./backend

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Bind to the platform-provided $PORT (defaults to 8000 locally).
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
