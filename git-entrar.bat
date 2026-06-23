@echo off
echo [GIT] Atualizando o projeto...
git pull origin main
echo.
echo [NPM] Verificando novas dependencias...
call npm install
echo.
echo [FIM] Projeto atualizado e pronto para uso!
pause
