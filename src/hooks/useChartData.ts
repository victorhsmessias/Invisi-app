import { useState, useCallback, useEffect } from "react";
import apiService from "../services/apiService";
import type { Filial } from "../constants/api";
import type {
  DMonitorResponse,
  DMonitorMovimento,
  DMonitorFilters,
} from "../types/api";
import { DEFAULT_API_FILTERS } from "../constants";

interface ChartDataPoint {
  periodo: string;
  veiculos: number;
  peso: number;
}

export interface ProductData {
  name: string;
  color: string;
  data: number[];
  pesoData: number[];
}

export interface AggregatedChartData {
  labels: string[];
  cargaVeiculos: number[];
  cargaPeso: number[];
  descargaVeiculos: number[];
  descargaPeso: number[];
  cargaByProduct: ProductData[];
  descargaByProduct: ProductData[];
}

interface UseChartDataReturn {
  data: DMonitorMovimento[];
  chartData: AggregatedChartData;
  loading: boolean;
  error: string | null;
  fetchData: (filters: Partial<DMonitorFilters>) => Promise<void>;
  refreshData: () => Promise<void>;
}

const formatDateLabel = (periodo: string): string => {
  try {
    const date = new Date(periodo);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${day}/${month}`;
  } catch {
    return periodo.split(" ")[0];
  }
};

const COLOR_PALETTE: string[] = [
  "#2196F3",
  "#FF9800",
  "#4CAF50",
  "#F44336",
  "#9C27B0",
  "#FFD700",
  "#00BCD4",
  "#FF6B35",
  "#8BC34A",
  "#E91E63",
  "#3F51B5",
  "#FFEB3B",
  "#795548",
  "#607D8B",
  "#FFC107",
];
const getProductColor = (index: number): string => {
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
};

const aggregateData = (
  movimentos: DMonitorMovimento[]
): AggregatedChartData => {
  const groupedByPeriod = movimentos.reduce((acc, mov) => {
    const periodo = mov.periodo;
    if (!acc[periodo]) {
      acc[periodo] = {
        periodo,
        cargaVeiculos: 0,
        cargaPeso: 0,
        descargaVeiculos: 0,
        descargaPeso: 0,
        cargaByProduct: {} as Record<string, number>,
        descargaByProduct: {} as Record<string, number>,
        cargaPesoByProduct: {} as Record<string, number>,
        descargaPesoByProduct: {} as Record<string, number>,
      };
    }
    acc[periodo].cargaVeiculos += mov.veiculos_carga || 0;
    acc[periodo].cargaPeso += mov.peso_carga || 0;
    acc[periodo].descargaVeiculos += mov.veiculos_descarga || 0;
    acc[periodo].descargaPeso += mov.peso_descarga || 0;

    const produto = mov.produto || "OUTROS";
    acc[periodo].cargaByProduct[produto] =
      (acc[periodo].cargaByProduct[produto] || 0) + (mov.veiculos_carga || 0);
    acc[periodo].descargaByProduct[produto] =
      (acc[periodo].descargaByProduct[produto] || 0) +
      (mov.veiculos_descarga || 0);
    acc[periodo].cargaPesoByProduct[produto] =
      (acc[periodo].cargaPesoByProduct[produto] || 0) + (mov.peso_carga || 0);
    acc[periodo].descargaPesoByProduct[produto] =
      (acc[periodo].descargaPesoByProduct[produto] || 0) +
      (mov.peso_descarga || 0);

    return acc;
  }, {} as Record<string, any>);

  const sortedPeriods = Object.values(groupedByPeriod).sort((a, b) => {
    return new Date(a.periodo).getTime() - new Date(b.periodo).getTime();
  });

  const allProducts = new Set<string>();
  movimentos.forEach((mov) => {
    allProducts.add(mov.produto || "OUTROS");
  });

  // Ordena produtos alfabeticamente para consistência
  const sortedProducts = Array.from(allProducts).sort();

  const cargaByProduct: ProductData[] = sortedProducts.map(
    (produto, index) => ({
      name: produto,
      color: getProductColor(index),
      data: sortedPeriods.map((period) => period.cargaByProduct[produto] || 0),
      pesoData: sortedPeriods.map(
        (period) => period.cargaPesoByProduct[produto] || 0
      ),
    })
  );

  const descargaByProduct: ProductData[] = sortedProducts.map(
    (produto, index) => ({
      name: produto,
      color: getProductColor(index),
      data: sortedPeriods.map(
        (period) => period.descargaByProduct[produto] || 0
      ),
      pesoData: sortedPeriods.map(
        (period) => period.descargaPesoByProduct[produto] || 0
      ),
    })
  );

  return {
    labels: sortedPeriods.map((item) => formatDateLabel(item.periodo)),
    cargaVeiculos: sortedPeriods.map((item) => item.cargaVeiculos),
    cargaPeso: sortedPeriods.map((item) => item.cargaPeso),
    descargaVeiculos: sortedPeriods.map((item) => item.descargaVeiculos),
    descargaPeso: sortedPeriods.map((item) => item.descargaPeso),
    cargaByProduct,
    descargaByProduct,
  };
};

export const useChartData = (filial: Filial): UseChartDataReturn => {
  const [data, setData] = useState<DMonitorMovimento[]>([]);
  const [chartData, setChartData] = useState<AggregatedChartData>({
    labels: [],
    cargaVeiculos: [],
    cargaPeso: [],
    descargaVeiculos: [],
    descargaPeso: [],
    cargaByProduct: [],
    descargaByProduct: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFilters, setLastFilters] = useState<Partial<DMonitorFilters>>({});

  const fetchData = useCallback(
    async (filters: Partial<DMonitorFilters>) => {
      try {
        setLoading(true);
        setError(null);

        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        const defaultFilters: DMonitorFilters = {
          filtro_filial: filial,
          filtro_servico: DEFAULT_API_FILTERS.SERVICO,
          filtro_op_padrao: DEFAULT_API_FILTERS.OP_PADRAO,
          filtro_data_inicio:
            filters.filtro_data_inicio ||
            sevenDaysAgo.toISOString().split("T")[0],
          filtro_data_fim:
            filters.filtro_data_fim || today.toISOString().split("T")[0],
          filtro_acumulador: filters.filtro_acumulador || {
            dia: 1,
            mes: 0,
            ano: 0,
          },
          filtro_grupo: filters.filtro_grupo || "",
          filtro_produto: filters.filtro_produto || "",
        };

        setLastFilters(defaultFilters);

        const response = await apiService.getDMonitorData(defaultFilters);

        if (
          response.mensagemRetorno.codigo === "SUCESSO" &&
          response.dados?.movto
        ) {
          setData(response.dados.movto);
          const aggregated = aggregateData(response.dados.movto);
          setChartData(aggregated);
        } else {
          throw new Error(
            response.mensagemRetorno.descricao || "Erro ao buscar dados"
          );
        }
      } catch (err: any) {
        console.error("[useChartData] Error fetching data:", err);
        setError(err.message || "Erro ao carregar dados dos gráficos");
        setData([]);
        setChartData({
          labels: [],
          cargaVeiculos: [],
          cargaPeso: [],
          descargaVeiculos: [],
          descargaPeso: [],
          cargaByProduct: [],
          descargaByProduct: [],
        });
      } finally {
        setLoading(false);
      }
    },
    [filial]
  );

  const refreshData = useCallback(async () => {
    await fetchData(lastFilters);
  }, [fetchData, lastFilters]);

  useEffect(() => {
    fetchData({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filial]);

  return {
    data,
    chartData,
    loading,
    error,
    fetchData,
    refreshData,
  };
};
