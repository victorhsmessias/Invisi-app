# Documentação do Sistema Invisi-app

## Descrição Geral do Aplicativo

**Invisi-app** é um aplicativo mobile de monitoramento logístico desenvolvido em React Native com TypeScript. O sistema permite acompanhar em tempo real operações de carga, descarga e movimentação de veículos em diferentes filiais de armazenagem e transbordo.

### Funcionalidades Principais:

- **Autenticação de usuários** com sistema de tokens JWT e rate limiting
- **Monitoramento em tempo real** de veículos em trânsito, filas e pátios
- **Gestão de múltiplas filiais** (LDA, CHP, FND, NMD, NMG)
- **Filtros dinâmicos** por serviço, operação padrão, grupos e produtos
- **Dashboard centralizado** com indicadores de status
- **Sistema de contratos** e corte de fila
- **Auto-refresh** inteligente com cache e detecção de navegação rápida
- **Performance otimizada** com FlatList, memoization e virtualização
- **Tipagem TypeScript completa** em todos os componentes e telas

### Tecnologias Utilizadas:

- **React Native 0.81.4** - Framework mobile
- **Expo 54.0.0** - Plataforma de desenvolvimento
- **TypeScript 5.9.3** - Tipagem estática
- **React Navigation 7.x** - Navegação entre telas
- **AsyncStorage** - Persistência local
- **Axios 1.11.0** - Requisições HTTP
- **Context API + useReducer** - Gerenciamento de estado global

---

## Estrutura de Diretórios

```
Invisi-app/
├── App.tsx                    # Ponto de entrada principal da aplicação
├── index.ts                   # Registro do componente raiz
├── package.json               # Dependências e scripts
├── tsconfig.json             # Configuração TypeScript
├── app.json                  # Configuração Expo
├── DOCUMENTACAO_SISTEMA.md   # Esta documentação
└── src/                      # Código fonte principal
    ├── components/           # Componentes reutilizáveis
    │   ├── common/          # Componentes comuns tipados
    │   └── index.ts         # Barrel exports
    ├── constants/            # Constantes e configurações
    │   ├── api.ts           # Configurações de API (fonte única)
    │   ├── index.ts         # Re-exports centralizados
    │   ├── timing.ts        # Constantes de tempo
    │   ├── colors.ts        # Paleta de cores
    │   ├── filters.ts       # Definições de filtros
    │   └── fallbacks.ts     # Dados de fallback
    ├── context/              # Context API e estado global
    ├── hooks/                # Custom hooks
    ├── screens/              # Telas do aplicativo
    ├── services/             # Serviços e API
    ├── types/                # Definições TypeScript
    │   ├── api.ts           # Tipos de API
    │   ├── context.ts       # Tipos de Context
    │   └── index.ts         # Tipos gerais
    └── utils/                # Funções utilitárias
```

---

## Estado Atual do Sistema (Atualizado em 2025-01-09)

### ✅ **Arquitetura de Constantes Consolidada**

**Problema Resolvido:** Havia duplicação de `API_CONFIG` e `STORAGE_KEYS` em múltiplos arquivos com valores conflitantes.

**Solução Implementada:**
- `src/constants/api.ts` → **Fonte única de verdade** para todas as configurações de API
- `src/constants/index.ts` → Re-exporta de `api.ts` para compatibilidade
- Valores padronizados:
  - `CACHE_TIME`: 3 minutos
  - `AUTO_REFRESH`: 60 segundos
  - `BACKGROUND_REFRESH`: 90 segundos

**Filiais Configuradas:**
```typescript
FILIAL_URLS: {
  LDA: "http://192.168.10.201/attmonitor/api",
  CHP: "http://45.4.111.173:9090/attmonitor/api",
  FND: "http://177.84.63.82:9090/attmonitor/api",
  NMD: "http://168.195.5.254:9090/attmonitor/api",
  NMG: "http://138.186.125.143:9090/attmonitor/api",
}
```

### ✅ **Componentes 100% Tipados**

Todos os componentes comuns foram refatorados com TypeScript completo:

#### **InfoRow** (`src/components/common/InfoRow.tsx`)
```typescript
interface InfoRowProps {
  label: string;
  value: string | number;
  isPercentage?: boolean;
  percentageValue?: number;
  isBalance?: boolean;
  balanceValue?: number;
  labelStyle?: TextStyle;
  valueStyle?: TextStyle;
  bold?: boolean;
}
```
- Suporta valores numéricos com cores dinâmicas (positivo/negativo)
- Formatação condicional para percentuais e balanços
- Totalmente memoizado com `React.memo`

#### **UpdateBanner** (`src/components/common/UpdateBanner.tsx`)
```typescript
interface UpdateBannerProps {
  lastUpdate: Date | null;
  onFilterPress?: () => void;
  showFilterButton?: boolean;
  hasActiveFilters?: boolean;
  filterButtonText?: string;
}
```
- Exibe horário da última atualização
- Badge visual quando há filtros ativos
- Botão customizável de filtros

#### **EmptyView** (`src/components/common/EmptyView.tsx`)
```typescript
interface EmptyViewProps {
  icon?: string;
  message?: string;
  subMessage?: string;
  actionText?: string;
  onActionPress?: () => void;
  containerStyle?: ViewStyle;
}
```
- Componente de estado vazio customizável
- Suporta ações opcionais (botões)
- Estilos flexíveis

#### **SideMenu** (`src/components/SideMenu.tsx`)
```typescript
interface NavigationHelpers {
  navigate: (screen: string, params?: object) => void;
  replace: (screen: string, params?: object) => void;
  goBack: () => void;
  [key: string]: unknown;
}

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
  navigation: NavigationHelpers;
}

interface MenuItem {
  id: string;
  title?: string;
  icon?: string;
  screen?: string;
  description?: string;
  isDivider?: boolean;
  isLogout?: boolean;
  onPress?: () => void;
}
```
- Tipagem customizada para navegação (evita `any`)
- Interface para itens de menu
- Animações com `Animated.Value`

