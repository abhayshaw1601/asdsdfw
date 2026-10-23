"""Vercel FastAPI service entrypoint."""

import sys
import types
from pathlib import Path

# Resolve directory (/var/task in Vercel isolated service deployment)
current_dir = Path(__file__).resolve().parent

if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

parent_dir = current_dir.parent
if str(parent_dir) not in sys.path:
    sys.path.insert(0, str(parent_dir))

# When deployed as an isolated service (root: "backend"), /var/task is the backend directory.
# Dynamically alias the 'backend' module to point to current_dir so all 'from backend.app...' imports succeed.
if "backend" not in sys.modules:
    backend_pkg = types.ModuleType("backend")
    backend_pkg.__path__ = [str(current_dir)]
    sys.modules["backend"] = backend_pkg

from backend.app.main import app  # noqa: E402

__all__ = ["app"]
