# Pendências do projeto — Protótipo de almoxarifado

Atualizado em 01/11/2026.

Este documento registra o que ainda precisa ser decidido, implementado ou validado após as novas orientações do cliente. O plano principal está em [PLANO_IMPLEMENTACAO_PROTOTIPO.md](<C:\Users\Admin\Desktop\Projects\OnGoing\app.cbmsp\PLANO_IMPLEMENTACAO_PROTOTIPO.md>).

## Status da rodada de implementação

Concluídos nesta rodada: fluxo `pending` → `active`/`rejected`, card de pendências para almoxarife e gestor, criação do gestor como `active`, status operacional I-23-PM, cidade/unidade editável pelo almoxarife, histórico nas ações, `lastTimeTouched`, colunas configuráveis, PDF da consulta e exportação geral CSV/PDF pelo navegador lateral.

As pendências abaixo permanecem abertas porque dependem de decisão do cliente ou foram explicitamente adiadas.

## 1. Decisões pendentes do cliente

Estas definições não devem ser presumidas pela implementação:

- **Catálogo Geral versus ficha patrimonial:** confirmar se haverá uma entidade separada para o Registro genérico ou se a separação será apenas visual nesta primeira versão.
- **Localização futura:** confirmar se, depois do campo cidade/unidade, serão necessários SGB e alocação interna, além da ordem e dos valores permitidos.
- **Origem da carga:** confirmar se o campo será incluído agora e quais opções oficiais devem ser aceitas: Estado (PMESP), Prefeitura/Convênio e Doação/Terceiros.
- **Referência documental:** confirmar se será implementada junto do histórico ou deixada para uma etapa posterior.
- **Exportação geral:** confirmar se o botão “todos os itens” do navegador lateral deve exportar somente o conjunto visível ao perfil ou se será exclusivo do gestor.
- **Itens rejeitados:** confirmar se o gestor e o almoxarife devem consultar itens `rejected` em uma lista administrativa/histórico, embora eles não apareçam na lista operacional de patrimônios.
- **I-23-PM:** confirmar os rótulos e a regra de uso da condição `Novo`, `Bom` e `Regular` somente dentro de `Operacional`.

## 2. Implementações entregues nesta rodada

### Concluído — Fluxo de aprovação e status

- Adicionar o status administrativo `rejected`.
- Manter itens criados pelo almoxarife como `pending`.
- Ocultar itens `pending` e `rejected` da consulta operacional do `reader`.
- Permitir somente ao gestor alterar o status do item.
- Aprovação do gestor: `pending` → `active`.
- Rejeição do gestor: `pending` → `rejected`.
- Fazer itens criados pelo gestor entrarem automaticamente como `active`.
- Criar no dashboard do almoxarife e do gestor um card com a lista de itens pendentes.
- Atualizar testes para aprovação, rejeição e regras de visibilidade.

### Concluído — Status operacional I-23-PM

- Substituir o uso principal de `novo`, `semi-novo`, `desgastado` e `fora-de-uso`.
- Implementar `Operacional`, `Em Manutenção`, `Inservível` e `Em Trânsito (FMM)`.
- Implementar `Novo`, `Bom` e `Regular` como condição subordinada a `Operacional`.
- Atualizar badges, filtros, formulário, resumo e dashboard.
- Definir como os dados mockados/importados serão convertidos para o novo padrão.

### Concluído — Cidade/unidade

- Adicionar `cidade` ou `unidade` ao modelo e aos dados.
- Exibir o campo na tabela e na ficha de edição.
- Permitir que o almoxarife edite a cidade/unidade.
- Atualizar o `lastTimeTouched` quando a cidade/unidade for alterada.
- Manter SGB e alocação interna fora desta etapa, até nova decisão.

### Concluído — Histórico na tabela

