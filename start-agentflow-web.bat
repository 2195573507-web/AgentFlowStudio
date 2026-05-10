@echo off
cd /d "%~dp0"
echo Starting LocalAI Nexus Web fallback...
echo URL: http://127.0.0.1:5173
echo.
start "" "http://127.0.0.1:5173"
call npm.cmd run fallback:web
pause