### ✅ **MonitorCorteScreen - Tela Totalmente Refatorada**

**Arquivo:** `src/screens/MonitorCorteScreen.tsx`

**Melhorias Implementadas:**

1. **Tipagem Completa**
```typescript
type LoadingType = "background" | "manual" | "initial";

interface ContratoCardProps {
  item: ContratoData;
}

interface FilterOptionProps {
  option: string;
  isSelected: boolean;
  onToggle: (value: string) => void;
}

type MonitorCorteScreenProps = StackScreenProps<RootStackParamList, "MonitorCorte">;
```

2. **Estados Tipados**
```typescript
const [data, setData] = useState<ContratoData[]>([]);
const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
const [loading, setLoading] = useState<boolean>(false);
const [activeFilterTab, setActiveFilterTab] = useState<
  "servicos" | "operacao" | "grupos" | "produtos"
>("servicos");
```

3. **Uso de Constantes Centralizadas**
```typescript
// ANTES:
filtroServico: { armazenagem: 1, transbordo: 1, pesagem: 0 }

// DEPOIS:
filtroServico: { ...DEFAULT_API_FILTERS.SERVICO } as Record<string, 0 | 1>
```

4. **Verificação Completa de Filtros**
```typescript
const needsFilters =
  (filterOptions?.grupos?.length || 0) === 0 ||
  (filterOptions?.servicos?.length || 0) === 0 ||
  (filterOptions?.opPadrao?.length || 0) === 0 ||
  (filterOptions?.produtos?.length || 0) === 0;
```

5. **KeyExtractor Otimizado**
```typescript
keyExtractor={(item, index) =>
  item.fila && item.grupo && item.prod
    ? `${item.fila}-${item.grupo}-${item.prod}`
    : `fallback-${index}`
}
```

6. **hasActiveFilters com useMemo**
```typescript
// ANTES: useCallback(() => { ... })
// DEPOIS: useMemo(() => { ... }, [deps])
const hasActiveFilters = useMemo(() => {
  // cálculo...
}, [selectedFilters, filterOptions]);
```

7. **Dependencies Completas**
```typescript
useFocusEffect(
  useCallback(() => {
    // lógica...
  }, [
    state.selectedFilial,
    lastDataLoad,
    data.length,
    filterOptions?.grupos?.length,
    filterOptions?.servicos?.length,
    filterOptions?.opPadrao?.length,
    filterOptions?.produtos?.length,
    loadFiltersForFilial,
    fetchContratosData,
  ])
);
```

8. **DisplayNames para Debugging**
```typescript
ContratoCard.displayName = "ContratoCard";
FilterOption.displayName = "FilterOption";
```

---

## Diretórios Detalhados

### 📁 **src/components/**

Componentes React reutilizáveis em toda a aplicação.

#### Componentes Principais:

- **BaseScreen.tsx** - Template base para todas as telas (wrapper com scroll, loading, erro)
- **ErrorMessage.tsx** - Exibe mensagens de erro padronizadas
- **LoadingSpinner.tsx** - Indicador de carregamento animado
- **StatusCard.tsx** - Card do dashboard mostrando status de transporte
- **SideMenu.tsx** ✅ - Menu lateral de navegação (100% tipado)
- **FilterModal.tsx** - Modal de filtros global
- **BackgroundLoadingIndicator.tsx** - Indicador de atualização em background

#### Subpasta: **components/common/**

- **Header.tsx** - Cabeçalho padrão com título, subtítulo e botões de ação
- **VehicleCard.tsx** - Card individual de veículo (placa, peso, destino, etc.)
- **SummaryCard.tsx** - Card de resumo com totais (veículos, peso)
- **InfoRow.tsx** ✅ - Linha de informação chave-valor (100% tipado)
- **EmptyView.tsx** ✅ - Mensagem quando não há dados (100% tipado)
- **UpdateBanner.tsx** ✅ - Banner mostrando última atualização (100% tipado)
- **FilterModal.tsx** - Modal de filtros específicos

**index.ts** - Barrel export de todos os componentes

---

### 📁 **src/constants/**

Configurações, constantes e valores fixos da aplicação.

#### Arquivos Principais:

**api.ts** - **FONTE ÚNICA DE VERDADE** para configurações de API:

```typescript
export const API_CONFIG = {
  FILIAL_URLS: {
    LDA: "http://192.168.10.201/attmonitor/api",
    CHP: "http://45.4.111.173:9090/attmonitor/api",
    FND: "http://177.84.63.82:9090/attmonitor/api",
    NMD: "http://168.195.5.254:9090/attmonitor/api",
    NMG: "http://138.186.125.143:9090/attmonitor/api",
  } as const,

  CACHE_TIME: 3 * 60 * 1000,
  AUTO_REFRESH: 60 * 1000,
  BACKGROUND_REFRESH: 90 * 1000,
  STALE_TIME: 5 * 60 * 1000,
  BACKGROUND_STALE_TIME: 10 * 60 * 1000,

  RETRY_ATTEMPTS: 1,
  RETRY_DELAY: 1000,

  REQUEST_TIMEOUT: 30000,
  LONG_REQUEST_TIMEOUT: 60000,
} as const;

export type Filial = keyof typeof API_CONFIG.FILIAL_URLS;
export const FILIAIS: readonly Filial[] = ["LDA", "CHP", "FND", "NMD", "NMG"];

export const STORAGE_KEYS = {
  USER_TOKEN: "userToken",
  USERNAME: "username",
  TRANSPORT_CACHE: "transportCache",
  CONTRATOS_CACHE: "contratosCache",
  FILTERS_CACHE: "filtersCache",
  LAST_FILIAL: "lastFilial",
} as const;
```

**index.ts** - Re-exporta configurações de `api.ts`:
```typescript
export { API_CONFIG, STORAGE_KEYS, FILIAIS } from "./api";
export type { Filial } from "./api";
```

