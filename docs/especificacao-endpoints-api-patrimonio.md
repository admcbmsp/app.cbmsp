**INTEGRAÇÃO BACKEND**

# Especificação dos endpoints do sistema patrimonial

Proposta de API REST para persistência de itens, consulta operacional e histórico de auditoria

Versão 1.1  |  Novembro de 2026  |  Documento para alinhamento técnico

Este documento descreve os endpoints necessários para conectar o sistema patrimonial ao backend e ao banco PostgreSQL. O fluxo de login permanece fora deste escopo. A API deve preservar cada item e seu histórico desde o cadastro até a desativação, identificando o usuário responsável, a data e a hora, o campo alterado e os valores anterior e novo.

## Objetivo e escopo

A proposta cobre consulta, cadastro, edição, aprovação, rejeição e desativação de patrimônios, além dos dados de painel, perfil e usuários já presentes no protótipo. As rotas usam o prefixo `/api/v1`. Toda rota pressupõe uma identidade autenticada fornecida pelo mecanismo de login existente.

A API deve obter do contexto autenticado o identificador e o perfil do usuário. O cliente não pode enviar esses dados como autoridade para registrar uma alteração ou ampliar seu acesso. O backend também valida o escopo de unidade solicitado em cada consulta e operação.

## Auditoria do item

Cada alteração efetiva em um patrimônio gera um registro de histórico. Isso inclui valor, status do cadastro, estado de conservação, condição operacional, cidade ou unidade, descrição, tipo, quantidade e número patrimonial. Se uma solicitação enviar um valor igual ao já salvo, a API não cria um evento para esse campo.

O item deve expor uma lista `history`. Cada evento identifica o campo alterado, o valor anterior, o novo valor, o usuário, a data e a hora e uma frase em português para leitura. Para uma atualização com vários campos, a API registra um evento por campo alterado. Assim, preço, estado e status permanecem consultáveis separadamente. A justificativa de rejeição também entra nessa lista como um novo evento, sem substituir observações anteriores. O texto digitado fica no campo `reason`; o campo `summary` recebe o prefixo “MOTIVO DA REJEIÇÃO: ” para exibição.

- A criação registra um evento `created` com os dados iniciais do patrimônio, o usuário autenticado e o horário do cadastro.
- A aprovação, a rejeição e a desativação registram a mudança de status com os valores anterior e novo.
- A rejeição exige um motivo não vazio de até 281 caracteres. O backend grava um novo evento por item rejeitado, com `reason`, usuário, horário e `summary` em português. O limite de 281 vale para o motivo digitado; o histórico acumulado não usa um limite total de texto.
- O servidor define usuário e horário. O cliente não envia nem altera os campos de auditoria.
- A atualização do item e a gravação do histórico ocorrem na mesma transação. Se uma parte falhar, nenhuma das duas é confirmada.
- O histórico é somente de acréscimo. A desativação mantém o item e seus eventos; não se prevê exclusão física do patrimônio.

### Exemplo de evento de auditoria

Para uma mudança de estado de regular para bom, a resposta contém um registro semelhante a este. Os valores técnicos permanecem disponíveis para integração, e o campo `summary` apresenta a mensagem legível em português.

```json
{
  "action": "edited",
  "field": "state",
  "previousValue": "regular",
  "nextValue": "bom",
  "userId": "usr-123",
  "userName": "Rafael Almeida",
  "timestamp": "2026-11-09T14:30:00Z",
  "summary": "Estado anterior: Regular. Novo estado: Bom."
}
```

O campo `timestamp` usa ISO 8601 em UTC. Para outros campos, a API troca o texto conforme o campo, por exemplo: “Valor anterior: R$ 1.200,00. Novo valor: R$ 1.450,00.” ou “Status anterior: Pendente. Novo status: Ativo.”

## Endpoints de patrimônio

As rotas abaixo atendem às telas de consulta e aos fluxos de cadastro e administração. Os filtros de lista podem ser combinados; a API retorna somente registros que o usuário autenticado pode consultar.

### Inventário

