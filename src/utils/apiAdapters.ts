export type DataType =
  | "transito"
  | "filaDescarga"
  | "filaCarga"
  | "patioDescarga"
  | "patioCarga"
  | "descargasHoje"
  | "cargasHoje";

interface FieldMapping {
  path: string[];
  countFields: string[];
  defaultValue: any[];
}

const API_FIELD_MAPPINGS: Record<DataType, FieldMapping> = {
  transito: {
    path: ["dados", "listaTransito", "transitoVeiculos"],
    countFields: ["t_veiculos"],
    defaultValue: [],
  },

  filaDescarga: {
    path: ["dados", "listaFilaDescarga", "filaDescargaVeiculos"],
    countFields: ["fd_veiculos"],
    defaultValue: [],
  },

  filaCarga: {
    path: ["dados", "listaFilaCarga", "filaCargaVeiculos"],
    countFields: ["fc_veiculos"],
    defaultValue: [],
  },

  patioDescarga: {
    path: ["dados", "listaPatioDescarga", "patioDescargaVeiculos"],
    countFields: ["pd_veiculos"],
    defaultValue: [],
  },

  patioCarga: {
    path: ["dados", "listaPatioCarga", "patioCargaVeiculos"],
    countFields: ["pc_veiculos"],
    defaultValue: [],
  },

  descargasHoje: {
    path: ["dados", "listaDescarga", "DescargaVeiculos"],
    countFields: ["d_veiculos"],
    defaultValue: [],
  },

  cargasHoje: {
    path: ["dados", "listaCarga", "CargaVeiculos"],
    countFields: ["cargas_hoje", "c_veiculos"],
    defaultValue: [],
  },
};

const getValueByPath = <T = any>(
  obj: any,
  path: string[],
  defaultValue: T | null = null
): T | null => {
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

export const extractVehicleArray = (
  apiResponse: any,
  dataType: DataType
): any[] => {
  const mapping = API_FIELD_MAPPINGS[dataType];

  if (!mapping) {
    console.warn(`[ApiAdapter] Tipo de dados desconhecido: ${dataType}`);
    return [];
  }

  const vehicleArray = getValueByPath<any[]>(
    apiResponse,
    mapping.path,
    mapping.defaultValue
  );

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

const extractNumericValue = (item: any, possibleFields: string[]): number => {
  if (!item || typeof item !== "object") {
    return 0;
  }

  for (const field of possibleFields) {
    if (Object.prototype.hasOwnProperty.call(item, field)) {
      const value = item[field];

      if (typeof value === "number") {
        return isNaN(value) ? 0 : value;
      }

      if (typeof value === "string") {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? 0 : parsed;
      }

      return 0;
    }
  }

  return 0;
};

export const calculateVehicleCount = (
  vehicleArray: any[],
  dataType: DataType
): number => {
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

export const processVehicleCount = (
  apiResponse: any,
  dataType: DataType
): number => {
  const vehicleArray = extractVehicleArray(apiResponse, dataType);
  return calculateVehicleCount(vehicleArray, dataType);
};

/**
 * Processa a resposta unificada do endpoint "monitor"
 * que retorna todos os dados do dashboard em uma única requisição
 *
 * A resposta vem no formato simplificado:
 * {
 *   dados: {
 *     transitoVeiculos: [{ t_veiculos: X }],
 *     filaDescargaVeiculos: [{ fd_veiculos: X }],
 *     ...
 *   }
 * }
 */
export const processUnifiedDashboardResponse = (
  apiResponse: any
): Record<DataType, number> => {
  if (!apiResponse || !apiResponse.dados) {
    console.warn('[ApiAdapter] Resposta unificada inválida ou vazia');
    return {
      transito: 0,
      filaDescarga: 0,
      filaCarga: 0,
      patioDescarga: 0,
      patioCarga: 0,
      descargasHoje: 0,
      cargasHoje: 0,
    };
  }

  const { dados } = apiResponse;

  // Helper para extrair contagem de um array de forma segura
  const extractCount = (
    vehicleArray: any[],
    countField: string
  ): number => {
    if (!Array.isArray(vehicleArray) || vehicleArray.length === 0) {
      return 0;
    }

    return vehicleArray.reduce((total, item) => {
      if (!item || typeof item !== 'object') return total;

      const value = item[countField];

      if (typeof value === 'number') {
        return total + (isNaN(value) ? 0 : value);
      }

      if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        return total + (isNaN(parsed) ? 0 : parsed);
      }

      return total;
    }, 0);
  };

  const result: Record<DataType, number> = {
    transito: extractCount(dados.transitoVeiculos || [], 't_veiculos'),
    filaDescarga: extractCount(dados.filaDescargaVeiculos || [], 'fd_veiculos'),
    filaCarga: extractCount(dados.filaCargaVeiculos || [], 'fc_veiculos'),
    patioDescarga: extractCount(dados.patioDescargaVeiculos || [], 'pd_veiculos'),
    patioCarga: extractCount(dados.patioCargaVeiculos || [], 'pc_veiculos'),
    descargasHoje: extractCount(dados.descargaVeiculos || [], 'd_veiculos'),
    cargasHoje: extractCount(dados.cargaVeiculos || [], 'c_veiculos'),
  };

  if (__DEV__) {
    console.log('[ApiAdapter] Unified dashboard processed:', result);
  }

  return result;
};

export const processBatchVehicleCounts = (
  responses: Record<string, any>
): Record<string, number> => {
  const result: Record<string, number> = {};

  for (const [key, response] of Object.entries(responses)) {
    result[key] = processVehicleCount(response, key as DataType);
  }

  return result;
};

export interface NormalizedResponse {
  vehicles: any[];
  count: number;
  isValid: boolean;
  dataType?: DataType;
  timestamp?: number;
}

export const normalizeApiResponse = (
  apiResponse: any,
  dataType: DataType
): NormalizedResponse => {
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

export interface CustomAdapterConfig {
  path: string[];
  countFields: string[];
  defaultValue?: any[];
}

export const createCustomAdapter = (config: CustomAdapterConfig) => {
  const { path, countFields, defaultValue = [] } = config;

  return (apiResponse: any): NormalizedResponse => {
    const vehicles = getValueByPath<any[]>(apiResponse, path, defaultValue);

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

export const getFieldMapping = (dataType: DataType): FieldMapping | null => {
  return API_FIELD_MAPPINGS[dataType] || null;
};

export const isSupportedDataType = (dataType: string): dataType is DataType => {
  return Object.prototype.hasOwnProperty.call(API_FIELD_MAPPINGS, dataType);
};

export const getSupportedDataTypes = (): DataType[] => {
  return Object.keys(API_FIELD_MAPPINGS) as DataType[];
};

export default {
  extractVehicleArray,
  calculateVehicleCount,
  processVehicleCount,
  processUnifiedDashboardResponse,
  processBatchVehicleCounts,
  normalizeApiResponse,
  createCustomAdapter,
  getFieldMapping,
  isSupportedDataType,
  getSupportedDataTypes,
};
