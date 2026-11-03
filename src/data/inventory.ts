import { City, InventoryHistoryEntry, InventoryItem, ItemState, ItemStatus, OperationalStatus, cityOptions, statusLabels } from '../types/inventory';
import { hasApprovedRegistration } from '../utils/inventory';
import { patrimonioSalvamentoNumbers } from './patrimonySalvamento';

type CategorySeed = {
  type: string;
  prefix: string;
  count: number;
  baseValue: number;
  valueStep: number;
  descriptions: string[];
};

const categorySeeds: CategorySeed[] = [
  {
    type: 'viatura',
    prefix: 'VTR',
    count: 18,
    baseValue: 285000,
    valueStep: 18500,
    descriptions: [
      'Caminhão Auto Bomba Tanque',
      'Viatura de Resgate e Salvamento',
      'Pickup 4x4 de Operações',
      'Caminhão Plataforma Aérea',
      'Viatura de Resgate e Salvamento',
      'Unidade Móvel de Comando',
      'Viatura de Atendimento Pré-hospitalar',
      'Viatura de Resgate e Salvamento',
      'Caminhão Auto Bomba Tanque',
    ],
  },
  {
    type: 'mangueira',
    prefix: 'MNG',
    count: 40,
    baseValue: 580,
    valueStep: 45,
    descriptions: [
      'Mangueira de incêndio tipo 1 — 1 1/2 polegada',
      'Mangueira de incêndio tipo 2 — 2 1/2 polegadas',
      'Mangueira de incêndio tipo 3 — 2 1/2 polegadas',
      'Mangueira de sucção rígida',
      'Esguicho regulável de vazão',
      'Esguicho de jato sólido',
      'Divisor de duas saídas',
      'Carretel de mangotinho',
      'Adaptador storz de engate rápido',
    ],
  },
  {
    type: 'resgate',
    prefix: 'RSG',
    count: 34,
    baseValue: 3200,
    valueStep: 390,
    descriptions: [
      'Desencarcerador hidráulico combinado',
      'Cilindro hidráulico telescópico',
      'Cortador hidráulico de coluna',
      'Expansor hidráulico de resgate',
      'Bomba hidráulica portátil',
      'Macaco hidráulico de resgate',
      'Prancha longa de salvamento',
      'Prancha a vácuo',
      'Tripé de resgate com guincho',
      'Guincho elétrico portátil',
      'Sistema de ancoragem para altura',
    ],
  },
  {
    type: 'epi',
    prefix: 'EPI',
    count: 45,
    baseValue: 680,
    valueStep: 58,
    descriptions: [
      'Jaqueta de proteção para combate a incêndio',
      'Calça de proteção para combate a incêndio',
      'Bota de combate a incêndio',
      'Capacete de combate a incêndio estrutural',
      'Capacete para salvamento e resgate',
      'Máscara autônoma de proteção respiratória',
      'Cilindro de ar respirável',
      'Cinto de segurança para trabalho em altura',
      'Luva de proteção térmica',
      'Lanterna intrinsecamente segura',
    ],
  },
  {
    type: 'ferramenta',
    prefix: 'FER',
    count: 25,
    baseValue: 920,
    valueStep: 125,
    descriptions: [
      'Motosserra profissional de resgate',
      'Serra sabre elétrica',
      'Serra circular portátil',
      'Machado de bombeiro',
      'Marreta de resgate',
      'Cortador de concreto',
      'Escada extensível de alumínio',
      'Escada de gancho',
      'Detector multigás',
      'Ventilador de pressão positiva',
    ],
  },
  {
    type: 'comunicacao',
    prefix: 'COM',
    count: 22,
    baseValue: 1450,
    valueStep: 180,
    descriptions: [
      'Rádio comunicador portátil digital',
      'Rádio comunicador veicular',
      'Repetidor móvel de comunicação',
      'Tablet robusto para operações',
      'GPS profissional de navegação',
      'Câmera térmica portátil',
      'Central de carregamento de rádios',
      'Megafone portátil de alta potência',
    ],
  },
  {
    type: 'infraestrutura',
    prefix: 'INF',
    count: 16,
    baseValue: 2600,
    valueStep: 275,
    descriptions: [
      'Gerador elétrico portátil',
      'Torre de iluminação portátil',
      'Bomba d’água de alta vazão',
      'Compressor de ar portátil',
      'Tenda operacional de resposta',
      'Armário metálico para equipamentos',
      'Contêiner de armazenamento móvel',
      'Lavadora de alta pressão',
    ],
  },
];