| Método e rota | Finalidade e comportamento esperado |
| --- | --- |
| **GET**<br>`/api/v1/items` | Lista patrimônios com busca textual e filtros por unidade, local, tipo, status, estado e condição operacional. Deve oferecer paginação e total de resultados. |
| **POST**<br>`/api/v1/items` | Cadastra um patrimônio e cria o primeiro evento de auditoria. O servidor define identificador, status inicial, usuário e horário. |
| **GET**<br>`/api/v1/items/{id}` | Retorna os dados do patrimônio, incluindo unidade, local e history. A consulta respeita o perfil e o escopo de unidade. |
| **PATCH**<br>`/api/v1/items/{id}` | Altera um ou mais campos permitidos. Cada campo efetivamente alterado gera seu próprio evento com valores anterior e novo. |
| **POST**<br>`/api/v1/items/{id}/approve` | Aprova um item pendente e registra a transição para ativo. |
| **POST**<br>`/api/v1/items/{id}/reject` | Rejeita um item pendente e registra a transição para rejeitado. |
| **POST**<br>`/api/v1/items/bulk-review` | Aprova ou rejeita em massa os patrimônios indicados em `itemIds`. Para rejeição, exige um motivo e cria um evento de histórico para cada item. |
| **POST**<br>`/api/v1/items/{id}/deactivate` | Desativa um patrimônio e registra a transição. O item e todo o histórico permanecem armazenados. |
| **GET**<br>`/api/v1/items/{id}/history` | Retorna a trilha de auditoria do patrimônio em ordem cronológica, com paginação quando necessário. |
| **GET**<br>`/api/v1/units/{unitId}/locations` | Lista os locais cadastrados para a unidade indicada e autorizada, para preencher os formulários de criação e edição. |

### Parâmetros e corpo das rotas de inventário

GET `/api/v1/items` aceita `unit`, `localId`, `q`, `type`, `status`, `state`, `operationalStatus`, `page` e `pageSize`. `unit` recebe o identificador da unidade e `localId` filtra por um local específico. O backend valida se o usuário pode consultar a unidade solicitada.

`q` significa *query*: é o texto livre da busca. A API procura correspondências parciais, sem diferenciar maiúsculas e minúsculas, nos campos `description` e `nrPatrimonio`. Por exemplo, `q=viatura` pode encontrar uma descrição que contenha “Viatura”; os outros parâmetros continuam sendo filtros independentes.

### Modelo de dados de unidade e local

No backend, cada unidade deve ter um identificador próprio (`unitId`). Cada local cadastrado tem seu próprio identificador e pertence a uma unidade por `unitId`. O item armazena `unitId` e um `localId` obrigatório, que deve apontar para um local da mesma unidade. A API e o banco devem impedir que um item de Campinas referencie um local cadastrado para Jundiaí.

No protótipo, o campo `cidade` contém atualmente rótulos de unidade, como “EB HOLAMBRA”. No modelo persistente, `unitId` deve ser a chave de relacionamento da unidade. Mantenha `cidade` somente se o município geográfico também precisar ser armazenado como um dado separado.

POST `/api/v1/items` exige `unitId` e `localId`. Um PATCH que muda a unidade deve enviar os dois identificadores na mesma atualização; PATCHes de outros campos podem omiti-los.

GET `/api/v1/items` e GET `/api/v1/items/{id}` retornam `unitId`, `localId` e `localName` para exibição. GET `/api/v1/units/{unitId}/locations` retorna os locais cadastrados para preencher o seletor e só responde quando o usuário tem acesso à unidade.

Quando o usuário muda a unidade no formulário, o frontend carrega os locais da nova unidade, limpa o local anterior e exige uma nova seleção antes de salvar. Assim, ao mudar de Jundiaí para Campinas, os locais de Jundiaí deixam de aparecer. Se a unidade ainda não tiver locais cadastrados, o formulário não pode salvar o item até que um local seja cadastrado. A API rejeita um `localId` ausente, inexistente ou pertencente a outra unidade com `422 Unprocessable Entity`. A consulta de locais está prevista aqui; os endpoints e os perfis responsáveis por cadastrar e manter esse catálogo ainda precisam ser definidos.

POST `/api/v1/items` recebe os dados de negócio do patrimônio, como `description`, `type`, `state`, `operationalStatus`, `valor`, `quantidade`, `nrPatrimonio`, `unitId` e `localId`. Não aceita `history`, `userId`, `userName`, `timestamp` ou `lastTimeTouched` enviados pelo cliente.