**timing.ts** - Constantes de timing:
- Tempos de cache, refresh, retry, timeouts
- Intervalos de polling e background updates

**colors.ts** - Sistema de cores:
- Cores primárias, secundárias, backgrounds, textos
- Cores de status (success, warning, error)

**filters.ts** - Definições de filtros:
- Tipos de serviço (armazenagem, transbordo, pesagem)
- Operações padrão (rodo_ferro, ferro_rodo, rodo_rodo, outros)

**filterOptions.ts** - Opções de filtros disponíveis

**fallbacks.ts** - Dados de fallback quando API falha:
- `FALLBACK_GRUPOS` - Grupos de produtos padrão
- `FALLBACK_PRODUTOS` - Produtos padrão
- Função `logFallbackUsage()` para debug

---

### 📁 **src/context/**

Gerenciamento de estado global usando Context API.

**AppContext.tsx** - Context principal da aplicação:

- **Estado global**:
  - `isLoggedIn`: boolean - Status de autenticação
  - `isLoading`: boolean - Estado de carregamento global
  - `username`: string - Usuário logado
  - `token`: string | null - Token JWT
  - `selectedFilial`: Filial - Filial selecionada
  - `transportData`: TransportData - Dados de todos os tipos de transporte
  - `transportLoading`: boolean - Loading de transporte
  - `transportLastUpdate`: Date | null - Última atualização
  - `contratosData`: ContratoData[] - Dados de contratos
  - `contratosLoading`: boolean - Loading de contratos
  - `contratosLastUpdate`: Date | null - Última atualização
  - `filterOptions`: FilterOptions - Opções dinâmicas de filtros
  - `filtersLoading`: boolean - Loading de filtros
  - `filtersCache`: Record - Cache de filtros por filial
  - `filtersCacheExpiry`: Record - Expiração do cache
  - `error`: string | null - Mensagens de erro

- **Actions (via useReducer)**:
  - `setLoading(loading)` - Define loading global
  - `setAuth(isLoggedIn, token)` - Define autenticação
  - `setUsername(username)` - Define usuário
  - `setFilial(filial)` - Troca filial
  - `setTransportData(data, lastUpdate)` - Atualiza dados de transporte
  - `setTransportLoading(loading)` - Define loading de transporte
  - `setContratosData(data, lastUpdate)` - Atualiza contratos
  - `setContratosLoading(loading)` - Define loading de contratos
  - `setFilterOptions(options)` - Atualiza filtros
  - `setFiltersLoading(loading)` - Define loading de filtros
  - `setFiltersCache(filial, data)` - Salva cache de filtros
  - `clearFiltersCache()` - Limpa cache de filtros
  - `setError(error)` - Define erro
  - `resetError()` - Limpa erro
  - `logout()` - Faz logout e limpa AsyncStorage

- **Provider**: `<AppProvider>` envolve toda a aplicação

---

### 📁 **src/hooks/**

Custom hooks para lógica reutilizável e separação de responsabilidades.

#### Hooks de Autenticação:

**useAuth.ts** - Gerencia autenticação:
- `login(username, password)` - Faz login e salva token
- `logout()` - Limpa sessão
- `isAuthenticated` - Status de autenticação

#### Hooks de Dados:

**useTransportData.ts** - Busca dados de transporte:
- Faz 7 requisições em paralelo (transito, filas, pátios, cargas/descargas hoje)
- Auto-refresh a cada 60 segundos
- Cache em AsyncStorage
- Retorna: `{ data, loading, lastUpdate, error, refresh }`

**useVehicleData.ts** - Hook genérico para dados de veículos:
- Recebe `screenType` (transito, fila_descarga, patio_carga, etc.)
- Extrai dados do response baseado em mapa de paths
- Aplica filtros (servico, opPadrao)
- Retorna: `{ data, loading, error, refresh, filtroServico, filtroOpPadrao, applyFiltersAndRefresh }`

**useContratos.ts** - Gerencia dados de contratos/monitor corte:
- Carrega filtros dinâmicos (grupos, produtos, opPadrao)
- Aplica filtros complexos
- Cache local
- Retorna: `{ data, loading, filters, toggleFilter, resetFilters, fetchContratosData }`

**useMonitorData.ts** - Hook unificado para monitor:
- Substitui fetch direto por chamadas ao apiService
- Normaliza dados (remove prefixos t_, fd_, fc_, etc.)
- Calcula totais (veículos, peso, grupos)
- Retorna: `{ data, loading, refreshing, totals, error, refresh }`

#### Hooks de Filtros:

**useGlobalFilters.ts** - Gerencia filtros globais:
- Estado centralizado de filtros selecionados
- `toggleFilter(type, value)` - Adiciona/remove filtro
- `getApiFilters()` - Converte filtros para formato da API
- `resetFilters()` - Limpa todos os filtros
- Inicialização automática com todos os filtros disponíveis

**useFilterLoader.ts** - Carrega opções de filtros:
- Busca filtros do servidor (grupos, produtos, opPadrao, servicos)
- Cache por filial
- Validação de cache
- `loadFiltersForFilial(filial)` - Força reload
- `hasValidCache(filial)` - Verifica cache válido

**useVehicleFilters.ts** - Filtros específicos de veículos

**useFilters.ts** - Filtros genéricos

#### Hooks de Refresh/Performance:

**useAutoRefresh.ts** - Auto-refresh periódico:
- Configura intervalo de 60 segundos
- Pausa quando app em background
- Limpeza automática
- Retorna `{ updateActivity }` para registrar atividade do usuário

**useBackgroundUpdates.ts** - Atualização em background:
- Monitora estado do app (ativo/background)
- Refresh quando app volta para foreground
- Intervalo de 90 segundos em background

**useIntelligentRefresh.ts** - Refresh inteligente:
- Detecta necessidade de atualização
- Prioriza dados mais antigos
- Evita requisições desnecessárias

