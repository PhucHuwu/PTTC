#!/bin/bash
cd /root/PTTC/backend
exec /root/PTTC/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
