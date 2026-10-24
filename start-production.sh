#!/usr/bin/env bash
# ==============================================================================
# Production Startup Script for Apex Dental Clinic ERP (Linux / macOS)
# ==============================================================================
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "========================================================"
echo "    APEX DENTAL CLINIC ERP - PRODUCTION SERVER"
echo "========================================================"

if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js is not installed. Please install Node.js (v18+)."
    exit 1
fi

if [ ! -f "client/dist/index.html" ]; then
    echo "[INFO] Client production build not detected. Building assets..."
    npm run build
fi

export NODE_ENV=production
export PORT=${PORT:-5000}
export HOST=${HOST:-0.0.0.0}

echo "[OK] Starting production server on http://$HOST:$PORT..."
exec node server/server.js
