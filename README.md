# CBM SP — Almoxarifado patrimonial

Protótipo navegável de controle de bens permanentes do Corpo de Bombeiros, com dados locais, 140 patrimônios importados da planilha de salvamento e três perfis demonstrativos.

O protótipo inclui aprovação de novos patrimônios, **Cadastro** (`active`, `pending`, `rejected` e `deactivated`), **Operação** conforme I-23-PM, cidade/unidade, histórico por item, `lastTimeTouched`, tabela configurável e exportação CSV/PDF. A interface usa o logotipo vetorial oficial `cbmsp.svg`, uma paleta semântica com azul como `primary`, vermelho reservado para erro/rejeição, tema claro/escuro, raios de 2 ou 4 px nos componentes e um registro único de ícones no padrão Lucide.

As tabelas de consulta mudam para cartões rotulados em telas com menos de 1280 px para manter todos os campos legíveis sem expandir a página horizontalmente. Em telas maiores, seguem como tabelas configuráveis.

A navegação lateral oferece um seletor global de unidade. Ele limita as telas, pendências, consulta de usuários e exportações à unidade selecionada, mantém a escolha entre páginas e a registra no parâmetro `unit` da URL. Perfis com unidade definida começam nesse escopo; contas demonstrativas sem unidade começam em “Todas as unidades”.

Os primitivos reutilizáveis ficam em `src/library`, os tokens de tema em `src/styles/theme-palette.css` e a tipografia em `src/styles/typography.css`. O tema pode ser alternado pelo ícone no topo após o login; a preferência é mantida em `localStorage`.

## Acesso ao protótipo

Todos os usuários usam a senha `123456`:

- `reader@cbmsp.test` — consulta somente itens ativos.
- `almoxarife@cbmsp.test` — consulta, cria itens pendentes e edita quantidade, condição operacional e cidade/unidade.
- `adm@cbmsp.test` — aprova/rejeita pendências, cria itens ativos e controla os status.

As alterações ficam apenas na memória do navegador e são perdidas ao recarregar a página.

## Scripts disponíveis

Use `npm start` para iniciar a aplicação localmente, `npm test -- --watchAll=false --runInBand` para executar os testes e `npm run build` para gerar a versão de produção.

---

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
