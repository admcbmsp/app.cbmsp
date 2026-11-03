# Requisitos — Sistema de Gestão Patrimonial CBM SP

> Documento vivo para orientar a evolução do protótipo e a construção da aplicação real. Atualizar decisões e requisitos à medida que forem confirmados.
>
> Situação: rascunho · Atualizado em 03/11/2026 — escopo global por unidade, tabelas responsivas, filtros múltiplos, templates locais, tabelas configuráveis, identidade visual oficial e diretrizes para portar a experiência web para React Native.
>
> Plano de organização e limpeza incremental do código: [PLANO_REFATORACAO_CODIGO.md](PLANO_REFATORACAO_CODIGO.md).

### Manutenção deste documento

- Este é o registro vivo das funcionalidades, regras de negócio, decisões técnicas e requisitos de experiência responsiva do aplicativo.
- Atualizar este arquivo na mesma alteração que introduzir ou mudar uma funcionalidade, permissão, regra de dados, fluxo, dependência técnica ou decisão de compatibilidade. Não deixar para atualizar apenas na fase mobile.
- Identificar o que já existe no protótipo, o que está definido para a aplicação real e o que ainda é uma decisão pendente. Não descrever como implementado algo que ainda é apenas planejado.
- Ao propor uma solução, considerar desde o início a versão web e o futuro porte para React Native. Compartilhar comportamento e domínio quando possível; documentar adaptações necessárias de navegação, interface, armazenamento, teclado, impressão e recursos do dispositivo.

## 1. Objetivo

Oferecer uma aplicação para consultar e controlar bens patrimoniais, acompanhar condição e situação operacional, registrar alterações e revisar cadastros que dependem de aprovação.

## 2. Escopo conhecido

O protótipo atual contém:

- Visão geral com indicadores, pendências e movimentações recentes.
- Consulta de patrimônio com busca, filtros, agrupamento por descrição e acesso aos exemplares individuais; a linha agrupada abre os detalhes ao clicar em qualquer célula e também pode ser acionada pelo teclado.
- Templates locais por usuário para salvar e restaurar filtros e colunas da consulta.
- Tabelas agrupada e individual com controle para mostrar, ocultar, reordenar e ordenar colunas; na tabela individual, a coluna de ações fica fixa no final.
- Tabelas com cabeçalho neutro, linhas alternadas, divisórias suaves e destaque discreto ao passar o cursor, seguindo as classes semânticas de Tailwind do Troi e os tokens de cor do tema CBM SP.
- Em telas abaixo de 1280 px, as tabelas de consulta exibem registros como cartões com rótulos; em telas maiores, preservam o formato tabular.
- Logotipo oficial CBM SP nas áreas de marca, ícone do navegador e identidade instalada; cantos dos componentes com raio mais contido.
- Cadastro e edição de patrimônios.
- Aprovação e rejeição administrativa.
- Lista administrativa de usuários e edição do perfil de acesso.
- Perfil pessoal para cada usuário, com edição dos próprios dados de identificação e contato.
- Seletor global de unidade na navegação lateral, aplicado às telas de patrimônio, indicadores, pendências, usuários e exportações.
- Histórico de alterações por patrimônio.
- Exportação CSV e relatórios para impressão/salvamento como PDF.
- Perfis de leitor, almoxarife e administrador.

O protótipo usa dados de demonstração em memória e autenticação simulada. Ele não é a fonte oficial dos dados e não oferece persistência, autenticação ou autorização adequadas para produção.

## 3. Perfis e permissões iniciais

| Perfil | Necessidade | Regra observada no protótipo |
|---|---|---|
| Leitor | Consultar ativos e emitir relatórios. | Vê apenas patrimônios ativos; não cadastra nem edita. |
| Almoxarife | Registrar exemplares e manter dados operacionais. | Vê ativos e pendentes; pode criar registros e atualizar condição, situação operacional e unidade. Cadastros novos aguardam aprovação, salvo quando a descrição já possui cadastro aprovado. |
| Administrador/gestor | Revisar cadastros e administrar informações. | Vê todos os registros, edita campos administrativos e operacionais, aprova ou rejeita pendências. |

As permissões da aplicação real devem ser impostas e validadas no servidor. Ocultar ações na interface não é controle de acesso suficiente.