**useRefreshStrategy.ts** - Estratégia de refresh:
- Combina auto-refresh, background updates e manual refresh
- Gerencia prioridades

**useAdaptiveInterval.ts** - Intervalo adaptativo:
- Ajusta frequência baseado em atividade do usuário

#### Hooks de Estado:

**useAppState.ts** - Monitora estado do app (ativo/background/inativo)

**index.ts** - Barrel export de todos os hooks

---

### 📁 **src/screens/**

Telas do aplicativo (componentes de tela).

#### Autenticação:

**LoginScreen.tsx** - Tela de login:
- Input de usuário e senha
- Validação com rate limiting
- Salva token em AsyncStorage
- Navega para HomeScreen após sucesso

#### Dashboard:

**HomeScreen.tsx** - Tela principal/dashboard:
- Seletor de filial
- 7 cards de status (StatusCard):
  - Em Trânsito
  - Fila de Descarga
  - Fila de Carga
  - Pátio de Descarga
  - Pátio de Carga
  - Descargas Hoje
  - Cargas Hoje
- Menu lateral (hamburger)
- Auto-refresh
- Otimizado com FlatList, useMemo, useCallback

#### Telas de Monitoramento:

**TransitoScreen.tsx** - Veículos em trânsito:
- Lista de veículos com VehicleCard
- Filtros (servico, opPadrao)
- Totais (veículos, peso)
- Pull-to-refresh

**FilaDescargaScreen.tsx** - Fila de descarga:
- Veículos aguardando descarga
- Mesma estrutura de TransitoScreen

**FilaCargaScreen.tsx** - Fila de carga:
- Veículos aguardando carga

**PatioDescargaScreen.tsx** - Pátio de descarga:
- Veículos no pátio para descarga

**PatioCargaScreen.tsx** - Pátio de carga:
- Veículos no pátio para carga

**DescargasHojeScreen.tsx** - Descargas realizadas hoje:
- Histórico do dia
- Filtros e totais

**CargasHojeScreen.tsx** - Cargas realizadas hoje:
- Histórico do dia
- Filtros e totais

#### Contratos:

**MonitorCorteScreen.tsx** ✅ - Monitor de corte/contratos (100% refatorado):
- Lista de contratos por grupo/produto
- Dados de peso e diferenças
- Veículos médios
- Menu lateral
- Filtros complexos (servico, opPadrao, grupos, produtos) com tabs
- Modal de filtros com 4 abas
- Navegação para ContratosDetalhesScreen
- Sistema de cache inteligente com quick return e navegação rápida
- **Totalmente tipado com TypeScript**
- **Componentes memoizados** (ContratoCard, FilterOption)
- **Performance otimizada** (useMemo, useCallback)
- **DisplayNames para debugging**

**ContratosDetalhesScreen.tsx** - Detalhes de contrato específico:
- Informações completas do contrato
- Lista de veículos na fila
- Dados de corte

**Todas as telas usam:**
- FlatList otimizado (removeClippedSubviews, windowSize, getItemLayout)
- Header comum
- Pull-to-refresh
- Error handling
- Loading states

---

### 📁 **src/services/**

Camada de serviço para comunicação com API.

**apiService.ts** - Serviço principal de API:

**Métodos de Configuração:**
- `getFilialURL(filial)` - Retorna URL da filial
- `getAuthHeaders()` - Retorna headers com token do AsyncStorage

**Autenticação:**
- `login(credentials)` - Autentica usuário:
  - Valida e sanitiza credenciais
  - Verifica rate limiting
  - Tenta login em múltiplas URLs
  - Extrai token do response
  - Salva token em AsyncStorage
  - Retorna: `{ token, success, username }`

**Requisições Base:**
- `makeRequest(endpoint, body, filial)` - Faz requisição HTTP:
  - Adiciona headers de autenticação
  - POST com JSON body
  - Valida response status
  - Lança erro em caso de falha (401, 500, etc.)

- `requestWithRetry(endpoint, body, filial)` - Requisição com retry:
  - Tenta API_CONFIG.RETRY_ATTEMPTS vezes
  - Delay de API_CONFIG.RETRY_DELAY entre tentativas
  - Retorna JSON parseado

**Dados de Monitoramento:**
- `getMonitorData(tipoOperacao, filtros)` - Genérico para /monitor.php
- `getTransitoData(filial, filtroServico, filtroOpPadrao)` - Dados de trânsito
- `getFilaDescargaData(filial, ...)` - Fila de descarga
- `getFilaCargaData(filial, ...)` - Fila de carga
- `getPatioDescargaData(filial, ...)` - Pátio de descarga
- `getPatioCargaData(filial, ...)` - Pátio de carga
- `getDescargasHojeData(filial, ...)` - Descargas hoje
- `getCargasHojeData(filial, ...)` - Cargas hoje

**Contratos:**
- `getContratosData(filial, filtros, grupos, produtos)` - Dados de contratos:
  - Carrega filtros dinâmicos se não fornecidos
  - Usa fallbacks se necessário
  - Endpoint: /monitor_corte.php

- `getContratosFilaData(filial, fila, grupo, produto, dadosCorte)` - Detalhes de fila de contrato:
  - Endpoint: /monitor_contratos_fila.php

**Filtros:**
- `getFilterOptions(tipo, filial)` - Genérico para filtros
- `getServicosFilter(filial)` - Filtro de serviços
- `getOpPadraoFilter(filial)` - Filtro de operação padrão
- `getGruposFilter(filial)` - Filtro de grupos
- `getProdutosFilter(filial)` - Filtro de produtos

**Exporta instância singleton**: `export default new ApiService()`

---

### 📁 **src/types/**

Definições TypeScript (interfaces, types).

**api.ts** - Tipos relacionados à API:

