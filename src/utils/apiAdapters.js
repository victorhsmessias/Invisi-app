/**
 * Adaptadores para normalizar estruturas de dados da API
 * Centraliza a lógica de extração e transformação de dados
 */

/**
 * Configuração de mapeamento de campos da API
 * Define como extrair dados de diferentes estruturas de resposta
 */
const API_FIELD_MAPPINGS = {
  // Dados de trânsito
  transito: {
    path: ['dados', 'listaTransito', 'transitoVeiculos'],
    countFields: ['t_veiculos'],
    defaultValue: [],
  },

  // Fila de descarga
  filaDescarga: {
    path: ['dados', 'listaFilaDescarga', 'filaDescargaVeiculos'],
    countFields: ['fd_veiculos'],
    defaultValue: [],
  },

  // Fila de carga
  filaCarga: {
    path: ['dados', 'listaFilaCarga', 'filaCargaVeiculos'],
    countFields: ['fc_veiculos'],
    defaultValue: [],
  },

  // Pátio de descarga
  patioDescarga: {
    path: ['dados', 'listaPatioDescarga', 'patioDescargaVeiculos'],
    countFields: ['pd_veiculos'],
    defaultValue: [],
  },

  // Pátio de carga
  patioCarga: {
    path: ['dados', 'listaPatioCarga', 'patioCargaVeiculos'],
    countFields: ['pc_veiculos'],
    defaultValue: [],
  },

  // Descargas concluídas hoje
  descargasHoje: {
    path: ['dados', 'listaDescarga', 'DescargaVeiculos'],
    countFields: ['d_veiculos'],
    defaultValue: [],
  },

  // Cargas concluídas hoje
  cargasHoje: {
    path: ['dados', 'listaCarga', 'CargaVeiculos'],
    // Múltiplos campos possíveis devido a inconsistência da API
    countFields: ['cargas_hoje', 'c_veiculos'],
    defaultValue: [],
  },
};

/**
 * Extrair valor de objeto seguindo um caminho (path)
 * @param {Object} obj - Objeto fonte
 * @param {Array<string>} path - Caminho para o valor
 * @param {*} defaultValue - Valor padrão se não encontrado
 * @returns {*} Valor extraído ou default
 */
const getValueByPath = (obj, path, defaultValue = null) => {
  if (!obj || !Array.isArray(path)) {
    return defaultValue;
  }

  let current = obj;

  for (const key of path) {
    if (current === null || current === undefined) {
      return defaultValue;
    }

    if (!Object.prototype.hasOwnProperty.call(current, key)) {
      return defaultValue;
    }

    current = current[key];
  }

  return current !== undefined ? current : defaultValue;
};

/**
 * Extrair array de veículos da resposta da API
 * @param {Object} apiResponse - Resposta da API
 * @param {string} dataType - Tipo de dados (transito, filaDescarga, etc)
 * @returns {Array} Array de veículos normalizado
 */
export const extractVehicleArray = (apiResponse, dataType) => {
  const mapping = API_FIELD_MAPPINGS[dataType];

  if (!mapping) {
    console.warn(`[ApiAdapter] Tipo de dados desconhecido: ${dataType}`);
    return [];
  }

  const vehicleArray = getValueByPath(
    apiResponse,
    mapping.path,
    mapping.defaultValue
  );

  // Garantir que sempre retorna array
  if (!Array.isArray(vehicleArray)) {
    if (__DEV__) {
      console.warn(
        `[ApiAdapter] Dados de ${dataType} não são um array, normalizando para []`
      );
    }
    return [];
  }

  return vehicleArray;
};

/**
 * Extrair valor numérico de um campo, tentando múltiplos nomes de campo
 * @param {Object} item - Item do array
 * @param {Array<string>} possibleFields - Lista de campos possíveis
 * @returns {number} Valor numérico encontrado ou 0
 */
const extractNumericValue = (item, possibleFields) => {
  if (!item || typeof item !== 'object') {
    return 0;
  }

  for (const field of possibleFields) {
    if (Object.prototype.hasOwnProperty.call(item, field)) {
      const value = item[field];

      // Converter para número
      if (typeof value === 'number') {
        return isNaN(value) ? 0 : value;
      }

      if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? 0 : parsed;
      }

      // Se não for número ou string, retornar 0
      return 0;
    }
  }

  return 0;
};

