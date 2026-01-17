#!/bin/sh
echo "🚀 Starting MARCUS MCP..."
echo "📂 Current Directory: $(pwd)"
echo "📂 Dist Content:"
ls -R dist
echo "--------------------------------"

# Attempt to start the app
node dist/index.js

# If it crashes, capture exit code
EXIT_CODE=$?
echo "❌ Node exited with code $EXIT_CODE"

# Keep container alive for debugging if it fails
if [ $EXIT_CODE -ne 0 ]; then
    echo "⚠️  CRASH DETECTED. Keeping container alive for 1 hour..."
    sleep 3600
fi