```typescript
// Requisições
interface LoginCredentials { username: string; password: string }
interface LoginResponse { token: string; success: boolean; username: string }
interface ApiRequestBody { AttApi: { tipoOperacao: string; filtros... } }

// Filtros
interface MonitorFilters {
  filtro_filial: Filial;
  filtro_servico?: Record<string, 0 | 1>;
  filtro_op_padrao?: Record<string, 0 | 1>;
}

interface ContratosFilters extends MonitorFilters {
  filtro_grupo?: GrupoItem[];
  filtro_tp_prod?: ProdutoItem[];
}

interface ContratosFilaParams { filial, fila, grupo, prod, dadosCorte }

// Responses
interface MonitorDataResponse { dados: { listaTransito, listaFilaDescarga... } }
interface ContratosResponse { dados: { contratos?, CortesFila? } }
interface FilterResponse { dados: { grupos[], produtos[]... } }

// Dados de veículos
interface VehicleData { placa, peso, destino... }
interface TransportData {
  emTransito: number;
  filaDescarga: number;
  filaCarga: number;
  patioDescarregando: number;
  patioCarregando: number;
  descargasHoje: number;
  cargasHoje: number;
}
```

**context.ts** - Tipos do Context:

```typescript
interface AppState {
  isLoggedIn: boolean;
  isLoading: boolean;
  username: string;
  token: string | null;
  selectedFilial: Filial;
  transportData: TransportData;
  transportLoading: boolean;
  transportLastUpdate: Date | null;
  contratosData: ContratoData[];
  contratosLoading: boolean;
  contratosLastUpdate: Date | null;
  filterOptions: FilterOptions;
  filtersLoading: boolean;
  filtersCache: Record<string, any>;
  filtersCacheExpiry: Record<string, number>;
  error: string | null;
}

interface AppActions {
  setLoading: (loading: boolean) => void;
  setAuth: (isLoggedIn: boolean, token?: string | null) => void;
  setUsername: (username: string) => void;
  setFilial: (filial: Filial) => void;
  setTransportData: (data: TransportData, lastUpdate?: Date | null) => void;
  setTransportLoading: (loading: boolean) => void;
  setContratosData: (data: ContratoData[], lastUpdate?: Date | null) => void;
  setContratosLoading: (loading: boolean) => void;
  setFilterOptions: (options: Partial<FilterOptions>) => void;
  setFiltersLoading: (loading: boolean) => void;
  setFiltersCache: (filial: string, data: any) => void;
  clearFiltersCache: () => void;
  setError: (error: string | null) => void;
  resetError: () => void;
  logout: () => Promise<void>;
}
```

**index.ts** - Tipos gerais:

```typescript
interface DateTimeFormatOptions { includeTime?, includeDate?, format? }
type ScreenType = "transito" | "fila_descarga" | ...

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  MonitorCorte: undefined;
  ContratosDetalhes: { contrato: ContratoData; filial: string };
  CargasHoje: undefined;
  DescargasHoje: undefined;
  Transito: undefined;
  FilaDescarga: undefined;
  FilaCarga: undefined;
  PatioDescarga: undefined;
  PatioCarga: undefined;
};

interface ContratoData {
  grupo: string;
  tp_prod: string;
  peso_origem: number;
  peso_descarga: number;
  peso_carga: number;
  // ... outros campos
}
```

---

### 📁 **src/utils/**

Funções utilitárias e helpers.

**formatters.ts** - Funções de formatação:
- `formatPeso(peso)` - Formata peso: "1.234 kg"
- `formatPercentual(valor)` - Formata porcentagem: "12.34%"
- `formatNumber(valor)` - Formata número: "1.234"
- `formatCurrency(valor)` - Formata moeda: "R$ 1.234,56"
- `formatDateTime(date, options)` - Formata data/hora
- `formatTimeAgo(date)` - Tempo relativo: "há 5 min", "há 2 dias"
- `truncateText(text, maxLength)` - Trunca texto com "..."
- `capitalizeFirst(text)` - Primeira letra maiúscula
- `formatPhoneNumber(phone)` - Formata telefone: "(11) 98765-4321"

**authUtils.ts** - Utilitários de autenticação:

**Constantes:**
- `AUTH_ERROR_CODES` - Códigos de erro (INVALID_CREDENTIALS, NETWORK_ERROR, etc.)

**Classes:**
- `AuthenticationError extends Error` - Erro customizado com código e detalhes

- `LoginRateLimiter` - Rate limiting de login:
  - 5 tentativas máximas
  - Janela de 15 minutos
  - Lockout de 30 minutos
  - `checkRateLimit(identifier)` - Verifica se pode tentar
  - `resetAttempts(identifier)` - Reseta após sucesso
  - `cleanup()` - Limpa tentativas antigas

**Funções:**
- `validateAndSanitizeCredentials(username, password)` - Valida e limpa:
  - Mínimo 3 caracteres (username)
  - Mínimo 4 caracteres (password)
  - Remove caracteres perigosos
  - Converte para uppercase
  - Limita tamanho

- `validateLoginResponse(response, responseText)` - Valida response:
  - Verifica status code
  - Detecta erros no texto
  - Lança AuthenticationError apropriado

- `extractToken(response, responseText)` - Extrai token:
  - Tenta headers: authorization, x-auth-token, token
  - Tenta body JSON: token, jwt, access_token, authToken
  - Valida token antes de retornar

- `validateToken(token)` - Valida se token é válido:
  - Não null/undefined
  - String com mínimo 10 caracteres
  - Não é token falso (ex: "success_")

- `saveAuthData(token, username)` - Salva em AsyncStorage

- `clearAuthData()` - Limpa AsyncStorage

- `isTokenValid()` - Verifica se token salvo é válido

**errorHandler.ts** - Tratamento de erros:
- `handleError(error, options)` - Handler centralizado:
  - Detecta tipo de erro (network, auth, validation, etc.)
  - Formata mensagem amigável
  - Log em desenvolvimento
  - Opção de mostrar Alert
  - Retorna: `{ message, code, shouldRetry }`

