@echo off
title Encerrar Ambiente - MTE

echo ==========================================
echo      ENCERRANDO AMBIENTE DE TRABALHO
echo ==========================================
echo.

echo [1/3] Salvando e enviando codigo do Orbita...
cd C:\Projetos\orbita-projeto
git add .
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