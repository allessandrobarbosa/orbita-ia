@echo off
SET PATH=%PATH%;%USERPROFILE%\OneDrive - mtegovbr\Área de Trabalho\Projetos\node-v24.17.0-win-x64

echo [GIT] Verificando se ha modificacoes locais nao salvas...
git add .
git stash

echo.
echo [GIT] Atualizando o projeto trazendo o historico do GitHub...
git pull origin main --rebase -X theirs
echo.

echo [GIT] Trazendo de volta suas configuracoes locais...
git stash pop

echo.
echo [NPM] Verificando novas dependencias...
call npm install
echo.

echo [NPM] Iniciando o servidor de desenvolvimento...
call npm run dev
echo.

echo [FIM] Projeto atualizado e pronto para uso!
pause
