@echo off
title Iniciar Ambiente - MTE
SET PATH=%PATH%;%USERPROFILE%\OneDrive - mtegovbr\Área de Trabalho\Projetos\node-v24.17.0-win-x64

echo ==========================================
echo    PREPARANDO AMBIENTE DE TRABALHO
echo ==========================================
echo.

echo [0/3] Verificando Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker nao esta rodando. Iniciando o Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Aguardando o Docker inicializar (isso pode levar alguns instantes)...
    :wait_docker
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if %errorlevel% neq 0 goto wait_docker
    echo Docker inicializado com sucesso!
) else (
    echo Docker ja esta rodando.
)
echo.

echo [1/3] Atualizando repositorio do Orbita...
cd /d "%~dp0"
git add .
git stash
git pull origin main --rebase -X theirs
git stash pop
call npm install
echo.

echo [2/3] Iniciando o servidor do Orbita...
:: O parametro -d faz rodar no fundo (nao trava o terminal)
docker compose up -d --build
echo.

echo [3/3] Iniciando o Hub de Dados (Airflow/Postgres)...
cd C:\Projetos\data-application-gov-hub
docker compose up -d airflow postgres
echo.

echo ==========================================
echo [FIM] Tudo pronto!
echo - Orbita:  http://localhost:3000
echo - Airflow: http://localhost:8080
echo ==========================================
pause