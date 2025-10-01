/**
 * Validadores para respostas da API
 * Garante que dados recebidos estão no formato esperado
 */

/**
 * Classe de erro para validação de API
 */
export class ApiValidationError extends Error {
  constructor(message, field, receivedValue) {
    super(message);
    this.name = 'ApiValidationError';
    this.field = field;
    this.receivedValue = receivedValue;
  }
}

/**
 * Verificar se valor é um objeto válido
 */
const isObject = (value) => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

/**
 * Verificar se valor é um array válido
 */
const isArray = (value) => {
  return Array.isArray(value);
};

/**
 * Validar estrutura base de resposta da API
 */
export const validateApiResponse = (response, context = 'API') => {
  if (!response) {
    throw new ApiValidationError(
      `${context}: Resposta nula ou undefined`,
      'response',
      response
    );
  }

  if (!isObject(response)) {
    throw new ApiValidationError(
      `${context}: Resposta não é um objeto`,
      'response',
      typeof response
    );
  }

  return true;
};

/**
 * Validar dados de veículos
 */
export const validateVehicleData = (data, context = 'VehicleData') => {
  validateApiResponse(data, context);

  if (!data.dados) {
    throw new ApiValidationError(
      `${context}: Campo 'dados' ausente`,
      'dados',
      data
    );
  }

  return true;
};

/**
 * Validar lista de veículos em trânsito
 */
export const validateTransitoData = (response) => {
  validateVehicleData(response, 'TransitoData');

  const { dados } = response;

  if (!dados.listaTransito) {
    console.warn('[ApiValidator] listaTransito ausente, usando fallback');
    return { ...response, dados: { ...dados, listaTransito: {} } };
  }

  if (!isObject(dados.listaTransito)) {
    throw new ApiValidationError(
      'listaTransito deve ser um objeto',
      'dados.listaTransito',
      typeof dados.listaTransito
    );
  }

  // Normalizar transitoVeiculos
  if (!isArray(dados.listaTransito.transitoVeiculos)) {
    console.warn('[ApiValidator] transitoVeiculos não é array, normalizando');
    dados.listaTransito.transitoVeiculos = [];
  }

  return response;
};

/**
 * Validar dados de fila de descarga
 */
export const validateFilaDescargaData = (response) => {
  validateVehicleData(response, 'FilaDescargaData');

  const { dados } = response;

  if (!dados.listaFilaDescarga) {
    console.warn('[ApiValidator] listaFilaDescarga ausente, usando fallback');
    return { ...response, dados: { ...dados, listaFilaDescarga: {} } };
  }

  // Normalizar filaDescargaVeiculos
  if (!isArray(dados.listaFilaDescarga.filaDescargaVeiculos)) {
    console.warn('[ApiValidator] filaDescargaVeiculos não é array, normalizando');
    dados.listaFilaDescarga.filaDescargaVeiculos = [];
  }

  return response;
};

/**
 * Validar dados de fila de carga
 */
export const validateFilaCargaData = (response) => {
  validateVehicleData(response, 'FilaCargaData');

  const { dados } = response;

  if (!dados.listaFilaCarga) {
    console.warn('[ApiValidator] listaFilaCarga ausente, usando fallback');
    return { ...response, dados: { ...dados, listaFilaCarga: {} } };
  }

  // Normalizar filaCargaVeiculos
  if (!isArray(dados.listaFilaCarga.filaCargaVeiculos)) {
    console.warn('[ApiValidator] filaCargaVeiculos não é array, normalizando');
    dados.listaFilaCarga.filaCargaVeiculos = [];
  }

  return response;
};

/**
 * Validar dados de pátio
 */
export const validatePatioData = (response, tipo = 'descarga') => {
  validateVehicleData(response, `Patio${tipo}Data`);

  const { dados } = response;
  const listKey = tipo === 'descarga' ? 'listaPatioDescarga' : 'listaPatioCarga';
  const veiculosKey = tipo === 'descarga' ? 'patioDescargaVeiculos' : 'patioCargaVeiculos';

  if (!dados[listKey]) {
    console.warn(`[ApiValidator] ${listKey} ausente, usando fallback`);
    return { ...response, dados: { ...dados, [listKey]: {} } };
  }

  // Normalizar veículos
  if (!isArray(dados[listKey][veiculosKey])) {
    console.warn(`[ApiValidator] ${veiculosKey} não é array, normalizando`);
    dados[listKey][veiculosKey] = [];
  }

  return response;
};

