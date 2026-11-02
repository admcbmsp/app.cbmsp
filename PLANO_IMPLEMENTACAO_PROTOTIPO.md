# Plano de implementação — Protótipo de almoxarifado

## 1. Objetivo

Construir um protótipo navegável de controle de bens permanentes do Corpo de Bombeiros, utilizando dados locais e regras simuladas.

O protótipo deverá permitir:

- Simular login com três perfis: `reader`, `almoxarife` e `adm`.
- Consultar os 140 patrimônios importados da planilha de salvamento do cliente.
- Filtrar o estoque por descrição, tipo e status.
- Visualizar os detalhes de um item.
- Demonstrar permissões diferentes por perfil.
- Criar registros e editar dados conforme o nível de acesso.
- Demonstrar o fluxo de aprovação de itens pendentes.

Não fazem parte desta versão banco de dados, autenticação real, API, controle de concorrência, auditoria real ou regras patrimoniais definitivas.

## 2. Premissas técnicas

- Aplicação React com TypeScript.
- Create React App como ferramenta de build.
- Tailwind CSS para a interface.
- Dados mockados em arquivos TypeScript.
- Estado da aplicação mantido no frontend.
- Login simulado com usuários fixos.
- Persistência opcional em `localStorage`; não haverá banco de dados.
- Exclusão física de registros não será implementada. O encerramento de um item será demonstrado pelo status `deactivated`.

## 3. Modelo de dados inicial

O modelo mínimo deverá conter os campos abaixo:

```ts
type ItemStatus = 'active' | 'deactivated' | 'pending' | 'rejected';
type ItemState = 'novo' | 'semi-novo' | 'desgastado' | 'fora-de-uso';

type InventoryItem = {
  uuid: string;
  description: string;
  type: string;
  state: ItemState;
  valor: number;
  quantidade: number;
  nrPatrimonio: string;
  status: ItemStatus;
};
```

O campo `quantidade` existe no seed atual apenas para suportar a demonstração legada. Conforme o requisito do cliente, no modelo alvo ele não será editado manualmente: a quantidade de um `Registro` será derivada pela contagem de fichas patrimoniais vinculadas a ele. O campo `valor` será numérico internamente e formatado como moeda brasileira na interface.

### Regras simuladas

- Itens `active` aparecem para os perfis que fazem consulta.
- O `reader` recebe somente itens `active`; itens `pending` ou `rejected` não entram na consulta operacional.
- Um item criado pelo `almoxarife` começa como `pending` e fica visível apenas nas pendências administrativas do almoxarife e do gestor.
- Somente o gestor (`adm`) pode alterar o status do item. Ao aprovar, muda para `active` e passa a aparecer para consulta; ao rejeitar, muda para `rejected` e não entra na lista de patrimônios.
- Um item criado pelo `adm` começa automaticamente como `active`.
- O `almoxarife` poderá editar o campo de cidade/unidade do patrimônio, além das permissões já previstas no protótipo, respeitando a revisão do estado operacional pela I-23-PM.
- Um item com status `deactivated` continuará armazenado e poderá ser consultado pelo administrador.
- O dashboard do `almoxarife` e do `adm` deve exibir um card/lista de itens `pending`.

### Requisitos do cliente — recebidos em 31/10/2026

Os pontos abaixo passam a ser requisitos de negócio confirmados. Eles complementam e, quando houver conflito, substituem as regras simplificadas do modelo inicial deste documento.

#### Vocabulário de negócio

- **Catálogo Geral / Registro:** nome operacional genérico e estável, como `Motosserra`, `Mangueira 1 1/2`, `Motobomba` ou `Macacesto`. O Registro serve para agrupar e somar equipamentos semelhantes.
- **Ficha patrimonial:** equipamento físico individual, identificado por `Nº de Patrimônio`, com modelo, marca, especificações, datas e demais detalhes internos.
- **Quantidade no painel:** total derivado pela contagem das fichas patrimoniais vinculadas ao mesmo Registro. Não deve haver botões `+` e `-` nem quantidade manual por ficha.

#### Requisitos funcionais confirmados