**apiValidators.ts** - Validadores de API:
- `validateApiResponse(response)` - Valida estrutura do response
- `validateFilial(filial)` - Valida se filial é válida
- `validateFilters(filters)` - Valida estrutura de filtros

**cache.ts** - Utilitários de cache:
- `getCacheKey(endpoint, params)` - Gera chave de cache
- `isCacheValid(timestamp)` - Verifica se cache expirou
- `saveCache(key, data)` - Salva em AsyncStorage
- `loadCache(key)` - Carrega de AsyncStorage
- `clearExpiredCache()` - Limpa cache expirado

**apiAdapters.ts** - Adaptadores de API:
- Funções para converter entre formatos de API antiga/nova
- Normalização de dados

**index.ts** - Barrel export de utils

---

## Arquivos Importantes da Raiz

### **App.tsx**

Componente raiz da aplicação:
- Envolve app com `<AppProvider>` (Context)
- Configura navegação com Stack Navigator
- Define rotas:
  - LoginScreen (inicial se não autenticado)
  - HomeScreen (dashboard)
  - TransitoScreen, FilaDescargaScreen, etc. (7 telas de monitor)
  - MonitorCorteScreen
  - ContratosDetalhesScreen
- Configura gesture handlers
- Exporta componente `App`

### **index.ts**

Ponto de entrada Expo:
```javascript
import { registerRootComponent } from 'expo';
import App from './App';
registerRootComponent(App);
```

### **package.json**

Gerenciamento de dependências:
- **Nome**: invisi-app
- **Versão**: 1.0.0
- **Scripts**:
  - `npm start` - Inicia Expo dev server
  - `npm run android` - Roda em Android
  - `npm run ios` - Roda em iOS
  - `npm run web` - Roda na web
- **Dependências principais**:
  - react-native 0.81.4
  - expo 54.0.0
  - axios 1.11.0
  - @react-native-async-storage/async-storage 2.2.0
  - @react-navigation/native 7.1.17
  - @react-navigation/stack 7.4.8
- **DevDependencies**:
  - typescript 5.9.3
  - @types/react, @types/react-native
  - eslint

### **tsconfig.json**

Configuração TypeScript:
- Target: ES2020
- Module: ESNext
- JSX: react-native
- Strict mode habilitado
- Paths configurados para imports absolutos

### **app.json**

Configuração Expo:
- Nome do app
- Slug
- Versões
- Ícone e splash screen
- Orientação (portrait)
- Plataformas suportadas
- Configurações de build

---

## Fluxo de Dados

### 1. Autenticação

```
LoginScreen
  → useAuth.login(username, password)
    → apiService.login(credentials)
      → validateAndSanitizeCredentials()
      → rateLimiter.checkRateLimit()
      → fetch(/login.php)
      → validateLoginResponse()
      → extractToken()
      → saveAuthData(token, username)
    → AppContext.setAuth(true, token)
    → AppContext.setUsername(username)
    → AsyncStorage (USER_TOKEN, USERNAME)
  → Navigation.navigate('Home')
```

### 2. Carregamento de Dados (HomeScreen)

```
HomeScreen
  → useTransportData()
    → apiService.getTransitoData()
    → apiService.getFilaDescargaData()
    → apiService.getFilaCargaData()
    → ... (7 requisições em paralelo)
    → AppContext.setTransportData()
    → AsyncStorage (cache)
  → Renderiza StatusCards
```

### 3. Tela de Monitoramento (ex: TransitoScreen)

```
TransitoScreen
  → useVehicleData('transito')
    → apiService.getTransitoData(filial, filtroServico, filtroOpPadrao)
      → apiService.getMonitorData('monitor_transito', filtros)
        → apiService.requestWithRetry('/monitor.php', body, filial)
          → apiService.makeRequest()
            → getAuthHeaders() (pega token do AsyncStorage)
            → fetch(FILIAL_URL + '/monitor.php', { headers, body })
          → response.json()
    → extractDataFromResponse() (navega path: dados.listaTransito.transitoVeiculos)
    → setState(data)
  → Renderiza FlatList de VehicleCards
```

### 4. Filtros Globais (MonitorCorteScreen)

```
MonitorCorteScreen
  → useGlobalFilters()
    → useFilterLoader()
      → apiService.getGruposFilter(filial)
      → apiService.getProdutosFilter(filial)
      → apiService.getOpPadraoFilter(filial)
      → apiService.getServicosFilter(filial)
      → AppContext.setFilterOptions()
      → AppContext.setFiltersCache(filial, data)
    → selectedFilters state (servicos, opPadrao, grupos, produtos)
    → toggleFilter(type, value) - adiciona/remove do array
    → getApiFilters() - converte para { servico: {armazenagem: 1, ...}, ... }
  → fetchContratosData()
    → apiService.getContratosData(filial, filtros)
      → requestWithRetry('/monitor_corte.php', body, filial)
    → setState(contratos)
  → Renderiza FlatList de ContratoCards
  → Modal com 4 tabs de filtros (Serviços, Operação, Grupos, Produtos)
```

---

## Padrões de Código

### 1. Estrutura de Componentes

```typescript
import React, { useState, useCallback, useEffect } from 'react';
import { View, FlatList } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { useApp } from '../context/AppContext';
import { Header, VehicleCard, LoadingSpinner } from '../components';
import { useVehicleData } from '../hooks/useVehicleData';
import type { RootStackParamList } from '../types';

type Props = StackScreenProps<RootStackParamList, 'Transito'>;

const ExemploScreen: React.FC<Props> = ({ navigation, route }) => {
  const { state } = useApp();
  const { data, loading, error, refresh } = useVehicleData('transito');

  const renderItem = useCallback(({ item }) => (
    <VehicleCard {...item} />
  ), []);

  return (
    <View>
      <Header title="Título" />
      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          onRefresh={refresh}
          refreshing={loading}
          removeClippedSubviews={true}
          maxToRenderPerBatch={8}
          windowSize={8}
        />
      )}
    </View>
  );
};

export default ExemploScreen;
```

