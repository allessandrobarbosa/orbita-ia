@echo off
echo [GIT] Adicionando alteracoes...
git add .
echo.
echo [GIT] Criando ponto de salvamento...
git commit -m "Atualizacao automatica via notebook/escritorio"
echo.
echo [GIT] Enviando para o GitHub...
git push origin main
echo.
echo [FIM] Tudo salvo no GitHub com sucesso!
pause