1. **Rastreio e soma automática:** cada equipamento físico deve possuir uma ficha e um `Nº de Patrimônio`; o painel deve contar automaticamente quantas fichas existem para cada Registro.
2. **Catálogo genérico versus item:** o Catálogo Geral deve usar somente o nome operacional puro. Modelo, marca, especificação e demais atributos ficam na ficha patrimonial.
3. **Aprovação do Catálogo:** o Nível 2 pode solicitar um novo Registro; ele nasce `pending` e só fica ativo após aprovação do Nível 3. O sistema deve impedir nomes duplicados ou excessivamente específicos.
4. **Localização em três níveis:** cada patrimônio deve registrar `SGB` → `Unidade/Cidade` → `Alocação Interna`. A alocação pode ser uma sala, resgate, motomec, B4 ou prefixo de viatura.
5. **Origem da carga:** cada ficha deve informar se o bem é do `Estado (PMESP)`, `Prefeitura/Convênio` ou `Doação/Terceiros`.
6. **Status operacional:** padronizar conforme a I-23-PM: `Operacional`, `Em Manutenção`, `Inservível` ou `Em Trânsito (FMM)`. Quando operacional, a condição deve ser `Novo`, `Bom` ou `Regular`.
7. **Ações rápidas e pendências:** as ações `Mover Local` e `Alterar Status` devem exibir o aviso sobre a documentação obrigatória. A ação do Nível 1 fica pendente de validação pelo Nível 2 e deve registrar a referência documental.
8. **Níveis de acesso:**
   - Nível 1 (`reader`): consulta geral, solicitação de movimentação e alteração de status operacional.
   - Nível 2 (`almoxarife` / Auxiliar B4): solicita novos Registros, cria fichas, valida ações pendentes e movimenta itens dentro da própria cidade.
   - Nível 3 (`adm` / Gerente): controle total e aprovação de novos Registros.
9. **Histórico e inventário:** registrar log completo de alterações, incluindo usuário, data, origem, destino, status e documento de referência. Prever exportação em CSV e PDF para o Inventário Físico Anual.
10. **Referência documental:** para validar uma ação, Nível 2 ou Nível 3 deve informar uma referência alfanumérica, por exemplo `PARTE N 7GB-000/000/26`.

#### Modelo de dados alvo

O modelo futuro deve separar `CatalogRecord` (Registro do catálogo) de `InventoryItem` (ficha física). A ficha deverá conter, além do UUID e patrimônio, `catalogRecordId`, modelo, marca, especificação, data de aquisição, data de fabricação, valor, origem da carga, status operacional, condição operacional e localização em três níveis. Movimentações e alterações devem gerar uma solicitação pendente ou um log com referência documental. A quantidade será uma métrica calculada por Registro, não um campo editável da ficha.

#### Auditoria de aderência ao protótipo atual

| Requisito | Situação atual | Divergência |
| --- | --- | --- |
| Rastreio e soma automática | Parcial | Há UUID e patrimônio, mas existe `quantidade` editável por item; o resumo atual conta linhas e não trabalha com um Registro de catálogo. |
| Catálogo genérico versus item | Não atendido | `description` e `type` estão no mesmo item e ainda podem conter descrições específicas; não existe entidade de Catálogo Geral. |
| Aprovação de Catálogo / itens | Parcial | O fluxo de item `pending` → `active`/`rejected` está implementado; ainda não há aprovação de Registro nem bloqueio de nomes duplicados. |
| Localização em três níveis | Parcial | Cidade/unidade está implementada e editável pelo almoxarife; SGB e alocação interna continuam pendentes. |
| Origem da carga | Não atendido | O modelo não possui origem PMESP, Prefeitura/Convênio ou Doação/Terceiros. |
| Status operacional I-23-PM | Implementado | O protótipo separa status administrativo de status operacional e usa `Operacional`, `Em Manutenção`, `Inservível`, `Em Trânsito (FMM)` com condição `Novo`, `Bom` ou `Regular`. |
| Ações rápidas e pendências | Parcial/adiado | Ações rápidas `Mover Local` e `Alterar Status` foram adiadas; a aprovação/rejeição de itens e o card de pendências estão implementados. |
| Níveis de acesso | Parcial | Existem três perfis, mas o `reader` atual é somente leitura e não pode mover nem alterar status; os escopos por cidade e a aprovação de catálogo não existem. |
| Histórico e inventário | Parcial | Histórico local, `lastTimeTouched`, colunas configuráveis e exportações CSV/PDF estão implementados; persistência real e inventário oficial continuam fora do protótipo. |
| Referência documental | Não atendido | Nenhum formulário solicita ou armazena o identificador do documento. |

O CSV de salvamento importado contém uma duplicidade de origem (`48291`). Ela foi preservada no protótipo para não alterar a fonte; a regra futura deve impedir novas duplicidades e tratar o saneamento dessa ocorrência durante a importação.

