import React, { useState, useCallback } from "react";
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
import { useApp } from "../context/AppContext";
import { useGlobalFilters } from "../hooks/useGlobalFilters";
import useSmartLoading from "../hooks/useSmartLoading";
import useAutoRefresh from "../hooks/useAutoRefresh";
import {
  LoadingSpinner,
  ErrorMessage,
  BackgroundLoadingIndicator,
  HeaderLoadingIndicator,
} from "../components";
import { COLORS, SCREEN_NAMES } from "../constants";
import {
  formatPeso,
  formatPercentual,
  formatNumber,
} from "../utils/formatters";
import apiService from "../services/apiService";

const MonitorCorteScreen = ({ navigation, route }) => {
  const { state } = useApp();
  const {
    filterOptions,
    selectedFilters,
    isLoading: filtersLoading,
    toggleFilter,
    resetFilters,
    getApiFilters,
    hasValidCache,
    forceReload,
  } = useGlobalFilters();

  const [data, setData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [hasTriedLoading, setHasTriedLoading] = useState(false);
  const [isInitializingScreen, setIsInitializingScreen] = useState(true);
  const [hasShownInitialData, setHasShownInitialData] = useState(false);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (!hasShownInitialData) {
        if (__DEV__) {
          console.log(
            "[MonitorCorteScreen] Timeout atingido, forçando saída do loading"
          );
        }
        setHasShownInitialData(true);
        finishLoading("Tempo limite excedido");
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [hasShownInitialData, finishLoading]);
  const {
    isInitialLoading,
    isBackgroundLoading,
    isRefreshing,
    error,
    startInitialLoading,
    startManualRefresh,
    startBackgroundLoading,
    finishLoading,
    showFullscreenLoader,
    showBackgroundIndicator,
  } = useSmartLoading();
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState("servicos");

  const { updateActivity } = useAutoRefresh(fetchContratosData, {
    enabled: true,
    interval: 30000,
    pauseOnBackground: true,
    adaptiveInterval: true,
  });

  const fetchContratosData = useCallback(
    async (loadingType = "background") => {
      if (!state.isLoggedIn || !state.selectedFilial) return;

      try {
        setHasTriedLoading(true);

        if (loadingType === "initial") {
          startInitialLoading();
        } else if (loadingType === "manual") {
          startManualRefresh();
        } else {
          startBackgroundLoading();
        }

        if (__DEV__) {
          console.log(
            "[MonitorCorteScreen] ====== FETCH CONTRATOS DATA ======"
          );
          console.log("[MonitorCorteScreen] loadingType:", loadingType);
          console.log(
            "[MonitorCorteScreen] selectedFilters atual:",
            selectedFilters
          );
          console.log("[MonitorCorteScreen] filterOptions disponíveis:", {
            servicos: filterOptions.servicos,
            opPadrao: filterOptions.opPadrao,
            gruposLength: filterOptions.grupos?.length || 0,
            produtosLength: filterOptions.produtos?.length || 0,
          });
        }

        let apiFilters;
        try {
          apiFilters = getApiFilters();

          if (__DEV__) {
            console.log(
              "[MonitorCorteScreen] Generated API filters:",
              apiFilters
            );
          }
        } catch (error) {
          if (__DEV__) {
            console.log(
              "[MonitorCorteScreen] Error generating filters, using defaults:",
              error
            );
          }
          apiFilters = {
            filtroServico: { armazenagem: 1, transbordo: 1, pesagem: 0 },
            filtroOpPadrao: {
              rodo_ferro: 1,
              ferro_rodo: 1,
              rodo_rodo: 1,
              outros: 0,
            },
            filtroGrupo: null,
            filtroTpProd: null,
          };
        }

        const { filtroServico, filtroOpPadrao, filtroGrupo, filtroTpProd } =
          apiFilters;

        if (__DEV__) {
          console.log("[MonitorCorteScreen] Fetching data with filters:", {
            servicos: Object.keys(filtroServico).filter(
              (key) => filtroServico[key] === 1
            ),
            opPadrao: Object.keys(filtroOpPadrao).filter(
              (key) => filtroOpPadrao[key] === 1
            ),
            grupos: filtroGrupo ? filtroGrupo.length : 0,
            produtos: filtroTpProd ? filtroTpProd.length : 0,
          });
        }

        const response = await apiService.getContratosData(
          state.selectedFilial,
          filtroServico,
          filtroOpPadrao,
          filtroGrupo,
          filtroTpProd
        );

        if (__DEV__) {
          console.log(
            "[MonitorCorteScreen] API Response:",
            JSON.stringify(response, null, 2)
          );
          console.log("[MonitorCorteScreen] Response structure:", {
            hasDados: !!response.dados,
            hasCortesFila: !!response.dados?.CortesFila,
            cortesFilaType: typeof response.dados?.CortesFila,
            cortesFilaLength: Array.isArray(response.dados?.CortesFila)
              ? response.dados.CortesFila.length
              : "not array",
            allKeys: response.dados ? Object.keys(response.dados) : "no dados",
          });
        }

        if (
          response.dados?.CortesFila &&
          Array.isArray(response.dados.CortesFila) &&
          response.dados.CortesFila.length > 0
        ) {
          if (__DEV__)
            console.log(
              "[MonitorCorteScreen] Data loaded successfully:",
              response.dados.CortesFila.length,
              "items"
            );
          setData(response.dados.CortesFila);
          setLastUpdate(new Date());
        } else {
          if (__DEV__) {
            console.log("[MonitorCorteScreen] No valid data received from API");
            console.log(
              "[MonitorCorteScreen] CortesFila value:",
              response.dados?.CortesFila
            );
          }
          setData([]);
          if (hasShownInitialData || loadingType === "manual") {
            finishLoading(
              "Nenhum monitor corte encontrado com os filtros aplicados"
            );
          } else {
            finishLoading();
          }
        }

        setHasShownInitialData(true);
      } catch (err) {
        console.error("[MonitorCorteScreen] Error:", err);
        setHasShownInitialData(true);
        finishLoading("Erro ao carregar monitor corte");
        return;
      }

      finishLoading();
    },
    [
      state.isLoggedIn,
      state.selectedFilial,
      selectedFilters,
      getApiFilters,
      startInitialLoading,
      startManualRefresh,
      startBackgroundLoading,
      finishLoading,
    ]
  );

  useFocusEffect(
    useCallback(() => {
      let isCancelled = false;

      const loadData = async () => {
        try {
          if (isCancelled) return;
          setIsInitializingScreen(true);

          const needsFilters = (filterOptions?.grupos?.length || 0) === 0;
          const needsData = (data?.length || 0) === 0;

          if (needsFilters && needsData) {
            const hasPreloadedFilters =
              (filterOptions?.grupos?.length || 0) > 0 ||
              (state.filtersCache &&
                Object.keys(state.filtersCache).length > 0);

            if (hasPreloadedFilters) {
              if (__DEV__)
                console.log(
                  "[MonitorCorteScreen] Using preloaded filters, loading data only..."
                );
              await fetchContratosData("initial");
            } else {
              if (__DEV__)
                console.log(
                  "[MonitorCorteScreen] Loading filters and data in parallel..."
                );
              await Promise.all([
                loadFiltersForFilial(state.selectedFilial),
                fetchContratosData("initial"),
              ]);
            }

            if (!isCancelled) {
              initializeSelectedFilters();
            }
          } else if (needsFilters) {
            await loadFiltersForFilial(state.selectedFilial);
            if (!isCancelled) {
              initializeSelectedFilters();
            }
          } else if (needsData) {
            await fetchContratosData("initial");
          } else {
            initializeSelectedFilters();
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
    }, [state.selectedFilial])
  );

  const onRefresh = useCallback(async () => {
    updateActivity();
    await fetchContratosData("manual");
  }, [fetchContratosData, updateActivity]);

  const handleApplyFilters = useCallback(async () => {
    if (__DEV__) {
      console.log("[MonitorCorteScreen] ====== APLICANDO FILTROS ======");
      console.log(
        "[MonitorCorteScreen] selectedFilters antes de aplicar:",
        selectedFilters
      );

      try {
        const apiFilters = getApiFilters();
        console.log("[MonitorCorteScreen] ApiFilters gerados:", apiFilters);
      } catch (error) {
        console.error("[MonitorCorteScreen] Erro ao gerar apiFilters:", error);
      }
    }

    updateActivity();
    setFiltersVisible(false);

    try {
      await fetchContratosData("manual");
      if (__DEV__)
        console.log("[MonitorCorteScreen] Filters applied successfully");
    } catch (error) {
      console.error("[MonitorCorteScreen] Error applying filters:", error);
    }
  }, [fetchContratosData, updateActivity, selectedFilters, getApiFilters]);

  const hasActiveFilters = useCallback(() => {
    const servicos = selectedFilters?.servicos || [];
    const opPadrao = selectedFilters?.opPadrao || [];
    const grupos = selectedFilters?.grupos || [];
    const produtos = selectedFilters?.produtos || [];

    const servicosOptions = filterOptions?.servicos || [];
    const opPadraoOptions = filterOptions?.opPadrao || [];
    const gruposOptions = filterOptions?.grupos || [];
    const produtosOptions = filterOptions?.produtos || [];

    const servicosFiltered =
      servicos.length < servicosOptions.length && servicosOptions.length > 0;
    const opPadraoFiltered =
      opPadrao.length < opPadraoOptions.length && opPadraoOptions.length > 0;
    const gruposFiltered =
      grupos.length < gruposOptions.length && gruposOptions.length > 0;
    const produtosFiltered =
      produtos.length < produtosOptions.length && produtosOptions.length > 0;

    const isFiltered =
      servicosFiltered ||
      opPadraoFiltered ||
      gruposFiltered ||
      produtosFiltered;

    if (__DEV__) {
      console.log("[MonitorCorteScreen] Filter status:", {
        servicosFiltered,
        opPadraoFiltered,
        gruposFiltered,
        produtosFiltered,
        isFiltered,
        selectedFiltersLength: {
          servicos: servicos.length,
          opPadrao: opPadrao.length,
          grupos: grupos.length,
          produtos: produtos.length,
        },
        filterOptionsLength: {
          servicos: servicosOptions.length,
          opPadrao: opPadraoOptions.length,
          grupos: gruposOptions.length,
          produtos: produtosOptions.length,
        },
      });
    }

    return isFiltered;
  }, [selectedFilters, filterOptions]);

  React.useEffect(() => {
    if (data && data.length > 0) {
    }
  }, [data]);

  const ContratoCard = React.memo(({ item }) => {
    const handleGrupoPress = () => {
      updateActivity();
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
        filtroServico: getApiFilters().filtroServico,
        filtroOpPadrao: getApiFilters().filtroOpPadrao,
      });
    };

    return (
      <View style={styles.contratoCard}>
        <TouchableOpacity onPress={handleGrupoPress}>
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

  const InfoRow = React.memo(
    ({ label, value, isPercentage, percentageValue }) => (
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text
          style={[
            styles.infoValue,
            isPercentage &&
              (percentageValue < 0
                ? styles.negativeValue
                : styles.positiveValue),
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {value}
        </Text>
      </View>
    )
  );

  const FilterOption = React.memo(({ option, isSelected, onToggle }) => (
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
  ));

  const renderFilterTab = useCallback(() => {
    if (filtersLoading) {
      return <LoadingSpinner text="Carregando Monitor Corte..." size="small" />;
    }

    const renderFilterOptions = (options, selectedItems, filterType) => (
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
    const totals = data.reduce(
      (acc, item) => {
        const veiculosDescarga = parseInt(item.veiculos_descarga || 0);
        const veiculosCarga = parseInt(item.veiculos_carga || 0);
        const pesoOrigem = parseFloat(item.peso_origem || 0);

        return {
          totalVehicles:
            acc.totalVehicles + Math.max(veiculosDescarga, veiculosCarga),
          totalContracts: acc.totalContracts + 1,
          totalWeight: acc.totalWeight + pesoOrigem,
        };
      },
      { totalVehicles: 0, totalContracts: 0, totalWeight: 0 }
    );

    const formatWeight = (weight) => {
      if (weight >= 1000) {
        return `${(weight / 1000).toFixed(1)}t`;
      }
      return `${weight.toLocaleString()}kg`;
    };

    return (
      <View>
        {lastUpdate && (
          <View style={styles.updateContainer}>
            <View style={styles.updateRow}>
              <Text style={styles.updateText}>
                Atualizado:{" "}
                {lastUpdate.toLocaleTimeString("pt-BR").substring(0, 5)}
              </Text>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => {
                  updateActivity();
                  setFiltersVisible(true);
                }}
              >
                <Text style={styles.filterButtonText}>Filtros</Text>
                {hasActiveFilters()}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  }, [lastUpdate, data, hasActiveFilters]);

  const renderEmptyComponent = useCallback(() => {
    const isStillLoading =
      isInitializingScreen ||
      isInitialLoading ||
      (!hasShownInitialData && !error);

    if (isStillLoading) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>⏳</Text>
          <Text style={styles.emptyText}>Carregando monitor corte...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyText}>
          {error || "Nenhum monitor corte encontrado"}
        </Text>
        <Text style={styles.emptySubtext}>Verifique os filtros aplicados</Text>
      </View>
    );
  }, [error, isInitializingScreen, isInitialLoading, hasShownInitialData]);

  const shouldShowLoading =
    (isInitializingScreen || showFullscreenLoader || isInitialLoading) &&
    data.length === 0 &&
    !hasShownInitialData &&
    !error;

  if (__DEV__ && shouldShowLoading) {
    console.log("[MonitorCorteScreen] Showing loading spinner:", {
      isInitializingScreen,
      showFullscreenLoader,
      isInitialLoading,
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate(SCREEN_NAMES.HOME)}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Monitor Corte</Text>
          <Text style={styles.headerSubtitle}>
            Filial: {state.selectedFilial}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <HeaderLoadingIndicator visible={showBackgroundIndicator} />
        </View>
      </View>

      <FlatList
        data={data}
        renderItem={({ item }) => <ContratoCard item={item} />}
        keyExtractor={(item, index) =>
          `${item.fila || "no-fila"}-${item.grupo || "no-grupo"}-${
            item.prod || "no-prod"
          }-idx-${index}`
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={5}
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
                  onPress={() => setActiveFilterTab(tab.key)}
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

      {/* Indicador de carregamento em background */}
      <BackgroundLoadingIndicator
        visible={showBackgroundIndicator}
        text="Atualizando monitor corte..."
        position="bottom"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: "#333",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.black,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  headerRight: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingBottom: 15,
  },
  updateContainer: {
    backgroundColor: "#e8f4fd",
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 2,
    marginBottom: 5,
    marginHorizontal: 10,
    borderRadius: 5,
  },
  updateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  updateText: {
    fontSize: 12,
    color: "#0066cc",
  },
  filterButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
    position: "relative",
  },
  filterButtonText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: "500",
  },
  summaryContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 5,
    marginBottom: 10,
    marginHorizontal: 10,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.gray,
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
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.gray,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    textAlign: "right",
  },
  positiveValue: {
    color: COLORS.success,
  },
  negativeValue: {
    color: COLORS.danger,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.gray,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
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
