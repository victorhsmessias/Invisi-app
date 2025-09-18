export const formatPeso = (peso) => {
  if (!peso || isNaN(peso)) return "0 kg";
  return peso.toLocaleString("pt-BR") + " kg";
};

export const formatPercentual = (valor) => {
  if (!valor || isNaN(valor)) return "0%";
  return `${valor.toFixed(2)}%`;
};

export const formatNumber = (valor) => {
  if (!valor || isNaN(valor)) return "0";
  return valor.toLocaleString("pt-BR");
};

export const formatCurrency = (valor) => {
  if (!valor || isNaN(valor)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
};

export const formatDateTime = (date, options = {}) => {
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

export const formatTimeAgo = (date) => {
  if (!date) return "";

  const now = new Date();
  const past = typeof date === "string" ? new Date(date) : date;
  const diffInSeconds = Math.floor((now - past) / 1000);

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

export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
};

export const capitalizeFirst = (text) => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const formatPhoneNumber = (phone) => {
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