### Decisões e recorte da próxima implementação — 01/11/2026

- **Rastreio e soma:** manter o comportamento atual nesta etapa. A evolução para Catálogo Geral separado fica aguardando a averiguação do cliente.
- **Aprovação de itens:** manter o fluxo de ficha criada pelo almoxarife como `pending`, invisível para a consulta operacional. O gestor pode aprovar (`active`) ou rejeitar (`rejected`). A aprovação torna o item visível; a rejeição impede sua entrada na lista de patrimônios.
- **Criação pelo gestor:** itens criados pelo gestor entram automaticamente como `active`.
- **Pendências:** dashboard do almoxarife e do gestor terá um card com a lista de itens `pending`.
- **Status operacional:** substituir os estados físicos atuais pelo padrão I-23-PM: `Operacional` com condição `Novo`, `Bom` ou `Regular`; `Em Manutenção`; `Inservível`; `Em Trânsito (FMM)`. Esse status operacional é independente do status administrativo (`active`, `pending`, `rejected` ou `deactivated`).
- **Localização:** nesta fase implementar somente o campo `cidade`/`unidade`. O almoxarife poderá editá-lo. SGB e alocação interna ficam aguardando definição.
- **Ações rápidas:** não implementar agora `Mover Local` e `Alterar Status` como ações rápidas.
- **Histórico:** retirar a tela de detalhes como fluxo principal e incluir `Histórico` nas ações da tabela. Registrar `lastTimeTouched` para movimentação, inclusão, remoção ou edição.
- **Tabela configurável:** permitir que o usuário escolha, por checkboxes, quais colunas deseja visualizar. Os demais campos do patrimônio poderão ser adicionados à tabela sem alterar o modelo de dados.
- **Exportação:** oferecer exportação da consulta atual em PDF e adicionar no navegador lateral uma exportação geral em CSV ou PDF. A exportação deve respeitar os itens que o perfil pode consultar; confirmar com o cliente se “todos os itens” do menu lateral deve ter alguma exceção administrativa.
- **Catálogo, origem da carga e referência documental:** continuam aguardando definição explícita do cliente, pois foram marcados como pontos a averiguar ou não receberam decisão nesta rodada.

### Plano de execução revisado

1. **Ajuste do domínio:** adicionar `rejected`, separar status administrativo de status operacional I-23-PM, incluir cidade/unidade e `lastTimeTouched`, e atualizar estados, labels, filtros e dados de demonstração.
2. **Fluxo de aprovação:** ajustar criação do almoxarife para `pending`, esconder pendentes do `reader`, criar a lista de pendências para almoxarife e gestor, permitir ao gestor aprovar ou rejeitar e tornar a criação do gestor automaticamente `active`.
3. **Edição da localização:** adicionar cidade/unidade à ficha e à tabela; permitir edição pelo almoxarife e atualização do `lastTimeTouched`.
4. **Histórico e tabela:** trocar o acesso principal aos detalhes por histórico na coluna de ações, exibir `lastTimeTouched` e implementar o seletor de colunas com checkboxes.
5. **Exportações:** exportar a consulta filtrada em PDF; no navegador lateral, permitir escolher CSV ou PDF para exportação do conjunto permitido ao usuário.
6. **Validação:** testar os três perfis, aprovação e rejeição, visibilidade dos itens, filtros, estados I-23-PM, edição de cidade, histórico, colunas configuráveis e exportações.
7. **Decisões futuras:** somente após o retorno do cliente, modelar Catálogo Geral, origem da carga, SGB/alocação interna e referência documental.

## 4. Divisão em entregáveis

Cada etapa abaixo deve resultar em uma parte utilizável ou verificável do protótipo.

---

## Entregável 1 — Fundação do projeto

### Objetivo

Preparar a estrutura mínima para a implementação sem criar ainda as telas finais.

### Tarefas

- Confirmar a configuração existente do Tailwind CSS.
- Criar a estrutura de pastas:

  ```text
  src/
    components/
    data/
    layouts/
    pages/
    types/
    utils/
  ```

- Criar os tipos TypeScript do domínio.
- Definir constantes para tipos, estados e status.
- Definir os perfis de usuário e suas permissões.
- Remover ou deixar isolados os estilos e componentes de demonstração do CRA.

### Entrega

- Tipos do domínio compilando.
- Estrutura inicial de pastas criada.
- Nenhuma tela funcional ainda é necessária.

### Critérios de aceite

