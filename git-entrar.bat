@echo off
title Iniciar Ambiente - MTE

echo ==========================================
echo    PREPARANDO AMBIENTE DE TRABALHO
echo ==========================================
echo.

echo [1/4] Atualizando repositorio do Orbita...
cd /d "%~dp0"
git add .
git stash
git pull origin main --rebase -X theirs
git stash pop
echo.

echo [2/4] Instalando dependencias do Orbita (se necessario)...
call npm install
echo.

echo [3/4] Iniciando o servidor do Orbita (Nativo)...
start "Orbita Frontend" cmd /c "npm run dev"
echo.

echo ==========================================
echo Deseja ligar o Hub de Dados (Airflow/Postgres)?
echo (Isso vai abrir o Docker e consumir mais memoria)
echo ==========================================
choice /C SN /M "Pressione S para Sim ou N para Nao"
if errorlevel 2 goto fim_dados
if errorlevel 1 goto ligar_dados

:ligar_dados
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
echo [4/4] Iniciando o Hub de Dados (Airflow/Postgres)...
cd C:\Projetos\data-application-gov-hub
docker compose up -d airflow postgres
echo.
echo - Airflow: http://localhost:8080
goto fim

:fim_dados
echo.
echo Hub de dados pulado. Voce pode liga-lo depois executando 'ligar-dados.bat'.

:fim
echo.
echo ==========================================
echo [FIM] Ambiente do Orbita pronto!
echo - Orbita:  http://localhost:3000
echo ==========================================
pause