## 4. Requisitos do cliente

### RC-01 — Autenticação e perfil

O usuário deve entrar com uma identidade reconhecida pela organização e receber as permissões correspondentes ao seu perfil.

### RC-02 — Visão geral

O sistema deve apresentar indicadores e listas de trabalho adequados ao perfil, incluindo pendências para revisão e movimentações recentes quando aplicável.

### RC-03 — Consulta e localização

O usuário deve conseguir localizar patrimônio por descrição e número patrimonial, filtrar resultados por tipo, condição, situação operacional e status administrativo, e limpar os filtros aplicados. Cada filtro deve aceitar múltiplas opções por checkbox; opções dentro do mesmo filtro combinam com OU e filtros de categorias diferentes combinam com E. Os filtros aplicados devem aparecer na URL web e ser restaurados ao abrir ou recarregar o endereço.

### RC-04 — Agrupamento e detalhe

Resultados podem ser agrupados por descrição para apresentar totais. O usuário deve poder abrir o grupo ao selecionar qualquer ponto da linha ou usando o teclado, e consultar cada exemplar individual, identificado pelo seu número patrimonial. O nome do item usa a cor neutra do texto; a interação é indicada pela linha inteira e seu realce de foco/hover, e a cor não representa status patrimonial.

### RC-05 — Cadastro

Usuários autorizados devem cadastrar um exemplar individual com descrição, tipo, número patrimonial, unidade, condição, situação operacional e valor estimado, sujeito à validação e às regras de aprovação.

### RC-06 — Edição e movimentação

Usuários autorizados devem atualizar os campos permitidos para seu perfil. Alterações de unidade e de status administrativo devem ficar registradas no histórico.

### RC-07 — Aprovação

Administradores devem consultar registros pendentes e aprová-los ou rejeitá-los. A decisão e seu autor devem ser registrados.

### RC-08 — Histórico

Cada patrimônio deve apresentar eventos de criação, edição, aprovação, rejeição, mudança de unidade e desativação, com data, autor e resumo da alteração.

### RC-09 — Exportação

O usuário deve poder exportar os dados que seu perfil está autorizado a consultar. CSV deve ser baixado como arquivo. PDF deve apresentar título, nome e e-mail do usuário que gerou o relatório, data e hora de geração, tabela legível e paginação adequada.

### RC-10 — Uso responsivo

A aplicação web deve funcionar em telas pequenas e grandes. A menor tela aceita para o layout é 375 × 667 CSS px; a validação deve considerar que as barras do navegador reduzem a área realmente visível. Abaixo de 1280 px, tabelas de consulta devem se reorganizar em cartões com rótulos por campo para evitar rolagem horizontal da página; telas maiores preservam as tabelas e podem rolar horizontalmente quando o usuário habilitar muitas colunas. A versão mobile deve oferecer jornadas equivalentes compatíveis com o uso em campo.

### RC-11 — Acessibilidade e idioma

Interface e relatórios devem usar português do Brasil, rótulos claros, navegação por teclado, foco visível, controles acessíveis e contraste legível.

### RC-12 — Gestão de usuários

Administradores devem poder abrir a lista de todos os usuários cadastrados, selecionar uma conta e alterar seu perfil de acesso. Nesta etapa, o perfil é o único campo editável. No protótipo, a alteração vale durante a sessão e não é persistida.

### RC-13 — Perfil pessoal

Todos os usuários autenticados devem ter acesso ao botão **Perfil** na navegação e poder editar os próprios dados: patente, unidade, telefone de contato, nome e sobrenome. O usuário não pode alterar o próprio e-mail nem o perfil de acesso pela tela pessoal. No protótipo, as alterações são mantidas apenas durante a sessão.

### RC-14 — Templates de consulta

O usuário deve poder salvar localmente uma consulta nomeada com seus filtros e colunas selecionadas, aplicar um template salvo, atualizá-lo, renomeá-lo e excluí-lo. Aplicar um template restaura filtros e colunas; na web, os filtros restaurados também devem ser refletidos na URL. Um template padrão por usuário deve ser aplicado automaticamente ao entrar na consulta quando a URL não especificar filtros; o primeiro template salvo se torna o padrão, e aplicar outro template troca o padrão. Templates devem ser separados por usuário e conter uma versão do esquema para permitir evolução dos dados. Não devem guardar dados patrimoniais nem credenciais.

