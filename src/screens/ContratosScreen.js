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
import { useContratos } from "../hooks/useContratos";
import { useApp } from "../context/AppContext";
import { LoadingSpinner, ErrorMessage } from "../components";
import { COLORS, SERVICO_OPTIONS } from "../constants";
import { formatPeso, formatPercentual, formatNumber } from "../utils/formatters";

// Componente de Card de Contrato otimizado
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
      <InfoRow label="Peso Descarga:" value={formatPeso(item.peso_descarga)} />
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
      <InfoRow label="Veículos Carga:" value={formatNumber(item.veiculos_carga)} />
    </View>
  </View>
));

// Componente de linha de informação reutilizável
const InfoRow = React.memo(({ label, value, isPercentage, percentageValue }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text
      style={[
        styles.infoValue,
        isPercentage &&
          (percentageValue < 0 ? styles.negativeValue : styles.positiveValue),
      ]}
      numberOfLines={1}
      ellipsizeMode="tail"
    >
      {value}
    </Text>
  </View>
));

// Componente de filtro reutilizável
const FilterOption = React.memo(({ option, isSelected, onToggle }) => (
  <TouchableOpacity
    style={[
      styles.filterOptionButton,
      isSelected && styles.filterOptionButtonActive,
    ]}
    onPress={() => onToggle(option.key)}
  >
    <Text
      style={[
        styles.filterOptionText,
        isSelected && styles.filterOptionTextActive,
      ]}
    >
      {option.label}
    </Text>
  </TouchableOpacity>
));

// Componente principal
const ContratosScreen = ({ navigation, route }) => {
  const { state } = useApp();
  const {
    data,
    loading,
    lastUpdate,
    filterOptions,
    filtersLoading,
    filters,
    toggleOpPadraoFilter,
    toggleServicoFilter,
    toggleGrupoFilter,
    toggleProdutoFilter,
    fetchContratosData,
    refresh,
    error,
  } = useContratos();

  const [refreshing, setRefreshing] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState("servico");

  // Buscar dados quando a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      fetchContratosData();
    }, [fetchContratosData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleApplyFilters = useCallback(() => {
    setFiltersVisible(false);
    fetchContratosData();
  }, [fetchContratosData]);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.selectedOpPadrao.length < filterOptions.opPadrao.length ||
      filters.selectedServicos.length < SERVICO_OPTIONS.length ||
      filters.selectedGrupos.length > 0 ||
      filters.selectedProdutos.length > 0
    );
  }, [filters, filterOptions]);

  const renderFilterTab = useCallback(() => {
    if (filtersLoading) {
      return <LoadingSpinner text="Carregando filtros..." size="small" />;
    }

    const renderFilterOptions = (options, selectedItems, toggleFunction) => (
      <View style={styles.filterOptions}>
        {options.map((option) => (
          <FilterOption
            key={option.key}
            option={option}
            isSelected={selectedItems.includes(option.key)}
            onToggle={toggleFunction}
          />
        ))}
      </View>
    );

    switch (activeFilterTab) {
      case "servico":
        return renderFilterOptions(
          SERVICO_OPTIONS,
          filters.selectedServicos,
          toggleServicoFilter
        );
      case "operacao":
        return renderFilterOptions(
          filterOptions.opPadrao,
          filters.selectedOpPadrao,
          toggleOpPadraoFilter
        );
      case "grupo":
        return renderFilterOptions(
          filterOptions.grupos,
          filters.selectedGrupos,
          toggleGrupoFilter
        );
      case "produto":
        return renderFilterOptions(
          filterOptions.produtos,
          filters.selectedProdutos,
          toggleProdutoFilter
        );
      default:
        return null;
    }
  }, [
    filtersLoading,
    activeFilterTab,
    filterOptions,
    filters,
    toggleServicoFilter,
    toggleOpPadraoFilter,
    toggleGrupoFilter,
    toggleProdutoFilter,
  ]);

  const renderHeader = useCallback(
    () => (
      <View>
        {lastUpdate && (
          <View style={styles.updateContainer}>
            <Text style={styles.updateText}>
              Atualizado: {lastUpdate.toLocaleTimeString("pt-BR").substring(0, 5)}
            </Text>
          </View>
        )}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{data.length}</Text>
            <Text style={styles.summaryLabel}>Contratos</Text>
          </View>
        </View>
      </View>
    ),
    [lastUpdate, data.length]
  );

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
    return <ErrorMessage message={error} onRetry={refresh} />;
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
          <Text style={styles.headerSubtitle}>Filial: {state.selectedFilial}</Text>
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFiltersVisible(true)}
        >
          <Text style={styles.filterIcon}>🔎</Text>
          {hasActiveFilters() && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>!</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Lista de Contratos */}
      <FlatList
        data={data}
        renderItem={({ item }) => <ContratoCard item={item} />}
        keyExtractor={(item, index) => `${item.fila}-${index}`}
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
                { key: "servico", label: "Serviço" },
                { key: "operacao", label: "Operação" },
                { key: "grupo", label: "Grupo" },
                { key: "produto", label: "Produto" },
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

            {/* Botão Aplicar */}
            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={handleApplyFilters}
            >
              <Text style={styles.applyFiltersText}>Aplicar Filtros</Text>
            </TouchableOpacity>
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
  filterButton: {
    padding: 8,
    position: "relative",
  },
  filterIcon: {
    fontSize: 22,
  },
  filterBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: COLORS.danger,
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  listContent: {
    paddingBottom: 15,
  },
  updateContainer: {
    backgroundColor: "#e8f4fd",
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 2,
    marginHorizontal: 10,
    borderRadius: 5,
  },
  updateText: {
    fontSize: 12,
    color: "#0066cc",
    textAlign: "center",
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
    backgroundColor: COLORS.purple,
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
  applyFiltersButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  applyFiltersText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ContratosScreen;