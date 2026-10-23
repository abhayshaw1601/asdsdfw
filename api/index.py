"""Vercel Serverless Function adapter.
Routes incoming serverless HTTP requests to backend.app.main:app.
"""

import sys
from pathlib import Path

# Ensure root workspace is on path so backend can be imported
root_path = Path(__file__).resolve().parent.parent
if str(root_path) not in sys.path:
    sys.path.insert(0, str(root_path))

from backend.app.main import app  # noqa: E402

__all__ = ["app"]