- `npm run build` consegue analisar os novos tipos sem erros de TypeScript relacionados à modelagem.
- Os nomes dos estados e status são usados de forma consistente em toda a aplicação.

---

## Entregável 2 — Dados importados e complementados do estoque

### Objetivo

Criar uma base local realista para alimentar a interface.

### Tarefas

- Importar os 140 números de patrimônio da planilha `PATRIMONIO SALVAMENTO 2SGB.csv`.
- Manter os campos do modelo de negócio (UUID, descrição, tipo, estado, valor, quantidade e status) no seed local.
- Distribuir os registros entre:
  - Viaturas e veículos.
  - Mangueiras e acessórios.
  - Equipamentos de resgate.
  - Equipamentos de proteção individual.
  - Ferramentas operacionais.
  - Comunicação e eletrônicos.
  - Apoio e infraestrutura.
- Gerar UUIDs válidos ou identificadores fixos com formato UUID.
- Preservar os números de patrimônio recebidos na planilha, mantendo a ordem e eventuais duplicidades da fonte.
- Distribuir valores, quantidades, estados e status.
- Garantir a existência de itens ativos, pendentes e desativados.
- Criar funções auxiliares de formatação de moeda, status e estado.

### Entrega

- Arquivo de dados com os 140 patrimônios importados da planilha do cliente.
- Arquivo de usuários demonstrativos:

  ```ts
  reader@cbmsp.test
  almoxarife@cbmsp.test
  adm@cbmsp.test
  ```

### Critérios de aceite

- A aplicação consegue carregar os dados sem chamadas de rede.
- A importação preserva a fonte; o saneamento de duplicidades patrimoniais fica fora deste protótipo.
- Há dados suficientes para testar paginação ou rolagem da tabela.
- Há registros que permitem demonstrar todos os estados e status.

---

## Entregável 3 — Shell visual e navegação

### Objetivo

Criar a estrutura visual comum a todas as telas.

### Tarefas

- Criar o layout principal do sistema.
- Criar cabeçalho com nome do sistema e usuário atual.
- Criar navegação para dashboard e estoque.
- Criar botão de sair da sessão simulada.
- Definir identidade visual usando azul institucional, vermelho para ações críticas e amarelo para pendências.
- Criar componentes reutilizáveis:
  - `Button`.
  - `Badge`.
  - `Card`.
  - `Modal` ou `Drawer`.
  - `Input`.
  - `Select`.
  - `EmptyState`.

### Entrega

- Layout navegável.
- Componentes visuais básicos.
- Páginas vazias de dashboard e estoque.

### Critérios de aceite

- O layout funciona em desktop e em uma largura aproximada de tablet.
- A navegação entre as páginas funciona sem recarregar a aplicação.
- O estado visual de ativo, pendente e desativado é facilmente distinguível.

---

## Entregável 4 — Login simulado e seleção de perfil

### Objetivo

Permitir iniciar uma sessão fictícia com um dos três níveis de acesso.

### Tarefas

- Criar tela de login.
- Validar apenas se o usuário informado pertence à lista mockada.
- Usar uma senha fictícia comum para os usuários demonstrativos.
- Armazenar o usuário atual em estado local.
- Redirecionar o usuário para o dashboard após o login.
- Exibir o nome e o perfil atual no layout.
- Criar uma ação de logout.

### Entrega

- Login funcional para os três perfis.
- Sessão simulada durante a navegação.

### Critérios de aceite

- Cada usuário demonstrativo consegue entrar.
- Usuário inexistente recebe mensagem de erro.
- O logout retorna à tela de login.
- O perfil selecionado controla as permissões visualizadas nas próximas telas.

---

## Entregável 5 — Dashboard inicial

### Objetivo

Apresentar uma visão resumida do estoque assim que o usuário entrar.

### Tarefas

- Criar cards com:
  - Total de itens ativos.
  - Total de itens pendentes.
  - Total de itens desativados.
  - Valor total estimado.
- Criar uma seção com itens recentemente adicionados.
- Criar uma seção com itens desgastados ou fora de uso.
- Aplicar os filtros de visibilidade do perfil aos números exibidos.

### Entrega

- Dashboard funcional com dados calculados a partir do mock local.

### Critérios de aceite

- Os números são calculados a partir dos itens carregados.
- O `reader` não recebe dados de itens desativados ou pendentes.
- O dashboard não depende de API ou banco de dados.

---

## Entregável 6 — Consulta e filtros do estoque

### Objetivo

Entregar a principal funcionalidade de consulta do protótipo.

### Tarefas