### RC-15 — Tabelas configuráveis

Nas tabelas agrupada e de exemplares, o usuário deve poder mostrar ou ocultar colunas disponíveis, mudar a ordem das colunas e ordenar as linhas em ordem crescente ou decrescente pelo valor da coluna. A descrição é obrigatória na tabela agrupada; Número de patrimônio é obrigatório na tabela de exemplares. Clicar ou focar uma linha agrupada abre os exemplares dessa descrição. Em telas compactas, os mesmos campos devem aparecer em cartões com rótulos e um controle de ordenação acessível. A última coluna das duas tabelas contém um botão de três pontos: na tabela agrupada, ele abre os exemplares daquela descrição; na tabela de exemplares, abre as ações disponíveis para aquele registro, respeitando o perfil do usuário. A coluna de ações permanece visível e sempre é a última. A ordem de colunas da tabela de exemplares deve ser usada nas exportações e incluída nos templates de consulta.

### RC-16 — Identidade visual e adaptação mobile

A interface deve usar o arquivo vetorial oficial `cbmsp.svg` sem alterar suas cores ou proporções. Cartões, campos, botões, menus e diálogos devem usar apenas os raios compartilhados `sm` (2 px) ou `md` (4 px); círculos ficam reservados a indicadores, controles circulares e avatares. A versão React Native deve reutilizar o mesmo vetor por um recurso de exibição SVG compatível com a plataforma e mapear os mesmos tokens de raio.

### RC-17 — Escopo global por unidade

O usuário deve poder selecionar a unidade de atuação pela navegação lateral. A seleção limita indicadores, movimentações, pendências, consulta de patrimônio, usuários e exportações aos registros relacionados à unidade escolhida, e permanece ativa ao navegar entre telas. A unidade atribuída ao perfil deve ser o escopo inicial; quando o perfil não tiver unidade definida, o protótipo começa em **Todas as unidades**. Na web, a seleção deve ser serializada no parâmetro `unit` da URL (`unit=<unidade>` ou `unit=all`) e restaurada ao abrir ou recarregar o endereço. A API da aplicação real deve fornecer as unidades permitidas e impor o escopo no servidor; o filtro visual do protótipo não substitui autorização.

## 5. Jornadas do usuário

### Leitor — consultar um patrimônio

1. Entrar com perfil de leitor.
2. Abrir a consulta de ativos.
3. Buscar pela descrição ou número patrimonial e aplicar filtros, se necessário.
4. Abrir uma descrição agrupada para consultar os exemplares.
5. Exportar os resultados permitidos em CSV ou abrir o relatório para salvar como PDF.

### Almoxarife — registrar um exemplar

1. Entrar e abrir o almoxarifado.
2. Iniciar um cadastro e preencher os dados do exemplar e da unidade.
3. Receber confirmação de cadastro ativo ou pendente, conforme a regra de aprovação.
4. Acompanhar o registro e consultar seu histórico.

### Almoxarife — atualizar condição ou unidade

1. Localizar e abrir um exemplar.
2. Alterar os campos operacionais permitidos.
3. Salvar e consultar o evento correspondente no histórico.

### Administrador — revisar pendência

1. Entrar e consultar a lista de pendências.
2. Abrir o patrimônio e conferir seus dados.
3. Aprovar ou rejeitar o registro.
4. Consultar a decisão no histórico e verificar a disponibilidade do registro conforme o novo status.

### Administrador — alterar perfil de usuário

1. Abrir **Usuários** na navegação lateral.
2. Consultar a lista de contas, seus nomes, e-mails e perfis atuais.
3. Selecionar uma conta e escolher outro perfil de acesso.
4. Salvar a alteração e verificar o perfil atualizado na lista e no acesso demonstrativo.

### Todos os perfis — atualizar dados pessoais

1. Abrir **Perfil** na navegação lateral.
2. Atualizar patente, unidade, telefone de contato, nome ou sobrenome.
3. Salvar e conferir os dados atualizados no cabeçalho, na navegação e nos relatórios futuros.

### Todos os perfis — salvar e aplicar uma consulta