/**
 * Calcular contagem total de veículos de um array
 * @param {Array} vehicleArray - Array de veículos
 * @param {string} dataType - Tipo de dados para buscar mapeamento
 * @returns {number} Contagem total de veículos
 */
export const calculateVehicleCount = (vehicleArray, dataType) => {
  if (!Array.isArray(vehicleArray)) {
    if (__DEV__) {
      console.warn(
        `[ApiAdapter] calculateVehicleCount recebeu não-array para ${dataType}`
      );
    }
    return 0;
  }

  const mapping = API_FIELD_MAPPINGS[dataType];

  if (!mapping) {
    console.warn(`[ApiAdapter] Tipo de dados desconhecido: ${dataType}`);
    return 0;
  }

  const countFields = mapping.countFields;

  return vehicleArray.reduce((total, item) => {
    const itemCount = extractNumericValue(item, countFields);
    return total + itemCount;
  }, 0);
};

/**
 * Processar resposta completa da API e retornar contagem
 * Combina extração e cálculo em uma única função
 * @param {Object} apiResponse - Resposta da API
 * @param {string} dataType - Tipo de dados
 * @returns {number} Contagem de veículos
 */
export const processVehicleCount = (apiResponse, dataType) => {
  const vehicleArray = extractVehicleArray(apiResponse, dataType);
  return calculateVehicleCount(vehicleArray, dataType);
};

/**
 * Processar múltiplas respostas da API de uma vez
 * @param {Object} responses - Objeto com múltiplas respostas da API
 * @returns {Object} Objeto com contagens processadas
 */
export const processBatchVehicleCounts = (responses) => {
  const result = {};

  for (const [key, response] of Object.entries(responses)) {
    result[key] = processVehicleCount(response, key);
  }

  return result;
};

/**
 * Validar e normalizar resposta da API
 * @param {Object} apiResponse - Resposta da API
 * @param {string} dataType - Tipo de dados esperado
 * @returns {Object} Resposta normalizada
 */
export const normalizeApiResponse = (apiResponse, dataType) => {
  const mapping = API_FIELD_MAPPINGS[dataType];

  if (!mapping) {
    console.warn(`[ApiAdapter] Tipo desconhecido: ${dataType}`);
    return {
      vehicles: [],
      count: 0,
      isValid: false,
    };
  }

  const vehicles = extractVehicleArray(apiResponse, dataType);
  const count = calculateVehicleCount(vehicles, dataType);

  return {
    vehicles,
    count,
    isValid: true,
    dataType,
    timestamp: Date.now(),
  };
};

/**
 * Criar adaptador customizado para tipos de dados específicos
 * @param {Object} config - Configuração do adaptador
 * @returns {Function} Função adaptadora
 */
export const createCustomAdapter = (config) => {
  const { path, countFields, defaultValue = [] } = config;

  return (apiResponse) => {
    const vehicles = getValueByPath(apiResponse, path, defaultValue);

    if (!Array.isArray(vehicles)) {
      return {
        vehicles: [],
        count: 0,
        isValid: false,
      };
    }

    const count = vehicles.reduce((total, item) => {
      const itemCount = extractNumericValue(item, countFields);
      return total + itemCount;
    }, 0);

    return {
      vehicles,
      count,
      isValid: true,
      timestamp: Date.now(),
    };
  };
};

/**
 * Obter configuração de mapeamento para um tipo de dados
 * @param {string} dataType - Tipo de dados
 * @returns {Object|null} Configuração de mapeamento
 */
export const getFieldMapping = (dataType) => {
  return API_FIELD_MAPPINGS[dataType] || null;
};

/**
 * Verificar se um tipo de dados é suportado
 * @param {string} dataType - Tipo de dados
 * @returns {boolean} True se suportado
 */
export const isSupportedDataType = (dataType) => {
  return Object.prototype.hasOwnProperty.call(API_FIELD_MAPPINGS, dataType);
};

/**
 * Listar todos os tipos de dados suportados
 * @returns {Array<string>} Lista de tipos suportados
 */
export const getSupportedDataTypes = () => {
  return Object.keys(API_FIELD_MAPPINGS);
};

export default {
  extractVehicleArray,
  calculateVehicleCount,
  processVehicleCount,
  processBatchVehicleCounts,
  normalizeApiResponse,
  createCustomAdapter,
  getFieldMapping,
  isSupportedDataType,
  getSupportedDataTypes,
};
