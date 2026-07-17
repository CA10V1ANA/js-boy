@echo off
setlocal enabledelayedexpansion
title JS BOY Mobile - Rodar no celular fisico

echo ============================================
echo   JS BOY Mobile - Rodar no celular fisico
echo ============================================
echo.

cd /d "%~dp0"

REM --- Usa o JDK moderno do Android Studio quando existir (Gradle precisa de Java 17+) ---
if exist "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" (
    set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
    set "PATH=%JAVA_HOME%\bin;%PATH%"
)

REM --- Verifica se o adb esta disponivel (parte do Android SDK/platform-tools) ---
where adb >nul 2>nul
if errorlevel 1 (
    if exist "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" (
        set "PATH=%LOCALAPPDATA%\Android\Sdk\platform-tools;%PATH%"
    ) else (
        echo [ERRO] "adb" nao encontrado no PATH.
        echo Instale o Android Studio e garanta que a pasta platform-tools
        echo do Android SDK esteja no PATH.
        goto :fim_com_erro
    )
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

REM --- Detecta o IP local do notebook (para o celular acessar a API) ---
set "LOCAL_IP="
set "WIFI_IP="
set "ETH_IP="
set "CURRENT_ADAPTER="

for /f "delims=" %%L in ('ipconfig') do (
    set "LINE=%%L"
    echo !LINE! | findstr /C:"adapter" /C:"Adaptador" >nul
    if not errorlevel 1 (
        set "CURRENT_ADAPTER=!LINE!"
    )
    echo !LINE! | findstr /C:"IPv4" >nul
    if not errorlevel 1 (
        for /f "tokens=2 delims=:" %%a in ("!LINE!") do (
            set "IP_TMP=%%a"
            set "IP_TMP=!IP_TMP: =!"
            echo !CURRENT_ADAPTER! | findstr /I /C:"Wi-Fi" >nul
            if not errorlevel 1 (
                set "WIFI_IP=!IP_TMP!"
            ) else (
                echo !CURRENT_ADAPTER! | findstr /I /C:"vEthernet" >nul
                if errorlevel 1 (
                    echo !CURRENT_ADAPTER! | findstr /I /C:"Ethernet" >nul
                    if not errorlevel 1 (
                        set "ETH_IP=!IP_TMP!"
                    )
                )
            )
        )
    )
)

if defined WIFI_IP (
    set "LOCAL_IP=!WIFI_IP!"
) else if defined ETH_IP (
    set "LOCAL_IP=!ETH_IP!"
)

if not defined LOCAL_IP (
    echo [AVISO] Nao foi possivel detectar o IP local automaticamente.
    set /p LOCAL_IP="Digite o IP do seu notebook na rede (ex: 192.168.1.10): "
)

echo IP local detectado: %LOCAL_IP%
echo A API sera acessada em: http://%LOCAL_IP%:8080
echo (celular e notebook precisam estar na MESMA rede Wi-Fi)
echo.
echo Iniciando o app (flutter run)...
echo ============================================
call flutter run -d %PHYSICAL_ID% --dart-define=API_URL=http://%LOCAL_IP%:8080
goto :fim

:fim_com_erro
echo.
echo O script foi interrompido por um erro. Veja as mensagens acima.
pause
exit /b 1

:fim
pause
