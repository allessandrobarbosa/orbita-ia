@echo off
title Iniciar Ambiente - MTE

echo ==========================================
echo    PREPARANDO AMBIENTE DE TRABALHO
echo ==========================================
echo.

echo [1/4] Ligando o Docker e o Hub de Dados (Airflow/Postgres)...
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

cd C:\Projetos\data-application-gov-hub
docker compose up -d airflow postgres
echo.
echo - Airflow: http://localhost:8080

echo.
echo [2/4] Atualizando repositorio do Orbita...
cd /d "%~dp0"
git add .
git stash
git pull origin main --rebase -X theirs
git stash pop
echo.

echo [3/4] Instalando dependencias do Orbita (se necessario)...
call npm install
echo.

echo [4/4] Iniciando o servidor do Orbita (Nativo)...
start "Orbita Frontend" cmd /c "npm run dev"
echo.

echo ==========================================
echo [FIM] Ambiente do Orbita pronto!
echo - Orbita:  http://localhost:3000
echo ==========================================
pause