PATCH `/api/v1/items/{id}` recebe somente os campos a alterar. Por exemplo, `{"valor": 1450.00, "state": "bom"}`. Para mudar a unidade, envia `unitId` e `localId` juntos. O servidor valida a relação entre eles, compara cada campo com o registro atual e monta os eventos. Em alterações de `status` feitas diretamente por administrador, a mesma auditoria é obrigatória.

`POST /api/v1/items/bulk-review` recebe `action` (`approve` ou `reject`) e a lista explícita `itemIds`. Para rejeitar, exige `reason` de até 281 caracteres; o mesmo motivo é registrado em cada item do lote. Cada item recebe um evento próprio no histórico. A rota valida que todos os IDs existem, estão pendentes e pertencem ao escopo autorizado. A operação é atômica: se um item não puder ser atualizado, nenhum muda e a API retorna `409 Conflict`. Somente os IDs enviados são processados. No protótipo, a aprovação individual também ativa pendentes da mesma descrição e unidade; a rota individual de produção deve atuar somente sobre o ID solicitado.

### Painel e consultas agrupadas

| Método e rota | Finalidade e comportamento esperado |
| --- | --- |
| **GET**<br>`/api/v1/dashboard` | Retorna indicadores do painel e movimentações recentes para a unidade solicitada. Os dados respeitam as permissões do perfil. |
| **GET**<br>`/api/v1/items/groups` | Opcional quando a lista usar paginação no servidor. Retorna itens agrupados por descrição e as contagens por condição e status. |

A rota de grupos pode ser dispensada se o navegador receber todos os registros e calcular os agrupamentos localmente. A rota de painel pode retornar os totais e as seis movimentações mais recentes, evitando carregar o histórico completo de cada item.

## Perfil e administração de usuários

| Método e rota | Finalidade e comportamento esperado |
| --- | --- |
| **GET**<br>`/api/v1/me` | Retorna o usuário autenticado e seus dados de perfil e acesso, quando esses dados não vierem no retorno do login. |
| **PATCH**<br>`/api/v1/me/profile` | Atualiza nome, sobrenome, patente, unidade e telefone de contato do próprio usuário. |
| **GET**<br>`/api/v1/users` | Lista usuários para a tela de administração, com filtro por unidade quando aplicável. |
| **PATCH**<br>`/api/v1/users/{id}/role` | Altera o perfil de acesso do usuário. Restrita a administradores. |

## Modelos de consulta opcionais

Os modelos de consulta ficam no armazenamento local do navegador no protótipo. Se o cliente quiser sincronizá-los entre dispositivos, a API poderá oferecer GET e POST `/api/v1/me/inventory-views`, PATCH e DELETE `/api/v1/me/inventory-views/{id}` e PUT `/api/v1/me/inventory-views/default`.

A exportação CSV e a preparação do PDF podem permanecer no navegador. Uma rota de relatório será necessária se houver geração no servidor ou exportação de volumes que não devam ser carregados pelo navegador.

## Acesso e regras de operação

A API deve aplicar autorização no servidor em todas as rotas. O perfil reader consulta itens ativos; almoxarifes podem cadastrar e atualizar os campos operacionais permitidos; administradores podem aprovar ou rejeitar pendências, alterar status administrativos e gerenciar perfis de usuário. As permissões devem ser validadas por operação, não apenas por tela.

No fluxo demonstrativo, novos itens cadastrados por almoxarifes começam pendentes e os cadastrados por administradores começam ativos. Caso seja mantida a regra que permite ativar automaticamente novos exemplares quando já existe cadastro aprovado com a mesma descrição na unidade, o backend deve aplicar essa regra em POST `/api/v1/items`.

### Respostas e erros

As consultas e alterações retornam `HTTP 200`; a criação retorna `HTTP 201`. A API deve responder `401` quando não houver identidade autenticada, `403` para falta de permissão, `404` quando o item não existir ou estiver fora do escopo, `409` para conflito de estado e `422` para dados inválidos, inclusive quando `localId` estiver ausente ou não pertencer à unidade informada. As mensagens devem identificar o problema sem expor dados de outros usuários ou unidades.