1. Fazer uma busca e combinar filtros e colunas conforme a tarefa.
2. Salvar a configuração com um nome reconhecível.
3. O primeiro template salvo passa a ser o padrão automático; ao entrar na consulta sem filtros explícitos na URL, ele restaura filtros e colunas.
4. Aplicar outro template também o define como padrão. O usuário pode escolher um padrão diferente no menu de templates.
5. Renomear, atualizar ou remover templates conforme necessário.

## 6. Requisitos técnicos e diretrizes

### Porte futuro para React Native

- A versão web será desenvolvida primeiro e servirá de referência funcional para uma futura versão React Native. O objetivo é portar a aplicação com o mínimo de duplicação possível, sem exigir que a interface web e a interface nativa usem os mesmos elementos visuais.
- Manter regras de domínio, tipos, validações, permissões, combinações de filtros, serialização do estado de consulta e modelo dos templates independentes de DOM, CSS, navegador e APIs nativas.
- Definir contratos de serviço comuns e implementar adaptadores por plataforma para recursos que diferem: armazenamento local, navegação/deep links, impressão e PDF, compartilhamento, dimensões da tela, áreas seguras e teclado virtual.
- Construir a interface web responsiva e acessível desde o início. Na versão nativa, adaptar apresentação e interação para controles e convenções mobile, preservando os mesmos fluxos e regras de negócio. Não pressupor que HTML, CSS ou componentes DOM podem ser reutilizados diretamente em React Native.
- Preservar o modelo e os dados das tabelas configuráveis entre plataformas. Na web, linhas de tabela tornam-se cartões rotulados em telas menores; no React Native, usar uma apresentação nativa equivalente.
- Manter tokens de cor, espaçamento, tipografia e estados de interação documentados para reproduzir a identidade visual nas duas plataformas.

### Arquitetura e código

- Usar TypeScript para domínio, interface e contratos entre camadas.
- Preferir `enum` compartilhado para conjuntos finitos de valores de domínio — por exemplo, perfil, status, condição, situação operacional e ações do histórico. Definir cada enum uma vez em um módulo central de domínio e importar seus membros nos componentes e serviços; evitar repetir tipos de união com strings ou literais de status em arquivos de tela. Isso reduz erros de digitação e melhora o autocompletar. Usar `type`/`interface` para estruturas e contratos que não sejam enumerações.
- Manter componentes granulados, reutilizáveis e com responsabilidade clara. Compor páginas a partir de componentes menores em vez de concentrar a lógica em um único arquivo.
- Manter componentes visuais comuns na biblioteca de interface do projeto, com variantes consistentes para botões, campos, cartões, indicadores e estados.
- Separar interface de regras de negócio e serviços. Serviços esperados incluem autenticação, inventário, aprovações, histórico e exportação; contratos de API e implementações devem ser definidos quando a infraestrutura real for escolhida.
- Compartilhar tipos, regras de domínio, formatação e modelo dos relatórios entre web e mobile sempre que forem independentes da plataforma.
- Isolar recursos dependentes da plataforma em adaptadores específicos para web e React Native.
- Implementar filtros e templates através de modelos e serviços TypeScript compartilháveis. O template deve guardar valores estáveis de filtro e chaves de coluna, não rótulos traduzidos nem estado de componente.
- Manter a seleção global de unidade em uma regra de domínio independente da interface. Na web, a navegação serializa a unidade na URL; no React Native, um adaptador de navegação deve preservar o mesmo escopo em rotas e deep links.
- Definir uma interface assíncrona de armazenamento local (listar, salvar, atualizar e excluir templates) e fornecer adaptadores web e nativo. `@react-native-async-storage/async-storage` é uma opção candidata para React Native e Web; confirmar compatibilidade com o bundler escolhido antes de adotá-la também no web app atual. Os componentes não devem depender diretamente da biblioteca de armazenamento.
- Manter os templates locais associados ao usuário e versionar seu formato. Armazenamento local não sincroniza automaticamente templates entre navegadores ou dispositivos; sincronização futura requer serviço de backend.
- Persistir a referência do template padrão por usuário. Ao iniciar a consulta sem parâmetros de filtro na URL, restaurar o template padrão; parâmetros explícitos da URL têm precedência. Aplicar um template escolhido atualiza a referência do padrão.