- Remover a tela de detalhes como fluxo principal.
- Adicionar a ação `Histórico` na linha do patrimônio.
- Registrar eventos de inclusão, edição, movimentação e remoção.
- Incluir, no mínimo, usuário, data/hora, ação, status anterior, status novo e cidade anterior/nova quando aplicável.
- Adicionar `lastTimeTouched` à ficha e à tabela.
- Definir o comportamento para itens rejeitados: manter o registro no histórico ou removê-lo completamente da consulta administrativa.

### Concluído — Visualização configurável

- Criar controle “Configurar visualização”.
- Exibir checkboxes para ligar/desligar colunas.
- Incluir, quando disponíveis, Registro/descrição, patrimônio, tipo, status administrativo, status operacional, condição, cidade, valor, modelo, marca, especificação, datas, origem e `lastTimeTouched`.
- Garantir que a coluna de ações permaneça sempre visível.
- Avaliar persistência da preferência em `localStorage`.

### Concluído — Exportação

- Adicionar exportação em PDF na tela de consulta.
- Exportar a consulta respeitando filtros, colunas selecionadas e permissões do usuário.
- Adicionar no navegador lateral uma ação de exportação geral.
- Permitir escolher CSV ou PDF no fluxo de exportação geral.
- Confirmar a regra de acesso ao comando “todos os itens”.
- Testar caracteres acentuados, valores monetários, datas, status e colunas ocultas.

## 3. Funcionalidades adiadas explicitamente

- Ações rápidas `Mover Local` e `Alterar Status`.
- Fluxo completo de validação dessas ações por documento.
- SGB e alocação interna.
- Modelagem definitiva do Catálogo Geral, caso o cliente confirme que ela deve ser separada da ficha patrimonial.

## 4. Limitações conhecidas do protótipo atual

- Os dados, histórico, preferência de colunas e tema ficam somente na sessão/localStorage; ainda não há API ou banco de dados.
- O modelo ainda possui `quantidade` editável por item; manter esse comportamento até a decisão sobre Catálogo Geral versus ficha patrimonial.
- A aprovação implementada é da ficha patrimonial. A entidade separada de Catálogo Geral, com bloqueio de nomes duplicados, ainda não foi modelada.
- SGB, alocação interna, origem da carga e referência documental ainda não fazem parte do formulário.
- As ações rápidas `Mover Local` e `Alterar Status` seguem adiadas, conforme instrução do cliente.
- A consulta de itens rejeitados para perfis administrativos e a regra definitiva de exportação geral ainda precisam ser confirmadas.
- O histórico e os arquivos CSV/PDF são uma simulação local para validação do fluxo; não substituem o inventário oficial anual.

## 5. Critérios de aceite da próxima rodada

- Almoxarife cria item e ele aparece como `pending`, sem aparecer para o `reader`.
- Gestor visualiza a lista de pendentes, aprova ou rejeita o item.
- Item aprovado aparece para o `reader`; item rejeitado não aparece na lista operacional.
- Item criado pelo gestor aparece imediatamente como `active`.
- Status operacional e condição seguem a I-23-PM.
- Almoxarife consegue editar cidade/unidade.
- Histórico fica acessível na coluna de ações.
- `lastTimeTouched` é atualizado em toda alteração relevante.
- Usuário consegue configurar as colunas visíveis.
- Consulta pode ser exportada em PDF.
- Menu lateral permite escolher CSV ou PDF para exportação geral, respeitando a permissão definida.

## 6. Validação manual sugerida

1. Entrar como almoxarife e criar um patrimônio.
2. Confirmar status `pending`, ausência na consulta do `reader` e presença no card de pendências.
3. Entrar como gestor e aprovar o item; confirmar que ele passa a aparecer para o `reader`.
4. Criar outro item como almoxarife e rejeitá-lo; confirmar que ele não entra na lista operacional.
5. Criar item como gestor; confirmar status inicial `active`.
6. Editar cidade/unidade como almoxarife e verificar `lastTimeTouched` e histórico.
7. Alterar os checkboxes de colunas e verificar a tabela.
8. Exportar a consulta em PDF.
9. Usar o menu lateral e exportar em CSV e PDF.