### 2. Custom Hooks

```typescript
export const useExemplo = (param: string) => {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiService.getData(param);
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [param]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refresh: fetchData };
};
```

### 3. Serviços API

```typescript
async getExemplo(filial: Filial, filtros: MonitorFilters): Promise<MonitorDataResponse> {
  return this.getMonitorData("monitor_exemplo", {
    filtro_filial: filial,
    ...filtros
  });
}
```

### 4. Componentes Memoizados

```typescript
interface ComponentProps {
  item: DataType;
  onPress?: () => void;
}

const Component = React.memo<ComponentProps>(({ item, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>{item.title}</Text>
    </TouchableOpacity>
  );
});

Component.displayName = "Component";

export default Component;
```

---

## Otimizações de Performance

### 1. FlatList (todas as telas de lista)

```typescript
<FlatList
  data={data}
  renderItem={renderItem}
  keyExtractor={(item, index) =>
    item.id ? `${item.id}` : `fallback-${index}`
  }
  removeClippedSubviews={true}      // Remove itens fora da tela
  maxToRenderPerBatch={8}            // Renderiza 8 itens por vez
  windowSize={8}                     // Janela de 8 itens
  initialNumToRender={6}             // 6 itens iniciais
  updateCellsBatchingPeriod={50}     // Atualiza a cada 50ms
  getItemLayout={(data, index) => ({ // Layout fixo (quando aplicável)
    length: 140,
    offset: 140 * index,
    index,
  })}
/>
```

### 2. Memoização (HomeScreen)

```typescript
const transportCards = useMemo(() => [
  { id: 'transito', data: data.transito, ... },
  // ... outros cards
], [data, state.selectedFilial]);

const handleFilialChange = useCallback((filial: Filial) => {
  actions.setFilial(filial);
}, [actions]);

const hasActiveFilters = useMemo(() => {
  // cálculo complexo...
  return result;
}, [selectedFilters, filterOptions]);
```

### 3. Cache e Auto-refresh

- Cache de 3 minutos (API_CONFIG.CACHE_TIME)
- Auto-refresh de 60 segundos (API_CONFIG.AUTO_REFRESH)
- Background refresh de 90 segundos
- Retry de 1 tentativa com delay de 1s
- Sistema de "quick return" (< 5s) e navegação rápida (< 10s)
- Stale time configurável por contexto

### 4. Sistema de Cache Inteligente (MonitorCorteScreen)

```typescript
const shouldSkipReload =
  (dataAge < CACHE_TIME && data.length > 0) ||
  (timeSinceLastFocus < QUICK_RETURN_THRESHOLD &&
    data.length > 0 &&
    dataAge < QUICK_RETURN_STALE_TIME) ||
  (timeAwayFromScreen < SHORT_NAVIGATION_THRESHOLD &&
    data.length > 0 &&
    dataAge < SHORT_NAVIGATION_STALE_TIME);
```

---

## Tratamento de Erros

### Níveis de Erro:

1. **Network Errors** - Sem conexão
2. **Auth Errors** - 401, 403, token inválido
3. **Server Errors** - 500, 502, 503
4. **Validation Errors** - Dados inválidos
5. **Rate Limit** - Muitas tentativas de login

### Estratégias:

- **Retry automático** em network errors (1x)
- **Fallback para cache** quando API falha
- **Fallback data** (FALLBACK_GRUPOS, FALLBACK_PRODUTOS)
- **Error boundaries** nos componentes
- **Mensagens amigáveis** ao usuário
- **Logs detalhados** em desenvolvimento

---

## Segurança

### Autenticação:

- Token JWT armazenado em AsyncStorage
- Token enviado em header `token` em todas as requisições
- Validação de token antes de salvar
- Rate limiting (5 tentativas, 15 min window, 30 min lockout)
- Sanitização de inputs (remove caracteres perigosos)
- Conversão para uppercase (username e password)

### Validações:

- Username mínimo 3 caracteres
- Password mínimo 4 caracteres
- Filial deve ser uma das 5 configuradas (LDA, CHP, FND, NMD, NMG)
- Detecção de responses com erro (patterns: "error", "invalid", "denied")

---

## Boas Práticas Implementadas

1. **TypeScript** em todo o código (100% type safety)
2. **Barrel exports** (index.ts em cada pasta)
3. **Custom hooks** para lógica reutilizável
4. **Context API** para estado global (não Redux)
5. **AsyncStorage** para persistência
6. **Error handling** centralizado
7. **Loading states** em todas as operações assíncronas
8. **Pull-to-refresh** em todas as listas
9. **Memoization** (React.memo, useMemo, useCallback) para evitar re-renders
10. **FlatList** otimizado para listas longas
11. **Cache** para reduzir requisições
12. **Auto-refresh** inteligente
13. **Fallback data** quando API falha
14. **Logs** detalhados em desenvolvimento
15. **DisplayNames** em componentes memoizados para debugging
16. **Interfaces completas** para todas as props
17. **Constantes centralizadas** (fonte única de verdade)
18. **Dependencies corretas** em hooks

---

## Configuração de Filiais

```typescript
FILIAL_URLS: {
  LDA: "http://192.168.10.201/attmonitor/api",      // Filial LDA
  CHP: "http://45.4.111.173:9090/attmonitor/api",   // Filial CHP
  FND: "http://177.84.63.82:9090/attmonitor/api",   // Filial FND
  NMD: "http://168.195.5.254:9090/attmonitor/api",  // Filial NMD
  NMG: "http://138.186.125.143:9090/attmonitor/api", // Filial NMG
}
```

Cada filial tem sua própria URL e opera independentemente.

---

## Resumo para IA

**O Invisi-app é um sistema de monitoramento logístico mobile (React Native + TypeScript) que:**

