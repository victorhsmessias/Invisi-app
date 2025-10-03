import type { DateTimeFormatOptions } from '../types';

export const formatPeso = (peso: number | string | null | undefined): string => {
  if (!peso || isNaN(Number(peso))) return "0 kg";
  return Number(peso).toLocaleString("pt-BR") + " kg";
};

export const formatPercentual = (valor: number | string | null | undefined): string => {
  if (!valor || isNaN(Number(valor))) return "0%";
  return `${Number(valor).toFixed(2)}%`;
};

export const formatNumber = (valor: number | string | null | undefined): string => {
  if (!valor || isNaN(Number(valor))) return "0";
  return Number(valor).toLocaleString("pt-BR");
};

export const formatCurrency = (valor: number | string | null | undefined): string => {
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

  const {
    includeTime = true,
    includeDate = true,
    format = "pt-BR"
  } = options;

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

export const formatTimeAgo = (date: string | Date | null | undefined): string => {
  if (!date) return "";

  const now = new Date();
  const past = typeof date === "string" ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "agora há pouco";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `há ${diffInMinutes} min`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `há ${diffInHours}h`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `há ${diffInDays} dias`;
};

export const truncateText = (text: string | null | undefined, maxLength: number = 50): string => {
  if (!text || text.length <= maxLength) return text || "";
  return text.substring(0, maxLength - 3) + "...";
};

export const capitalizeFirst = (text: string | null | undefined): string => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return "";

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "");

  // Format based on length
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  } else if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  return phone;
};

export default {
  formatPeso,
  formatPercentual,
  formatNumber,
  formatCurrency,
  formatDateTime,
  formatTimeAgo,
  truncateText,
  capitalizeFirst,
  formatPhoneNumber,
};
