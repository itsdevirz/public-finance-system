#!/bin/bash
echo "Starting Public Finance System..."

cd backend
npm install
npm run dev &
BACKEND_PID=$!

cd ../frontend
npm install
npm run dev &
FRONTEND_PID=$!

wait $BACKEND_PID $FRONTEND_PID
