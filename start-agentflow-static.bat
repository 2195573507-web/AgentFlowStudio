@echo off
cd /d "%~dp0"
echo Starting AgentFlow Studio Static fallback...
echo URL: http://127.0.0.1:4173
echo.
start "" "http://127.0.0.1:4173"
call npm.cmd run fallback:static
pause
