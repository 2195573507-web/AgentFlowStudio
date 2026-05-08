@echo off
setlocal EnableExtensions

cd /d "%~dp0"

if not exist "logs" mkdir "logs"
set "LAUNCHER_LOG=%CD%\logs\launcher-static.log"

> "%LAUNCHER_LOG%" echo ==================================================
>> "%LAUNCHER_LOG%" echo [AgentFlow Studio] Static launcher log
>> "%LAUNCHER_LOG%" echo Start time: %DATE% %TIME%
>> "%LAUNCHER_LOG%" echo Project path: %CD%
>> "%LAUNCHER_LOG%" echo ==================================================

call :say start
call :say path
echo %CD%
call :say log
echo %LAUNCHER_LOG%
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  call :say nodeMissing
  >> "%LAUNCHER_LOG%" echo [ERROR] Node.js was not found.
  pause
  exit /b 1
)

node -v
node -v >> "%LAUNCHER_LOG%" 2>>&1

if not exist "scripts\static-server.js" (
  call :say serverMissing
  >> "%LAUNCHER_LOG%" echo [ERROR] scripts\static-server.js was not found.
  pause
  exit /b 1
)

call :say serverStart
call :say browser
>> "%LAUNCHER_LOG%" echo [AgentFlow Studio] Static server is starting.
echo.

node "scripts\static-server.js" >> "%LAUNCHER_LOG%" 2>>&1
set "EXIT_CODE=%ERRORLEVEL%"

echo.
call :say exited
echo %EXIT_CODE%
>> "%LAUNCHER_LOG%" echo [AgentFlow Studio] Static server exited with code: %EXIT_CODE%
call :say log
echo %LAUNCHER_LOG%
echo.
call :say latest
type "%LAUNCHER_LOG%"
echo ---------------------------------------------------------
pause
exit /b %EXIT_CODE%

:say
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\launcher-message.ps1" "%~1"
exit /b 0
