# Plano de refatoração incremental do código

Atualizado em 03/11/2026.

## Objetivo

Organizar o protótipo para que ele se aproxime da estrutura da aplicação real: componentes visuais pequenos e reutilizáveis, telas compostas a partir deles e regras de negócio separadas da apresentação. A refatoração deve acontecer em etapas, preservando os fluxos existentes e sem exigir uma reescrita completa.

Este documento complementa [requeriments.md](requeriments.md), que continua sendo a fonte dos requisitos do cliente, técnicos e das jornadas do usuário.

## Auditoria inicial

- `src/App.tsx` tem cerca de 1.700 linhas e acumula inicialização, sessão, navegação, estado do inventário, regras de ações e definições de telas, drawers, diálogos e mensagens.
- O projeto já tem uma biblioteca de interface em `src/library`, com botões, campos, cartões, textos, ícones e componentes de layout usando Tailwind.
- `App.tsx` ainda declara controles visuais próprios — botão, botão de ícone, rótulo e campos de texto/select — além de indicadores de estado. Isso cria duas fontes de estilo e comportamento.
- Algumas telas já estão separadas em `src/pages`; gerenciamento de usuários e perfil são exemplos. Há serviços isolados para relatórios e exportação.
- Os modais de item, exportação e edição de perfil repetiam a estrutura de fundo, painel e acessibilidade. A primeira composição compartilhada, `src/components/Dialog.tsx`, já foi criada e aplicada aos três fluxos.
- `CardBox` oferece uma aparência de cartão interativo; a propriedade `interactive` aplica realce visual. A ação de abrir um cartão clicável deve continuar usando um elemento semântico de botão ou link.

## Hierarquia de componentes

| Camada | Responsabilidade | Exemplos neste projeto |
| --- | --- | --- |
| Primitivos | Uma unidade visual pequena, com estilo e comportamento previsíveis; não conhece regras do inventário | `Button`, `IconButton`, `InputField`, `SelectField`, `CardBox`, `Badge` em `src/library` |
| Componentes compostos | Montar primitivos para uma interação reutilizável; recebem dados e callbacks tipados | `Dialog`, filtros, linha de usuário, cartão de pendências, tabela |
| Páginas/funcionalidades | Organizar componentes compostos para completar uma jornada | consulta de patrimônio, perfil e gestão de usuários |
| Layouts | Estrutura persistente entre páginas | shell responsivo e navegação lateral |
| Serviços e domínio | Regras, validações, transformações e operações sem JSX | permissões, histórico, filtros, modelos e exportações |

Um componente deve ser dividido quando tiver responsabilidade visual ou comportamental própria, for reutilizado ou tiver complexidade que mereça ser isolada. Não é necessário criar um arquivo para cada `div` ou fragmento estático.

Um diálogo composto, por exemplo, usa o shell compartilhado `Dialog`, um cartão sem ação, cabeçalho e conteúdo, campos e botões de ação. O diálogo controla a estrutura externa; cada fluxo continua responsável pelos seus dados e pela ação de salvar.

## Estrutura alvo, por migração

```text
src/
  domain/                 # modelos, enums e regras sem dependência de interface
  library/                # primitivos visuais web e tokens Tailwind
  components/             # composições reutilizáveis entre funcionalidades
  features/
    inventory/            # consulta, edição, histórico e aprovação
    users/                # perfil e gestão de acesso
  pages/                  # composição das páginas e ligação com navegação
  layouts/                # shell, navegação e estrutura responsiva
  services/               # operações e adaptadores de plataforma
```

Essa estrutura é uma direção, não uma mudança em massa. Os arquivos atuais devem ser movidos apenas quando forem refatorados. Não criar módulos vazios para preencher a árvore.

## Regras de implementação

1. Usar `src/library` como catálogo canônico dos primitivos web. Antes de criar outro botão, campo ou cartão, verificar se a biblioteca existente pode atender ao caso por composição ou variante.
2. Preservar estilos atuais ao consolidar controles. Mudanças visuais maiores devem ser intencionais, reutilizadas em conjunto e revisadas na interface.
3. Separar conteúdo e interação: cartão comum não dispara ações; cartão que navega ou executa ação deve expor botão/link semântico e acessível.
4. Manter páginas compostas. Elas conectam estado, permissões e componentes, sem redefinir todos os controles visuais localmente.
5. Manter regras de negócio fora de componentes visuais e de APIs específicas do navegador. Componentes recebem dados e callbacks tipados.
6. Preferir `enum` compartilhado para valores finitos de domínio (papéis, status, condições e ações), em módulo central. Usar `type`/`interface` para estruturas e contratos; não repetir literais de domínio em telas.
7. Usar Tailwind e os tokens existentes. Quando um valor recorrente não tiver classe/token adequado, centralizá-lo em constante, token de tema ou variável CSS nomeada.
8. Extrair serviço compartilhado quando uma regra ou operação for usada por mais de uma tela, precisar de integração externa ou puder ser compartilhada com o futuro app React Native.
9. Fazer cada etapa sem alterar a jornada correspondente: consulta, criação/edição, aprovação, histórico, exportação, perfil e gestão de usuários.