const states: ItemState[] = [
  'novo',
  'bom',
  'bom',
  'regular',
  'novo',
  'regular',
];

const cities: City[] = cityOptions;

const makeUuid = (index: number) => {
  const suffix = index.toString(16).padStart(12, '0');
  return `00000000-0000-4000-8000-${suffix}`;
};

const makeStatus = (globalIndex: number, operationalStatus: OperationalStatus): ItemStatus => {
  if (operationalStatus === 'inservivel') {
    return 'deactivated';
  }

  if (globalIndex % 19 === 0) {
    return 'deactivated';
  }

  if (globalIndex % 11 === 0) {
    return 'pending';
  }

  return 'active';
};

const makeOperationalStatus = (globalIndex: number): OperationalStatus => {
  if (globalIndex % 23 === 0) {
    return 'inservivel';
  }

  if (globalIndex % 17 === 0) {
    return 'em-manutencao';
  }

  if (globalIndex % 13 === 0) {
    return 'em-transito';
  }

  return 'operacional';
};

const makeSeedHistory = (itemIndex: number, status: ItemStatus, cidade: City): InventoryHistoryEntry[] => [{
  id: `history-seed-${itemIndex + 1}`,
  action: 'created',
  userId: 'seed-import',
  userName: 'Importação da planilha',
  timestamp: `2026-10-${String((itemIndex % 28) + 1).padStart(2, '0')}T12:00:00.000Z`,
  summary: `Registro importado para ${cidade}. Cadastro inicial: ${statusLabels[status]}.`,
  nextStatus: status,
  nextCity: cidade,
}];

let globalIndex = 0;

const generatedInventory: InventoryItem[] = categorySeeds.flatMap(
  (category, categoryIndex) =>
    Array.from({ length: category.count }, (_, index) => {
      const itemIndex = globalIndex;
      globalIndex += 1;

      const operationalStatus = makeOperationalStatus(itemIndex);
      const state = operationalStatus === 'operacional'
        ? states[(itemIndex + categoryIndex) % states.length]
        : 'regular';
      const description = category.descriptions[index % category.descriptions.length];
      const cidade = cities[itemIndex % cities.length];
      const status = makeStatus(itemIndex, operationalStatus);

      return {
        uuid: makeUuid(itemIndex + 1),
        description,
        type: category.type,
        state,
        operationalStatus,
        valor: category.baseValue + index * category.valueStep,
        quantidade: 1 as const,
        nrPatrimonio: `CBM-${category.prefix}-${String(index + 1).padStart(4, '0')}`,
        status,
        cidade,
        lastTimeTouched: `2026-10-${String((itemIndex % 28) + 1).padStart(2, '0')}T12:00:00.000Z`,
        history: makeSeedHistory(itemIndex, status, cidade),
      };
    }),
);

let rescueVehicleIndex = 0;

const individualInventory: InventoryItem[] = generatedInventory
  .slice(0, patrimonioSalvamentoNumbers.length)
  .map((item, index) => ({
    ...item,
    nrPatrimonio: patrimonioSalvamentoNumbers[index],
  }))
  .map((item) => {
    if (item.description !== 'Viatura de Resgate e Salvamento') {
      return item;
    }

    const state: ItemState = rescueVehicleIndex % 2 === 0 ? 'bom' : 'regular';
    rescueVehicleIndex += 1;

    return {
      ...item,
      state,
      operationalStatus: 'operacional' as OperationalStatus,
      status: 'active' as ItemStatus,
    };
  });

export const inventorySeed: InventoryItem[] = individualInventory.map((item) => {
  if (item.status !== 'pending' || !hasApprovedRegistration(individualInventory, item.description)) return item;
  return {
    ...item,
    status: 'active',
    history: [...item.history, {
      id: `history-approved-registration-${item.uuid}`,
      action: 'approved',
      userId: 'system',
      userName: 'Sistema',
      timestamp: item.lastTimeTouched,
      summary: 'Exemplar ativado por pertencer a um cadastro já aprovado.',
      previousStatus: 'pending',
      nextStatus: 'active',
    }],
  };
});

export const inventoryItemCount = inventorySeed.length;
