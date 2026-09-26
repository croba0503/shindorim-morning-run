@echo off
chcp 65001 > nul
title GitHub에 아침달리기 프로젝트 업로드

echo ========================================================
echo   신도림중 아침달리기 프로젝트를 GitHub에 업로드합니다.
echo   대상 주소: https://github.com/croba0503/shindorim-morning-run.git
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] GitHub 연결 확인 중...
git branch -M main

echo [2/2] GitHub으로 코드를 올립니다...
echo (처음 한 번 브라우저 로그인 창이 뜰 수 있습니다)
echo.

git push -u origin main

echo.
if %ERRORLEVEL% equ 0 (
    echo ========================================================
    echo   [성공] GitHub에 코드가 성공적으로 업로드되었습니다!
    echo   이제 Vercel에서 이 저장소를 선택해 배포하시면 됩니다.
    echo ========================================================
) else (
    echo ========================================================
    echo   [알림] GitHub 업로드 중 오류가 발생했거나 취소되었습니다.
    echo   먼저 github.com/croba0503 에 'shindorim-morning-run'
    echo   저장소를 생성했는지 확인해주세요.
    echo ========================================================
)

echo.
pause
