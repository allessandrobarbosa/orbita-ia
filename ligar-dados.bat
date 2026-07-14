@echo off
title Ligar Hub de Dados - MTE

echo ==========================================
echo    INICIANDO HUB DE DADOS (AIRFLOW/DB)
echo ==========================================
echo.

echo Verificando Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Iniciando o Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    :wait_docker
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if %errorlevel% neq 0 goto wait_docker
    echo Docker inicializado com sucesso!
)
echo.

echo Iniciando contêineres...
cd C:\Projetos\data-application-gov-hub
docker compose up -d airflow postgres

echo.
echo ==========================================
echo [FIM] Hub de Dados iniciado com sucesso!
echo - Airflow: http://localhost:8080
echo ==========================================
pause
