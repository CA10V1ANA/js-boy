@echo off
setlocal enabledelayedexpansion
title JS BOY Mobile - Rodar no celular fisico

echo ============================================
echo   JS BOY Mobile - Rodar no celular fisico
echo ============================================
echo.

cd /d "%~dp0"

REM --- Verifica se o adb esta disponivel (parte do Android SDK/platform-tools) ---
where adb >nul 2>nul
if errorlevel 1 (
    echo [ERRO] "adb" nao encontrado no PATH.
    echo Instale o Android Studio e garanta que a pasta platform-tools
    echo do Android SDK esteja no PATH.
    goto :fim_com_erro
)

REM --- Procura um celular fisico conectado (ignora emuladores) ---
set "PHYSICAL_ID="

for /f "skip=1 tokens=1,2" %%A in ('adb devices') do (
    if "%%B"=="device" (
        echo %%A | findstr /b "emulator-" >nul
        if errorlevel 1 (
            set "PHYSICAL_ID=%%A"
        )
    )
)

if "%PHYSICAL_ID%"=="" (
    echo [ERRO] Nenhum celular fisico encontrado.
    echo.
    echo Verifique se:
    echo   1. O cabo USB esta conectado
    echo   2. "Opcoes do desenvolvedor" e "Depuracao USB" estao ativadas no celular
    echo   3. Voce aceitou o popup "Permitir depuracao USB" no celular
    echo.
    echo Dispositivos encontrados pelo adb:
    adb devices
    goto :fim_com_erro
)

echo Celular fisico detectado: %PHYSICAL_ID%
echo.
echo Iniciando o app (flutter run)...
echo ============================================
call flutter run -d %PHYSICAL_ID%
goto :fim

:fim_com_erro
echo.
echo O script foi interrompido por um erro. Veja as mensagens acima.
pause
exit /b 1

:fim
pause
