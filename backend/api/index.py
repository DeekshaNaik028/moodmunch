# backend/api/index.py - VERCEL SERVERLESS ENTRY POINT
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from main import app

# Vercel expects a variable named 'app' or 'handler'
# FastAPI app works directly with Vercel
handler = app