@echo off
title Encerrar Ambiente - MTE

echo ==========================================
echo      ENCERRANDO AMBIENTE DE TRABALHO
echo ==========================================
echo.

echo [1/3] Salvando e enviando codigo do Orbita...
cd /d "%~dp0"

:: Adiciona todas as modificações (incluindo subpastas e untracked submodules)
git add --all

:: Remove o arquivo gigante do index do Git caso ele tenha sido adicionado acidentalmente
git rm --cached --ignore-unmatch data/tcu/temp-acordao-completo-2024.csv >nul 2>&1

:: Realiza o commit e envia as alterações com segurança
git commit -m "Atualizacao automatica via notebook/escritorio"
git pull origin main --rebase -X ours
git push origin main
echo.

echo [2/3] Desligando os containers do Orbita...
docker compose down
echo.

echo [3/3] Desligando os containers do Hub de Dados...
cd C:\Projetos\data-application-gov-hub
docker compose down
echo.

echo ==========================================
echo [FIM] Trabalho salvo e memoria liberada!
echo ==========================================
pause