- Criar tabela de estoque.
- Exibir as colunas:
  - Descrição.
  - Tipo.
  - Estado.
  - Patrimônio.
  - Quantidade.
  - Valor.
  - Status.
  - Ações.
- Criar busca textual por descrição.
- Criar filtro por tipo.
- Criar filtro por status.
- Adicionar, se necessário, filtro por estado como melhoria visual.
- Criar estado vazio para nenhum resultado.
- Criar indicação de quantidade de resultados.
- Adicionar ordenação simples por descrição ou patrimônio, se o tempo permitir.

### Regras de visibilidade

- `reader`: lista somente itens `active`.
- `almoxarife`: lista itens operacionais e pendentes.
- `adm`: lista todos os itens.

### Entrega

- Consulta completa com filtros combináveis.

### Critérios de aceite

- A busca por descrição ignora diferenças entre maiúsculas e minúsculas.
- Tipo, status e descrição podem ser combinados.
- O filtro de status não permite ao `reader` revelar itens não ativos.
- A tabela continua utilizável com os 140 registros importados.

---

## Entregável 7 — Detalhamento do item

### Objetivo

Permitir consultar todos os dados de um patrimônio sem sair da lista.

### Tarefas

- Criar modal ou drawer de detalhes.
- Exibir todos os campos do item.
- Formatar valor em reais.
- Exibir badges para estado e status.
- Exibir ações disponíveis de acordo com o perfil.
- Criar modo somente leitura para o `reader`.

### Entrega

- Consulta detalhada de qualquer item visível.

### Critérios de aceite

- O usuário consegue abrir e fechar os detalhes.
- Os dados exibidos correspondem ao registro selecionado.
- O `reader` não visualiza controles de edição.

---

## Entregável 8 — Criação de itens

### Objetivo

Demonstrar a inclusão de novos patrimônios.

### Tarefas

- Criar formulário de novo item.
- Validar campos obrigatórios visualmente.
- Criar UUIDs e complementar os campos de negócio sem alterar os números de patrimônio importados.
- Permitir que o `almoxarife` informe os campos permitidos.
- Definir automaticamente `status: pending` para o almoxarife.
- Definir automaticamente `status: active` para itens criados pelo `adm`.
- Adicionar o item à lista local após o salvamento.
- Exibir mensagem de sucesso.

### Entrega

- Fluxo completo de inclusão para almoxarife e administrador.

### Critérios de aceite

- `reader` não vê o botão de novo item.
- Item criado pelo almoxarife aparece como pendente.
- Item criado pelo administrador começa como `active`.
- O novo item aparece na consulta após o salvamento.

---

## Entregável 9 — Edição por perfil

### Objetivo

Demonstrar as diferenças entre as permissões do almoxarife e do administrador.

### Tarefas

- Criar modo de edição para o `almoxarife`.
- Permitir alteração de `quantidade` e `state`.
- Permitir edição de cidade/unidade pelo `almoxarife`.
- Atualizar `lastTimeTouched` após qualquer edição relevante.
- Bloquear visualmente campos administrativos para o almoxarife.
- Criar modo de edição completo para o `adm`.
- Permitir alteração do `status` pelo administrador.
- Atualizar a tabela e os cards após o salvamento.
- Criar confirmação visual após a edição.

### Entrega

- Edição de item conforme o perfil.

### Critérios de aceite

- `reader` não consegue iniciar edição.
- `almoxarife` não consegue alterar status, descrição ou valor.
- `adm` consegue alterar qualquer campo.
- Alterações refletem imediatamente no dashboard e na tabela.

---

## Entregável 10 — Fluxo de pendências

### Objetivo

Demonstrar o ciclo de um item criado pelo almoxarife até sua aprovação administrativa.

### Tarefas

- Destacar itens pendentes na tabela.
- Criar filtro ou atalho para pendências.
- Exibir no dashboard do almoxarife e do administrador um card com itens pendentes.
- Exibir ações de aprovar e rejeitar para o administrador.
- Atualizar o status após a decisão.
- Garantir que um item ativado passe a aparecer para o `reader`.
- Garantir que um item rejeitado não entre na lista operacional de patrimônios.

### Entrega

- Fluxo de criação, revisão e ativação demonstrável.

### Critérios de aceite

- Almoxarife cria item pendente.
- Almoxarife e administrador localizam o item no card de pendências.
- Administrador aprova ou rejeita o item.
- Reader passa a consultar o item depois da ativação.
- Item rejeitado não aparece para consulta operacional.

---

