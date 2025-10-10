import React, { useState, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  FlatList,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import type { StackScreenProps } from "@react-navigation/stack";
import { useApp } from "../context/AppContext";
import { useGlobalFilters } from "../hooks/useGlobalFilters";
import { useFilterLoader } from "../hooks/useFilterLoader";
import useAutoRefresh from "../hooks/useAutoRefresh";
import {
  LoadingSpinner,
  ErrorMessage,
  BackgroundLoadingIndicator,
  Header,
  InfoRow,
  UpdateBanner,
  EmptyView,
  SideMenu,
} from "../components";
import { COLORS, SCREEN_NAMES, DEFAULT_API_FILTERS } from "../constants";
import {
  formatPeso,
  formatPercentual,
  formatNumber,
} from "../utils/formatters";
import apiService from "../services/apiService";
import {
  STABILITY_CHECK_TIMEOUT,
  MONITOR_CORTE_REFRESH_INTERVAL,
  CACHE_TIME,
  QUICK_RETURN_THRESHOLD,
  SHORT_NAVIGATION_THRESHOLD,
  QUICK_RETURN_STALE_TIME,
  SHORT_NAVIGATION_STALE_TIME,
} from "../constants/timing";
import type { RootStackParamList, ContratoData } from "../types";

type MonitorCorteScreenProps = StackScreenProps<
  RootStackParamList,
  "MonitorCorte"
>;

interface ContratoCardProps {
  item: ContratoData;
}

interface FilterOptionProps {
  option: string;
  isSelected: boolean;
  onToggle: (value: string) => void;
}

type LoadingType = "background" | "manual" | "initial";

const MonitorCorteScreen: React.FC<MonitorCorteScreenProps> = ({
  navigation,
  route,
}) => {
  const { state } = useApp();
  const {
    filterOptions,
    selectedFilters,
    isLoading: filtersLoading,
    toggleFilter,
    resetFilters,
    getApiFilters,
  } = useGlobalFilters();

  const { loadFiltersForFilial } = useFilterLoader();

  const [data, setData] = useState<ContratoData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [hasShownInitialData, setHasShownInitialData] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isInitializingScreen, setIsInitializingScreen] = useState<boolean>(true);
  const [lastDataLoad, setLastDataLoad] = useState<number | null>(null);
  const lastFocusTime = useRef<number | null>(null);
  const navigationStartTime = useRef<number | null>(null);

  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [filtersVisible, setFiltersVisible] = useState<boolean>(false);
  const [activeFilterTab, setActiveFilterTab] = useState<
    "servicos" | "operacao" | "grupos" | "produtos"
  >("servicos");

  const fetchContratosData = useCallback(
    async (loadingType: LoadingType = "background") => {
      if (!state.isLoggedIn || !state.selectedFilial) return;

      try {
        if (loadingType === "manual") {
          setRefreshing(true);
        } else if (loadingType === "initial") {
          setLoading(true);
        }

        if (__DEV__) {
          console.log(`[MonitorCorteScreen] Fetching data (${loadingType})`);
        }

        let apiFilters;
        try {
          apiFilters = getApiFilters();
        } catch (error) {
          apiFilters = {
            filtroServico: { ...DEFAULT_API_FILTERS.SERVICO } as Record<string, 0 | 1>,
            filtroOpPadrao: { ...DEFAULT_API_FILTERS.OP_PADRAO } as Record<string, 0 | 1>,
            filtroGrupo: null,
            filtroTpProd: null,
          };
        }

        const { filtroServico, filtroOpPadrao, filtroGrupo, filtroTpProd } =
          apiFilters;

        const response = await apiService.getContratosData(
          state.selectedFilial,
          filtroServico as Record<string, 0 | 1>,
          filtroOpPadrao as Record<string, 0 | 1>,
          filtroGrupo,
          filtroTpProd
        );

        if (
          response.dados?.CortesFila &&
          Array.isArray(response.dados.CortesFila) &&
          response.dados.CortesFila.length > 0
        ) {
          setData(response.dados.CortesFila);
          setLastUpdate(new Date());
          setLastDataLoad(Date.now());
          setError(null);
        } else {
          setData([]);
          if (hasShownInitialData || loadingType === "manual") {
            setError(
              "Nenhum monitor corte encontrado com os filtros aplicados"
            );
          }
        }

        setHasShownInitialData(true);
      } catch (err) {
        console.error("[MonitorCorteScreen] Error:", err);
        setHasShownInitialData(true);
        setError("Erro ao carregar monitor corte");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      state.isLoggedIn,
      state.selectedFilial,
      selectedFilters,
      getApiFilters,
      hasShownInitialData,
    ]
  );

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (!hasShownInitialData) {
        if (__DEV__) {
          console.log(
            "[MonitorCorteScreen] Timeout atingido, forçando saída do loading"
          );
        }
        setHasShownInitialData(true);
      }
    }, STABILITY_CHECK_TIMEOUT);

    return () => clearTimeout(timeout);
  }, [hasShownInitialData]);

  const { updateActivity } = useAutoRefresh(fetchContratosData, {
    enabled: true,
    interval: MONITOR_CORTE_REFRESH_INTERVAL,
    pauseOnBackground: true,
    adaptiveInterval: true,
  });

  useFocusEffect(
    useCallback(() => {
      let isCancelled = false;

      const loadData = async () => {
        try {
          if (isCancelled) return;

          const currentTime = Date.now();
          const timeSinceLastFocus = lastFocusTime.current
            ? currentTime - lastFocusTime.current
            : Infinity;
          lastFocusTime.current = currentTime;

          const dataAge = lastDataLoad ? currentTime - lastDataLoad : Infinity;
          const timeAwayFromScreen = navigationStartTime.current
            ? currentTime - navigationStartTime.current
            : timeSinceLastFocus;

          const shouldSkipReload =
            (dataAge < CACHE_TIME && data.length > 0) ||
            (timeSinceLastFocus < QUICK_RETURN_THRESHOLD &&
              data.length > 0 &&
              dataAge < QUICK_RETURN_STALE_TIME) ||
            (timeAwayFromScreen < SHORT_NAVIGATION_THRESHOLD &&
              data.length > 0 &&
              dataAge < SHORT_NAVIGATION_STALE_TIME);

          if (shouldSkipReload) {
            if (__DEV__) {
              console.log(
                `[MonitorCorteScreen] Skipping reload - Data age: ${Math.round(
                  dataAge / 1000
                )}s`
              );
            }
            navigationStartTime.current = null;
            setIsInitializingScreen(false);
            return;
          }

          setIsInitializingScreen(true);

          const needsFilters =
            (filterOptions?.grupos?.length || 0) === 0 ||
            (filterOptions?.servicos?.length || 0) === 0 ||
            (filterOptions?.opPadrao?.length || 0) === 0 ||
            (filterOptions?.produtos?.length || 0) === 0;
          const needsData = (data?.length || 0) === 0;

          if (needsFilters && needsData) {
            await Promise.all([
              loadFiltersForFilial(state.selectedFilial),
              fetchContratosData("initial"),
            ]);
          } else if (needsFilters) {
            await loadFiltersForFilial(state.selectedFilial);
          } else if (needsData) {
            await fetchContratosData("initial");
          }
        } finally {
          if (!isCancelled) {
            setIsInitializingScreen(false);
          }
        }
      };

      loadData();

      return () => {
        isCancelled = true;
      };
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

  const onRefresh = useCallback(async () => {
    updateActivity();
    setLastDataLoad(null);
    await fetchContratosData("manual");
  }, [fetchContratosData, updateActivity]);

  const handleApplyFilters = useCallback(async () => {
    updateActivity();
    setFiltersVisible(false);
    setLastDataLoad(null);

    try {
      await fetchContratosData("manual");
      if (__DEV__)
        console.log("[MonitorCorteScreen] Filtros aplicados com sucesso");
    } catch (error) {
      console.error("[MonitorCorteScreen] Erro ao aplicar filtros:", error);
    }
  }, [fetchContratosData, updateActivity]);

  const hasActiveFilters = useMemo(() => {
    const servicos = selectedFilters?.servicos || [];
    const opPadrao = selectedFilters?.opPadrao || [];
    const grupos = selectedFilters?.grupos || [];
    const produtos = selectedFilters?.produtos || [];

    const servicosOptions = filterOptions?.servicos || [];
    const opPadraoOptions = filterOptions?.opPadrao || [];
    const gruposOptions = filterOptions?.grupos || [];
    const produtosOptions = filterOptions?.produtos || [];

    return (
      (servicos.length < servicosOptions.length &&
        servicosOptions.length > 0) ||
      (opPadrao.length < opPadraoOptions.length &&
        opPadraoOptions.length > 0) ||
      (grupos.length < gruposOptions.length && gruposOptions.length > 0) ||
      (produtos.length < produtosOptions.length && produtosOptions.length > 0)
    );
  }, [selectedFilters, filterOptions]);

  const ContratoCard = React.memo<ContratoCardProps>(({ item }) => {
    const handleCardPress = () => {
      updateActivity();
      navigationStartTime.current = Date.now();

      const apiFilters = getApiFilters();

      navigation.navigate(SCREEN_NAMES.CONTRATOS_DETALHES, {
        fila: item.fila,
        grupo: item.grupo,
        produto: item.prod,
        filial: state.selectedFilial,
        dadosCorte: {
          peso_origem: item.peso_origem,
          peso_descarga: item.peso_descarga,
          peso_carga: item.peso_carga,
          peso_meia_carga: item.peso_meia_carga || 0,
          peso_destino: item.peso_destino || 0,
          dif_peso_descarga_origem: item.dif_peso_descarga_origem,
          pdif_peso_descarga_origem: item.pdif_peso_descarga_origem,
          dif_peso_carga_descarga: item.dif_peso_carga_descarga,
          pdif_peso_carga_descarga: item.pdif_peso_carga_descarga,
          dif_peso_destino_carga:
            item.dif_peso_destino_carga || item.peso_carga * -1,
          pdif_peso_destino_carga: item.pdif_peso_destino_carga || 0,
          veiculos_descarga: item.veiculos_descarga,
          veiculos_descarga_med: item.veiculos_descarga_med,
          veiculos_carga: item.veiculos_carga,
          veiculos_carga_med: item.veiculos_carga_med,
          veiculos_meia_carga: item.veiculos_meia_carga || 0,
        },
        filtroServico: apiFilters.filtroServico,
        filtroOpPadrao: apiFilters.filtroOpPadrao,
      });
    };

    return (
      <View style={styles.contratoCard}>
        <TouchableOpacity onPress={handleCardPress}>
          <View style={styles.cardHeader}>
            <Text style={styles.filaText}>Fila {item.fila}</Text>
            <Text style={[styles.grupoText, styles.grupoBadge]}>
              {item.grupo}
            </Text>
          </View>

          <View style={styles.cardContent}>
            <InfoRow label="Produto:" value={item.prod || "Não informado"} />
            <InfoRow
              label="Peso Origem:"
              value={formatPeso(item.peso_origem)}
            />
            <InfoRow
              label="Peso Descarga:"
              value={formatPeso(item.peso_descarga)}
            />
            <InfoRow label="Peso Carga:" value={formatPeso(item.peso_carga)} />
            <InfoRow
              label="Dif. Descarga/Origem:"
              value={formatPercentual(item.pdif_peso_descarga_origem)}
              isPercentage
              percentageValue={item.pdif_peso_descarga_origem}
            />
            <InfoRow
              label="Dif. Carga/Descarga:"
              value={formatPercentual(item.pdif_peso_carga_descarga)}
              isPercentage
              percentageValue={item.pdif_peso_carga_descarga}
            />
            <InfoRow
              label="Veículos Descarga:"
              value={formatNumber(item.veiculos_descarga)}
            />
            <InfoRow
              label="Veículos Carga:"
              value={formatNumber(item.veiculos_carga)}
            />
          </View>
        </TouchableOpacity>
      </View>
    );
  });

  ContratoCard.displayName = "ContratoCard";

  const FilterOption = React.memo<FilterOptionProps>(
    ({ option, isSelected, onToggle }) => (
      <TouchableOpacity
        style={[
          styles.filterOptionButton,
          isSelected && styles.filterOptionButtonActive,
        ]}
        onPress={() => onToggle(option)}
      >
        <Text
          style={[
            styles.filterOptionText,
            isSelected && styles.filterOptionTextActive,
          ]}
        >
          {option}
        </Text>
      </TouchableOpacity>
    )
  );

  FilterOption.displayName = "FilterOption";

  const renderFilterTab = useCallback(() => {
    if (filtersLoading) {
      return <LoadingSpinner text="Carregando Monitor Corte..." size="small" />;
    }

    const renderFilterOptions = (
      options: string[],
      selectedItems: string[],
      filterType: string
    ) => (
      <View style={styles.filterOptions}>
        {options.map((option) => (
          <FilterOption
            key={option}
            option={option}
            isSelected={selectedItems.includes(option)}
            onToggle={(value) => toggleFilter(filterType, value)}
          />
        ))}
      </View>
    );

    switch (activeFilterTab) {
      case "servicos":
        return renderFilterOptions(
          filterOptions.servicos,
          selectedFilters.servicos,
          "servicos"
        );
      case "operacao":
        return renderFilterOptions(
          filterOptions.opPadrao,
          selectedFilters.opPadrao,
          "opPadrao"
        );
      case "grupos":
        return renderFilterOptions(
          filterOptions.grupos,
          selectedFilters.grupos,
          "grupos"
        );
      case "produtos":
        return renderFilterOptions(
          filterOptions.produtos,
          selectedFilters.produtos,
          "produtos"
        );
      default:
        return null;
    }
  }, [
    filtersLoading,
    activeFilterTab,
    filterOptions,
    selectedFilters,
    toggleFilter,
  ]);

  const renderHeader = useCallback(() => {
    return (
      <UpdateBanner
        lastUpdate={lastUpdate}
        onFilterPress={() => {
          updateActivity();
          setFiltersVisible(true);
        }}
        showFilterButton={true}
        hasActiveFilters={hasActiveFilters}
      />
    );
  }, [lastUpdate, hasActiveFilters]);

  const renderEmptyComponent = useCallback(() => {
    const isStillLoading =
      isInitializingScreen || loading || (!hasShownInitialData && !error);

    if (isStillLoading) {
      return <EmptyView icon="⏳" message="Carregando monitor corte..." />;
    }

    return (
      <EmptyView
        icon="📋"
        message={error || "Nenhum monitor corte encontrado"}
        subMessage="Verifique os filtros aplicados"
      />
    );
  }, [error, isInitializingScreen, loading, hasShownInitialData]);

  const shouldShowLoading =
    (isInitializingScreen || loading) &&
    data.length === 0 &&
    !hasShownInitialData &&
    !error;

  if (__DEV__ && shouldShowLoading) {
    console.log("[MonitorCorteScreen] Showing loading spinner:", {
      isInitializingScreen,
      loading,
      dataLength: data.length,
      hasShownInitialData,
      error: !!error,
    });
  }

  if (shouldShowLoading) {
    return <LoadingSpinner text="Carregando monitor corte..." />;
  }

  if (error && data.length === 0) {
    return (
      <ErrorMessage
        message={error}
        onRetry={() => fetchContratosData("initial")}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Monitor Corte"
        subtitle={`Filial: ${state.selectedFilial}`}
        onMenuPress={() => setMenuVisible(true)}
        onRefreshPress={onRefresh}
        isRefreshing={refreshing}
        showRefreshButton={true}
        showLoadingIndicator={loading}
      />

      <FlatList
        data={data}
        renderItem={({ item }) => <ContratoCard item={item} />}
        keyExtractor={(item, index) =>
          item.fila && item.grupo && item.prod
            ? `${item.fila}-${item.grupo}-${item.prod}`
            : `fallback-${index}`
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={6}
        windowSize={7}
        initialNumToRender={4}
        updateCellsBatchingPeriod={50}
        getItemLayout={(data, index) => ({
          length: 200,
          offset: 200 * index,
          index,
        })}
      />
      <Modal
        visible={filtersVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFiltersVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros</Text>
              <TouchableOpacity
                onPress={() => setFiltersVisible(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filterTabs}>
              {[
                { key: "servicos", label: "Serviços" },
                { key: "operacao", label: "Operação" },
                { key: "grupos", label: "Grupos" },
                { key: "produtos", label: "Produtos" },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.filterTab,
                    activeFilterTab === tab.key && styles.filterTabActive,
                  ]}
                  onPress={() =>
                    setActiveFilterTab(
                      tab.key as "servicos" | "operacao" | "grupos" | "produtos"
                    )
                  }
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      activeFilterTab === tab.key && styles.filterTabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView style={styles.filterTabContent}>
              {renderFilterTab()}
            </ScrollView>

            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetFilters}
              >
                <Text style={styles.resetButtonText}>Limpar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApplyFilters}
              >
                <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BackgroundLoadingIndicator
        visible={loading && hasShownInitialData}
        text="Atualizando monitor corte..."
        position="bottom"
      />

      <SideMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        navigation={navigation}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  listContent: {
    paddingBottom: 15,
  },
  contratoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    marginHorizontal: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  filaText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  grupoBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  grupoText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.white,
  },
  cardContent: {
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalCloseButton: {
    padding: 5,
  },
  modalCloseText: {
    fontSize: 20,
    color: COLORS.gray,
  },
  filterTabs: {
    flexDirection: "row",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  filterTabActive: {
    borderBottomColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  filterTabTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  filterTabContent: {
    maxHeight: 300,
    marginBottom: 15,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  filterOptionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 10,
    marginBottom: 10,
  },
  filterOptionButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterOptionText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  filterOptionTextActive: {
    color: COLORS.white,
    fontWeight: "600",
  },
  filterButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  resetButton: {
    flex: 1,
    backgroundColor: COLORS.gray,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 10,
  },
  resetButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  applyButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  applyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default MonitorCorteScreen;