/**
 * Validar dados de operações concluídas
 */
export const validateOperacoesData = (response, tipo = 'descarga') => {
  validateVehicleData(response, `${tipo}Data`);

  const { dados } = response;
  const listKey = tipo === 'descarga' ? 'listaDescarga' : 'listaCarga';
  const veiculosKey = tipo === 'descarga' ? 'DescargaVeiculos' : 'CargaVeiculos';

  if (!dados[listKey]) {
    console.warn(`[ApiValidator] ${listKey} ausente, usando fallback`);
    return { ...response, dados: { ...dados, [listKey]: {} } };
  }

  // Normalizar veículos
  if (!isArray(dados[listKey][veiculosKey])) {
    console.warn(`[ApiValidator] ${veiculosKey} não é array, normalizando`);
    dados[listKey][veiculosKey] = [];
  }

  return response;
};

/**
 * Validar dados de contratos
 */
export const validateContratosData = (response) => {
  validateApiResponse(response, 'ContratosData');

  if (!response.dados) {
    console.warn('[ApiValidator] dados ausente em contratos, usando fallback');
    return { ...response, dados: { contratos: [] } };
  }

  if (!isArray(response.dados.contratos)) {
    console.warn('[ApiValidator] contratos não é array, normalizando');
    response.dados.contratos = [];
  }

  return response;
};

/**
 * Validar dados de filtros
 */
export const validateFilterData = (response, filterType = 'genérico') => {
  validateApiResponse(response, `FilterData[${filterType}]`);

  if (!response.dados) {
    throw new ApiValidationError(
      `FilterData[${filterType}]: Campo 'dados' ausente`,
      'dados',
      response
    );
  }

  return response;
};

/**
 * Normalizar contagem de veículos
 * Garante que sempre retorna um número válido
 */
export const normalizeVehicleCount = (value) => {
  if (typeof value === 'number' && !isNaN(value)) {
    return Math.max(0, Math.floor(value));
  }

  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) {
      return Math.max(0, parsed);
    }
  }

  return 0;
};

/**
 * Validador composto para todos os dados de transporte
 */
export const validateTransportData = (data) => {
  const errors = [];

  try {
    if (data.transitoData) validateTransitoData(data.transitoData);
  } catch (error) {
    errors.push({ type: 'transito', error });
  }

  try {
    if (data.filaDescargaData) validateFilaDescargaData(data.filaDescargaData);
  } catch (error) {
    errors.push({ type: 'filaDescarga', error });
  }

  try {
    if (data.filaCargaData) validateFilaCargaData(data.filaCargaData);
  } catch (error) {
    errors.push({ type: 'filaCarga', error });
  }

  try {
    if (data.patioDescargaData) validatePatioData(data.patioDescargaData, 'descarga');
  } catch (error) {
    errors.push({ type: 'patioDescarga', error });
  }

  try {
    if (data.patioCargaData) validatePatioData(data.patioCargaData, 'carga');
  } catch (error) {
    errors.push({ type: 'patioCarga', error });
  }

  if (errors.length > 0) {
    console.warn('[ApiValidator] Erros na validação de dados de transporte:', errors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Wrapper seguro para chamar validadores
 * Retorna dados normalizados mesmo em caso de erro
 */
export const safeValidate = (validator, data, fallback = null) => {
  try {
    return validator(data);
  } catch (error) {
    console.error('[ApiValidator] Erro na validação:', error);
    return fallback || data;
  }
};

export default {
  validateApiResponse,
  validateVehicleData,
  validateTransitoData,
  validateFilaDescargaData,
  validateFilaCargaData,
  validatePatioData,
  validateOperacoesData,
  validateContratosData,
  validateFilterData,
  normalizeVehicleCount,
  validateTransportData,
  safeValidate,
  ApiValidationError,
};