### Estilos e valores recorrentes

- Usar Tailwind CSS para estilos da interface web, priorizando as classes existentes e os tokens definidos na configuração do Tailwind.
- Quando um valor visual ou funcional se repetir e não houver uma classe ou token Tailwind apropriado, declará-lo como constante, token de tema ou variável CSS nomeada, em vez de espalhar valores literais.
- Manter estilos de impressão do relatório em CSS próprio, com variáveis nomeadas para cores e demais tokens recorrentes. Esse HTML também deve poder ser passado ao adaptador mobile de geração de PDF.
- Evitar números mágicos e duplicação de regras de permissão, rótulos, formatos de data, moeda e status.

### Shell e dimensões responsivas

- Toda a aplicação deve ser renderizada dentro de um shell raiz compartilhado, incluindo login, páginas autenticadas, modais, drawers e mensagens.
- O shell deve calcular em runtime as dimensões CSS disponíveis para a aplicação, considerando a área visual disponível no navegador e suas barras de navegação. Passar a altura calculada em pixels ao shell (por exemplo, `height: 667px` quando essa for a altura útil), em vez de depender de `height: 100%`.
- Atualizar as dimensões calculadas quando a janela, a orientação do dispositivo, o viewport visual ou o teclado virtual alterarem a área disponível.
- O shell deve usar `display: flex` e `flex-direction: column`. As áreas de conteúdo devem rolar quando necessário; a área de ações deve usar `margin-top: auto` para ficar no fim da coluna quando houver espaço, sem cobrir nem impedir o acesso ao conteúdo.
- Verificar o layout mínimo em 375 × 667 CSS px, com as barras do navegador consideradas, e também em telas maiores. Respeitar áreas seguras de dispositivos móveis.
- Não acoplar regras de negócio às medições do navegador. No React Native, obter dimensões e mudanças de orientação pelas APIs da plataforma e aplicar o mesmo conjunto de restrições de layout, com tratamento nativo de áreas seguras e teclado.

### Relatórios PDF e mobile

- Na web, gerar um documento HTML próprio e usar o diálogo nativo de impressão/salvamento do navegador.
- Manter a montagem dos dados e do HTML sem dependência de serviços de conversão externos.
- Para a futura versão React Native, avaliar Expo Print para gerar o mesmo relatório HTML como PDF local; avaliar Expo Sharing para compartilhamento pelo sistema operacional.
- Preservar uma camada comum para dados e conteúdo do relatório e aceitar adaptadores diferentes para impressão web e geração mobile.
- Validar a paginação, fontes, acentos e legibilidade em navegadores, iOS e Android.

### Dados, segurança e operação

- Substituir dados de demonstração por persistência oficial antes do uso real.
- Definir autenticação, política de autorização, armazenamento, auditoria, sincronização e recuperação de falhas antes da produção.
- Validar os dados tanto na interface quanto no servidor e manter registro auditável das alterações relevantes.
- Definir política de acesso, retenção e proteção dos dados patrimoniais com a organização.

## 7. Decisões pendentes para a aplicação real

- Qual backend, banco de dados e serviço de autenticação serão utilizados?
- Qual é a regra final para aprovação: aprovar apenas o exemplar selecionado ou todos os exemplares de uma descrição/cadastro?
- Na aplicação real, quais regras devem restringir alterações de perfil (por exemplo, alteração do próprio perfil ou remoção do último administrador)?
- A gestão real de usuários também deve criar, desativar ou convidar contas, ou somente alterar perfis?
- Quais campos são obrigatórios, únicos e editáveis por perfil? Como tratar patrimônio sem valor estimado ou sem unidade definida?
- Quais unidades, organizações e escopos de acesso devem existir?
- A versão mobile será construída com Expo ou React Native bare? Deve oferecer uso offline e sincronização posterior?
- Qual adaptador de armazenamento local será usado no web app e na versão nativa? Os templates devem continuar somente no dispositivo ou sincronizar entre dispositivos no futuro?
- PDF web deve abrir a impressão do navegador ou também precisa oferecer download direto sem diálogo?
- Quais relatórios oficiais, campos, assinaturas, brasões e padrões visuais são necessários?
- Quais são as políticas de retenção, exclusão, auditoria e exportação de dados?
