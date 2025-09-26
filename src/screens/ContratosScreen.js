import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  FlatList,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useApp } from "../context/AppContext";
import { useContractFilters } from "../hooks/useContractFilters";
import { LoadingSpinner, ErrorMessage } from "../components";
import { COLORS } from "../constants";
import {
  formatPeso,
  formatPercentual,
  formatNumber,
} from "../utils/formatters";
import apiService from "../services/apiService";

const ContratosScreen = ({ navigation, route }) => {
  const { state } = useApp();
  const {
    filterOptions,
    selectedFilters,
    loading: filtersLoading,
    error: filtersError,
    toggleFilter,
    resetFilters,
    getApiFilters,
  } = useContractFilters();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState("servicos");

  const fetchContratosData = useCallback(async () => {
    if (!state.isLoggedIn || !state.selectedFilial) return;

    try {
      setLoading(true);
      setError(null);

      const { filtroServico, filtroOpPadrao, filtroGrupo, filtroTpProd } =
        getApiFilters();

      const response = await apiService.getContratosData(
        state.selectedFilial,
        filtroServico,
        filtroOpPadrao,
        filtroGrupo,
        filtroTpProd
      );

      if (response.dados?.CortesFila) {
        setData(response.dados.CortesFila);
        setLastUpdate(new Date());
      } else {
        setData([]);
        setError("Nenhum contrato encontrado");
      }
    } catch (err) {
      console.error("[ContratosScreen] Error:", err);
      setError("Erro ao carregar contratos");
    } finally {
      setLoading(false);
    }
  }, [state.isLoggedIn, state.selectedFilial, selectedFilters, getApiFilters]);

  useFocusEffect(
    useCallback(() => {
      if (filterOptions.grupos.length > 0) {
        // Wait for filters to load
        fetchContratosData();
      }
    }, [fetchContratosData, filterOptions.grupos.length])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchContratosData();
    setRefreshing(false);
  }, [fetchContratosData]);

  const handleApplyFilters = useCallback(() => {
    setFiltersVisible(false);
    fetchContratosData();
  }, [fetchContratosData]);

  const hasActiveFilters = useCallback(() => {
    return (
      selectedFilters.servicos.length < filterOptions.servicos.length ||
      selectedFilters.opPadrao.length < filterOptions.opPadrao.length ||
      selectedFilters.grupos.length < filterOptions.grupos.length ||
      selectedFilters.produtos.length < filterOptions.produtos.length
    );
  }, [selectedFilters, filterOptions]);

  React.useEffect(() => {
    if (data && data.length > 0) {
    }
  }, [data]);

  const ContratoCard = React.memo(({ item }) => (
    <View style={styles.contratoCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.filaText}>Fila {item.fila}</Text>
        <View style={styles.grupoBadge}>
          <Text style={styles.grupoText}>{item.grupo}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <InfoRow label="Produto:" value={item.prod || "Não informado"} />
        <InfoRow label="Peso Origem:" value={formatPeso(item.peso_origem)} />
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
    </View>
  ));

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
      return <LoadingSpinner text="Carregando filtros..." size="small" />;
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
    // Calcular totais agregados dos contratos
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

    // Formatar peso em toneladas se for muito grande
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
                onPress={() => setFiltersVisible(true)}
              >
                <Text style={styles.filterButtonText}>🔍 Filtros</Text>
                {hasActiveFilters() && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>!</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  }, [lastUpdate, data, hasActiveFilters]);

  const renderEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyText}>
          {error || "Nenhum contrato encontrado"}
        </Text>
        <Text style={styles.emptySubtext}>Verifique os filtros aplicados</Text>
      </View>
    ),
    [error]
  );

  if (loading && data.length === 0) {
    return <LoadingSpinner text="Carregando contratos..." />;
  }

  if (error && data.length === 0) {
    return <ErrorMessage message={error} onRetry={fetchContratosData} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Contratos</Text>
          <Text style={styles.headerSubtitle}>
            Filial: {state.selectedFilial}
          </Text>
        </View>

        <View style={styles.headerRight} />
      </View>

      {/* Lista de Contratos */}
      <FlatList
        data={data}
        renderItem={({ item }) => <ContratoCard item={item} />}
        keyExtractor={(item, index) => `${item.fila}-${item.grupo}-${index}`}
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
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={5}
      />

      {/* Modal de Filtros */}
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

            {/* Tabs */}
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

            {/* Conteúdo do Tab */}
            <ScrollView style={styles.filterTabContent}>
              {renderFilterTab()}
            </ScrollView>

            {/* Botões */}
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
  },
  listContent: {
    paddingBottom: 15,
  },
  updateContainer: {
    backgroundColor: "#e8f4fd",
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 2,
    marginBottom: 4,
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
  filterBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "bold",
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

export default ContratosScreen;
