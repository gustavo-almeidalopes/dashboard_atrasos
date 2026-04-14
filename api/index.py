"""Vercel serverless entry point — exports the FastAPI app."""

import sys
from pathlib import Path

# Ensure project root is on the Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from main import app  # noqa: E402, F401
