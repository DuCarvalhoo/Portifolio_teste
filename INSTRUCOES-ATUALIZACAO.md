# Como atualizar o repositório

Este ZIP é um pacote completo do site estático, não apenas um patch. A pasta `Portifolio-main` contém o conteúdo que deve ficar na raiz do repositório.

1. Faça uma cópia de segurança da versão atual do repositório.
2. Extraia `Portifolio-main-atualizado.zip`.
3. Entre na pasta interna `Portifolio-main` e envie o conteúdo dela para a raiz do repositório GitHub, substituindo os arquivos correspondentes. Não crie uma pasta `Portifolio-main/Portifolio-main/` dentro do repositório.
4. Mantenha o `.nojekyll` na raiz e preserve a configuração do GitHub Pages em `main` / `/ (root)`.
5. Depois do commit, abra a página inicial e teste os três cards e as rotas diretas indicadas no `VALIDACAO.md`.

Não há pasta `.git` neste pacote. Ele não altera a configuração remota do GitHub nem publica o site automaticamente.
