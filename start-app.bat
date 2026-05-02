@echo off
cd /d "%~dp0backend"
set "NODE_EXE=C:\Program Files\nodejs\node.exe"

echo Starting CineMatch backend...
echo.
echo Keep this window open while using the website.
echo Website: http://localhost:5000
echo.

if not exist "%NODE_EXE%" (
  echo Node.js was not found at:
  echo %NODE_EXE%
  echo.
  echo Try running this manually in VS Code:
  echo cd backend
  echo node server.js
  echo.
  pause
  exit /b 1
)

echo Checking server file...
if not exist "server.js" (
  echo server.js was not found. This file must be inside the backend folder.
  echo Current folder: %CD%
  pause
  exit /b 1
)

echo Starting server now...
echo.
start "" "http://localhost:5000"
"%NODE_EXE%" server.js
echo.
echo Server stopped. Press any key to close this window.
pause >nul