## Entregável 11 — Estados de interface e acabamento

### Objetivo

Deixar o protótipo apresentável e consistente para demonstração.

### Tarefas

- Criar estados de carregamento simulados, se necessário.
- Criar estados vazios.
- Criar mensagens de erro e sucesso.
- Revisar textos em português.
- Revisar contraste e legibilidade.
- Revisar comportamento em telas menores.
- Adicionar confirmação para ações administrativas importantes.
- Garantir que os botões não apareçam para perfis sem permissão.

### Entrega

- Protótipo visualmente consistente e navegável.

### Critérios de aceite

- Nenhuma tela principal fica sem feedback após uma ação.
- Não há textos de placeholder esquecidos.
- Não há botões quebrados ou links sem destino.
- As mensagens deixam claro o resultado de cada operação.

---

## 5. Marco de pronto para teste

O protótipo estará pronto para teste manual quando todos os itens abaixo estiverem concluídos:

- [ ] Login funciona com os três usuários demonstrativos.
- [ ] Logout retorna para a tela de login.
- [ ] Dashboard apresenta os dados do estoque.
- [ ] Existem 140 registros importados da planilha do cliente.
- [ ] A tabela lista os bens do estoque.
- [ ] Busca por descrição funciona.
- [ ] Filtro por tipo funciona.
- [ ] Filtro por status funciona.
- [ ] O `reader` vê somente itens ativos.
- [ ] O `reader` não vê ações de criação ou edição.
- [ ] O `almoxarife` consegue editar quantidade e estado.
- [ ] O `almoxarife` consegue criar item pendente.
- [ ] O `adm` consegue editar todos os campos.
- [ ] O `adm` consegue alterar o status.
- [ ] O fluxo pendente → ativo pode ser demonstrado.
- [ ] Os detalhes de um item podem ser consultados.
- [ ] Valores aparecem formatados em reais.
- [ ] Estados vazios e mensagens de sucesso estão presentes.
- [ ] A aplicação inicia sem erros no console do navegador.

## 6. Roteiro do teste manual

### Teste A — Reader

1. Entrar com `reader@cbmsp.test`.
2. Confirmar que o dashboard carrega.
3. Abrir o estoque.
4. Confirmar que somente itens ativos aparecem.
5. Pesquisar por `mangueira`.
6. Filtrar por tipo `viatura`.
7. Abrir o histórico pela coluna de ações.
8. Confirmar que não existem botões de criar ou editar.

### Teste B — Almoxarife

1. Sair e entrar com `almoxarife@cbmsp.test`.
2. Abrir um item ativo.
3. Alterar a quantidade.
4. Alterar o status operacional e a condição conforme as opções I-23-PM.
5. Alterar a cidade/unidade, salvar e verificar a atualização na tabela.
6. Criar um novo item.
7. Confirmar que o status inicial é `pending`.
8. Confirmar que os campos administrativos não podem ser alterados.

### Teste C — Administrador

1. Sair e entrar com `adm@cbmsp.test`.
2. Filtrar os itens pendentes.
3. Abrir o item criado pelo almoxarife.
4. Alterar o status para `active`.
5. Confirmar que o item deixa de ser pendente.
6. Entrar como `reader`.
7. Confirmar que o item ativado agora aparece para consulta.
8. Voltar como administrador e desativar outro item.
9. Sair, entrar como almoxarife e criar outro item.
10. Voltar como administrador, rejeitar o item e confirmar que ele não aparece para o reader.
11. Criar um item como administrador e confirmar que ele começa como `active`.

## 7. Itens ainda não implementados nesta versão

Os itens abaixo não fazem parte do protótipo atual, mas os requisitos do cliente registrados na seção anterior passam a compor o backlog obrigatório do produto. A ausência deles nesta versão não deve ser interpretada como decisão de excluí-los do sistema final.

- Banco de dados.
- API ou integração com sistemas externos.
- Autenticação real.
- Controle real de senha ou sessão.
- Persistência real do histórico em banco de dados.
- Upload de documentos ou fotos.
- Impressão de etiquetas patrimoniais.
- Leitura de QR Code ou código de barras.
- Movimentação entre unidades.
- Relatórios oficiais.
- Validação jurídica ou patrimonial.

## 8. Próximo passo recomendado

Implementar as decisões futuras do cliente (Catálogo Geral, origem da carga, SGB/alocação interna e referência documental) somente após confirmação. O fluxo de aprovação, status operacional, cidade, histórico, colunas e exportações já compõem a base funcional desta rodada.
