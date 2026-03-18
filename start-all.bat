@echo off
echo ==============================================
echo   fs-angular-app  ^|  Full Stack Dev Server
echo ==============================================

:: ── 1. Start MongoDB service ──────────────────────────────────────────────
echo.
echo [1/3] Starting MongoDB service...
net start MongoDB >nul 2>&1
if %errorlevel%==0 (
  echo       MongoDB started successfully.
) else (
  echo       MongoDB is already running (or start not needed).
)

:: ── 2. Start Backend (new window) ────────────────────────────────────────
echo.
echo [2/3] Starting Backend (Express on port 5000)...
start "BACKEND - fs-angular-app" cmd /k "title BACKEND - fs-angular-app && cd /d %~dp0backend && echo Backend starting... && node server.js"

echo       Waiting 4 seconds for backend to initialise...
timeout /t 4 /nobreak >nul

:: ── 3. Start Frontend (this window) ─────────────────────────────────────
echo.
echo [3/3] Starting Frontend (Angular on port 4200)...
title FRONTEND - fs-angular-app
cd /d %~dp0
call npm.cmd start