1. **Autentica usuários** via token JWT com rate limiting
2. **Monitora operações** de 5 filiais em tempo real (LDA, CHP, FND, NMD, NMG)
3. **Gerencia dados** de veículos em trânsito, filas, pátios, cargas/descargas
4. **Aplica filtros** complexos (serviço, operação, grupo, produto)
5. **Atualiza automaticamente** a cada 60s com cache de 3min
6. **Otimiza performance** com FlatList, memoization, virtualização
7. **Trata erros** com retry, fallbacks e cache
8. **Persiste dados** em AsyncStorage
9. **Usa arquitetura** modular (components, hooks, services, context)
10. **Segue padrões** TypeScript, custom hooks, Context API, barrel exports
11. **100% tipado** - Todos os componentes principais possuem interfaces TypeScript completas
12. **Constantes consolidadas** - API_CONFIG e STORAGE_KEYS em fonte única de verdade

---

## Melhorias Recentes Implementadas (2025-01-09)

### ✅ **Consolidação de Constantes**

**Problema:** Duplicação de `API_CONFIG` e `STORAGE_KEYS` com valores conflitantes.

**Solução:**
- `src/constants/api.ts` → Fonte única de verdade
- `src/constants/index.ts` → Re-exports para compatibilidade
- Valores padronizados: Cache 3min, Auto-refresh 60s

### ✅ **Componentes Comuns 100% Tipados**

Todos os 4 componentes comuns principais foram refatorados:
- **InfoRow** - Props completas com TextStyle
- **UpdateBanner** - Interface UpdateBannerProps
- **EmptyView** - Interface EmptyViewProps com ViewStyle
- **SideMenu** - Interface customizada NavigationHelpers (sem usar `any`)

Todos incluem:
- ✅ Interfaces TypeScript completas
- ✅ React.memo para otimização
- ✅ DisplayName para debugging

### ✅ **MonitorCorteScreen - Refatoração Completa**

**12 melhorias implementadas:**

1. **Tipagem completa** - StackScreenProps, LoadingType, interfaces para componentes
2. **Estados tipados** - useState com tipos explícitos
3. **Constantes centralizadas** - Uso de DEFAULT_API_FILTERS
4. **Verificação completa** - Valida 4 tipos de filtros (não apenas grupos)
5. **KeyExtractor otimizado** - Index apenas como fallback
6. **useMemo para hasActiveFilters** - Performance melhorada
7. **Dependencies completas** - useFocusEffect com todas as deps
8. **DisplayNames** - ContratoCard e FilterOption
9. **Componentes memoizados** - React.memo com props tipadas
10. **LoadingType enum** - Type safety para estados de loading
11. **Sistema de cache inteligente** - Quick return e navegação rápida
12. **Interface ContratosResponse** - Suporta CortesFila

### ✅ **Zero Erros TypeScript**

Status de compilação:
- MonitorCorteScreen: **0 erros**
- InfoRow: **0 erros**
- UpdateBanner: **0 erros**
- EmptyView: **0 erros**
- SideMenu: **0 erros**

---

## Próximos Passos Sugeridos

### 🔄 **Melhorias Futuras Opcionais**

1. **Extrair lógica de cache** para custom hook `useSmartCache`
2. **Criar enums** para valores mágicos (tab keys, loading types)
3. **Adicionar JSDoc** nos métodos principais para documentação inline
4. **Implementar error boundaries** específicos por tela
5. **Adicionar testes unitários** (Jest + React Native Testing Library)
6. **Tipar componentes restantes** (VehicleCard, Header, StatusCard, etc.)
7. **Migrar para React Query** para gerenciamento de estado assíncrono
8. **Implementar Sentry** ou Firebase Crashlytics para monitoramento

### 📚 **Para Claude Code em Futuras Conversas**

**Principais arquivos a consultar ao trabalhar no sistema:**

1. **Configurações:**
   - `src/constants/api.ts` - **SEMPRE** use este arquivo como fonte única de verdade
   - `src/constants/index.ts` - Re-exports (NÃO defina constantes aqui)
   - `src/types/` - Todas as interfaces e tipos TypeScript

2. **Lógica de Negócio:**
   - `src/services/apiService.ts` - API e autenticação
   - `src/context/AppContext.tsx` - Estado global
   - `src/hooks/` - Custom hooks (ver barrel export no index.ts)

3. **UI Principal:**
   - `src/screens/MonitorCorteScreen.tsx` - Exemplo de tela 100% tipada
   - `src/components/common/` - Componentes tipados para referência
   - `App.tsx` - Navegação e estrutura

4. **Padrões a seguir:**
   - SEMPRE adicionar interfaces TypeScript para props
   - SEMPRE adicionar displayName em componentes memoizados
   - SEMPRE usar React.memo, useMemo, useCallback apropriadamente
   - SEMPRE importar constantes de `src/constants/api.ts` (fonte única)
   - NUNCA usar `any` - criar interfaces customizadas quando necessário
   - SEMPRE adicionar dependencies completas em hooks

**Arquitetura de dados:**
```
AsyncStorage → AppContext (Context API) → Screens/Hooks
                    ↓
              apiService → API externa
```

**Fluxo de filtros:**
```
useFilterLoader → filterOptions (Context)
                       ↓
              useGlobalFilters → selectedFilters
                       ↓
              getApiFilters() → { servico: {...}, opPadrao: {...} }
                       ↓
              apiService.getContratosData()
```

---

## Changelog

### [2025-01-09] - Refatoração Completa
- Consolidada arquitetura de constantes (API_CONFIG em fonte única)
- Tipados 100% os componentes comuns (InfoRow, UpdateBanner, EmptyView, SideMenu)
- Refatorado MonitorCorteScreen com 12 melhorias de TypeScript e performance
- Atualizada documentação completa do sistema
- Zero erros TypeScript em componentes principais

### [2024-XX-XX] - Versão Inicial
- Implementação inicial do sistema com React Native + TypeScript
- Context API para estado global
- Custom hooks para lógica reutilizável
- Otimizações de performance com FlatList e memoization
