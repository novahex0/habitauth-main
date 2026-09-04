@echo off
title Habit Auth — Server Launcher
echo ========================================================
echo  HABIT AUTH — Modern Authentication & License SaaS
echo  Tagline: Modern Authentication & License Infrastructure for Developers
echo ========================================================
echo.
cd /d "%~dp0backend"
echo Starting Habit Auth backend server on port 5000...
echo.
start http://localhost:5000
node src/server.js
pause
