# UI primitives

Componentes visuais independentes para o protótipo do almoxarifado. Todos os estilos ficam nos próprios componentes usando classes utilitárias do Tailwind CSS.

## Importação

```tsx
import {
  Button,
  CardBox,
  CurrencyField,
  Heading,
  Icon,
  InputField,
  Label,
  LinkButton,
  SelectInput,
  SelectField,
  TextInput,
} from './library';
```

## Botões

```tsx
<Button variant="primary">Salvar</Button>
<Button variant="outline" loading>Processando</Button>
<Button variant="danger">Desativar</Button>
<LinkButton href="/estoque" variant="ghost">Estoque</LinkButton>
```

Variantes disponíveis: `primary`, `secondary`, `outline`, `ghost`, `danger` e `link`.

Tamanhos disponíveis: `sm`, `md` e `lg`.

## Campos

```tsx
<InputField label="Descrição" required placeholder="Nome do item" />

<IconField
  label="Buscar"
  icon={<Icon name="search" className="h-4 w-4" />}
  placeholder="Pesquisar patrimônio"
/>

<CurrencyField label="Valor unitário" min="0" step="0.01" />
```

Todos os campos suportam `label`, `description`, `error`, `required`, `disabled` e `fieldClassName`.

Para compor o rótulo e o controle separadamente, use os primitivos básicos:

```tsx
<Label htmlFor="unit">Unidade</Label>
<SelectInput id="unit" value={unit} onChange={handleUnitChange}>
  <option value="">Selecione</option>
  <option value="capital">Capital</option>
</SelectInput>

<TextInput aria-label="Buscar patrimônio" value={query} onChange={handleQueryChange} />
```
