import type { DateTimeFormatOptions } from "../types";

export const formatPeso = (
  peso: number | string | null | undefined
): string => {
  if (!peso || isNaN(Number(peso))) return "0";
  return Number(peso).toLocaleString("pt-BR");
};

export const formatPercentual = (
  valor: number | string | null | undefined
): string => {
  if (!valor || isNaN(Number(valor))) return "0%";
  return `${Number(valor).toFixed(2)}%`;
};

export const formatNumber = (
  valor: number | string | null | undefined
): string => {
  if (!valor || isNaN(Number(valor))) return "0";
  return Number(valor).toLocaleString("pt-BR");
};

export const formatCurrency = (
  valor: number | string | null | undefined
): string => {
  if (!valor || isNaN(Number(valor))) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor));
};

export const formatDateTime = (
  date: string | Date | null | undefined,
  options: DateTimeFormatOptions = {}
): string => {
  if (!date) return "";

  const { includeTime = true, includeDate = true, format = "pt-BR" } = options;

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (includeDate && includeTime) {
    return dateObj.toLocaleString(format);
  } else if (includeDate) {
    return dateObj.toLocaleDateString(format);
  } else if (includeTime) {
    return dateObj.toLocaleTimeString(format);
  }

  return dateObj.toLocaleString(format);
};

export const truncateText = (
  text: string | null | undefined,
  maxLength: number = 50
): string => {
  if (!text || text.length <= maxLength) return text || "";
  return text.substring(0, maxLength - 3) + "...";
};

export const capitalizeFirst = (text: string | null | undefined): string => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return "";

  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  } else if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  return phone;
};

export const calculateWaitTimeInHours = (
  data: string | null | undefined,
  hora: string | null | undefined
): number => {
  if (!data || !hora) return 0;

  try {
    const dateTimeStr = `${data}T${hora}`;
    const entryDate = new Date(dateTimeStr);
    const now = new Date();

    const diffInMs = now.getTime() - entryDate.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    return Math.max(0, diffInHours);
  } catch (error) {
    console.error("Erro ao calcular tempo de espera:", error);
    return 0;
  }
};

export const getCardColorByWaitTime = (waitTimeInHours: number): string => {
  if (waitTimeInHours >= 24) {
    return "#EF4444";
  } else if (waitTimeInHours >= 22) {
    return "#F59E0B";
  }
  return "#10B981";
};

export const formatWaitTime = (waitTimeInHours: number): string => {
  if (waitTimeInHours < 1) {
    const minutes = Math.floor(waitTimeInHours * 60);
    return `${minutes} min`;
  } else if (waitTimeInHours < 24) {
    const hours = Math.floor(waitTimeInHours);
    const minutes = Math.floor((waitTimeInHours - hours) * 60);
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  } else {
    const days = Math.floor(waitTimeInHours / 24);
    const hours = Math.floor(waitTimeInHours % 24);
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
};

export default {
  formatPeso,
  formatPercentual,
  formatNumber,
  formatCurrency,
  formatDateTime,
  truncateText,
  capitalizeFirst,
  formatPhoneNumber,
  calculateWaitTimeInHours,
  getCardColorByWaitTime,
  formatWaitTime,
};
