#!/bin/bash

echo "╔══════════════════════════════════════════╗"
echo "║   🔧 Fixing Groq Tab - Full Restart     ║"
echo "╚══════════════════════════════════════════╝"
echo ""

echo "Step 1: Killing all Node processes..."
pkill -9 node 2>/dev/null
sleep 2
echo "✅ Done"
echo ""

echo "Step 2: Clearing Vite cache..."
rm -rf node_modules/.vite
rm -rf node_modules/.cache
rm -rf dist
rm -rf .vite
sleep 1
echo "✅ Done"
echo ""

echo "Step 3: Verifying .env file..."
if grep -q "VITE_GROQ_API_KEY" .env; then
    echo "✅ Groq API key found in .env"
    grep "VITE_GROQ_API_KEY" .env | cut -c1-40
else
    echo "❌ ERROR: Groq API key NOT in .env!"
    echo "Please add: VITE_GROQ_API_KEY=gsk_..."
    exit 1
fi
echo ""

echo "Step 4: Starting dev server..."
echo "╔══════════════════════════════════════════╗"
echo "║  After server starts:                    ║"
echo "║  1. Open browser to http://localhost:5173║"
echo "║  2. Press F12 for console                ║"
echo "║  3. Check for: GROQ: ✅                  ║"
echo "║  4. Click 'Browse All Models'            ║"
echo "║  5. Groq tab should appear!              ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Starting in 3 seconds..."
sleep 3

npm run dev
