@echo off
setlocal
cd /d "%~dp0"
echo Starting AgentFlow Studio desktop app...
echo Project: %CD%
echo.
call npm.cmd run dev
pause
