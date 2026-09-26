@echo off
chcp 65001 > nul
title 신도림중학교 아침달리기 서버 실행기

echo ========================================================
echo   신도림중학교 건강안전부 아침달리기 웹서버를 시작합니다.
echo ========================================================
echo.

set "PATH=C:\Program Files\nodejs;%PATH%"

cd /d "%~dp0"

echo [1/2] 브라우저를 엽니다...
start http://localhost:3000

echo [2/2] 서버를 실행합니다 (종료하려면 이 창에서 Ctrl + C를 누르세요)...
echo.
npm start

pause