## Etapas

### Etapa 1 — Unificar as composições de diálogo

**Estado: iniciada.** Criado `src/components/Dialog.tsx` para compartilhar fundo, painel `CardBox` não clicável e atributos de acessibilidade. O formulário de patrimônio, a exportação geral e a edição de perfil usam essa composição.

Próximas ações desta etapa:

- Conferir aparência e comportamento dos três diálogos nas telas suportadas.
- Migrar outros diálogos que surjam, em vez de copiar a estrutura externa.
- Manter cabeçalho, campos e rodapé como composição de primitivos, sem acoplar regras ao shell do diálogo.

### Etapa 2 — Consolidar os primitivos

- Comparar os controles locais de `App.tsx` aos equivalentes em `src/library`.
- Incorporar variantes necessárias à biblioteca, preservando os tamanhos, estados de foco e identidade visual atuais.
- Migrar os consumidores em grupos pequenos e remover as duplicatas locais após cada grupo.
- Reunir indicadores de status reutilizáveis na biblioteca ou em componentes de domínio visual, sem duplicar labels e classes.

### Etapa 3 — Dividir as telas grandes

- Extrair da aplicação principal as telas de dashboard e inventário para componentes de funcionalidade.
- Extrair formulário de patrimônio, histórico e exportação para módulos próprios.
- Manter `App.tsx` como composição raiz de sessão, navegação e estado que ainda pertence ao protótipo.
- Migrar gradualmente os componentes de usuário já existentes para a mesma organização de funcionalidades, sem mudar as jornadas.

### Etapa 4 — Separar operações e regras de negócio

- Agrupar operações de inventário, aprovação, histórico, perfil e usuários em serviços ou funções de domínio com contratos claros.
- Remover lógica de permissão duplicada de páginas; cada regra deve ter uma fonte compartilhada.
- Manter os serviços independentes de JSX e preparar interfaces para substituir os dados em memória por uma API na aplicação real.
- Separar adaptadores web e nativos para armazenamento, dimensões, navegação, impressão/PDF e compartilhamento.

### Etapa 5 — Consolidar domínio e estilos

- Centralizar enums, rótulos, opções, validações e formatos de domínio.
- Remover strings de status e papéis declaradas localmente nas páginas.
- Definir tokens para espaçamento, cores, tipografia, foco e elevação quando houver repetição real.
- Rever classes Tailwind duplicadas e criar variantes de primitivos em vez de estilos independentes para cada tela.

### Etapa 6 — Revisar shell responsivo e prontidão mobile

- Garantir que login, páginas, diálogos, drawers e mensagens usem o shell raiz responsivo descrito em `requeriments.md`.
- Revisar a experiência na área útil mínima de 375 × 667 CSS px, considerando barras do navegador, teclado e áreas seguras.
- Manter regras e modelos compartilháveis independentes do DOM; adaptar componentes de interface à plataforma React Native quando o app mobile começar.

## Critérios de conclusão da refatoração incremental

- `App.tsx` deixa de definir controles primitivos e páginas completas; coordena a aplicação e conecta as funcionalidades.
- Existe uma fonte canônica para cada primitivo visual comum.
- Diálogos e demais composições repetidas seguem uma estrutura compartilhada e acessível.
- Componentes compostos têm props tipadas e não contêm regras de domínio duplicadas.
- Serviços e domínio não dependem de JSX nem de APIs específicas da web.
- As jornadas e permissões registradas em `requeriments.md` continuam funcionando após cada etapa.
- As decisões e limitações do protótipo permanecem explícitas; não se declara como persistido ou seguro o que ainda é apenas simulado.

## Progresso

- [x] Auditar estrutura, duplicações e componentes existentes.
- [x] Criar o shell compartilhado para diálogos e migrar três usos.
- [ ] Validar os diálogos visualmente e consolidar os controles locais com `src/library`.
- [ ] Extrair telas e componentes de inventário de `App.tsx`.
- [ ] Separar operações e regras em domínio/serviços.
- [ ] Revisar enums, tokens e responsividade ao longo da migração.
