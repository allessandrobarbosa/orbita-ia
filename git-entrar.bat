@echo off
SET PATH=%PATH%;%USERPROFILE%\OneDrive - mtegovbr\Área de Trabalho\Projetos\node-v24.17.0-win-x64

echo [GIT] Atualizando o projeto...
git pull origin main
echo.

echo [NPM] Verificando novas dependencias...
call npm install
echo.

echo [NPM] Iniciando o servidor de desenvolvimento...
call npm run dev
echo.

echo [FIM] Projeto atualizado e pronto para uso!
pause
