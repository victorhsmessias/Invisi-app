import React, { useState, useCallback, useMemo } from "react";
import { View, FlatList, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { useMonitorData } from "../hooks/useMonitorData";
import { useFilters } from "../hooks/useFilters";
import {
  Header,
  VehicleCard,
  SummaryCard,
  EmptyView,
  LoadingSpinner,
  ErrorMessage,
  UpdateBanner,
  BackgroundLoadingIndicator,
  FilterModal,
} from "../components";
import { SERVICO_OPTIONS, OP_PADRAO_OPTIONS } from "../constants/filters";
import { BADGE_COLORS } from "../constants/colors";
import { COLORS } from "../constants";

const PatioDescargaScreen = ({ navigation }) => {
  const { state } = useApp();

  // Hook useFilters para gerenciar filtros
  const {
    selectedServicos,
    selectedOpPadrao,
    toggleServicoFilter,
    toggleOpPadraoFilter,
    getFilters,
    resetFilters,
    hasActiveFilters,
  } = useFilters();

  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Converter filtros para formato da API
  const apiFilters = useMemo(() => {
    const filters = getFilters();
    return {
      filtro_servico: filters.filtro_servico,
      filtro_op_padrao: filters.filtro_op_padrao,
    };
  }, [getFilters]);

  // Hook useMonitorData centraliza TODA lógica de fetch
  const { data, loading, refreshing, totals, error, refresh } = useMonitorData(
    "monitor_patio_desc",
    state.selectedFilial,
    apiFilters
  );

  // Configurar grupos de filtros
  const filterGroups = useMemo(
    () => [
      {
        title: "Tipos de Serviço",
        options: SERVICO_OPTIONS,
        selected: selectedServicos,
        onToggle: toggleServicoFilter,
      },
      {
        title: "Tipos de Operação",
        options: OP_PADRAO_OPTIONS,
        selected: selectedOpPadrao,
        onToggle: toggleOpPadraoFilter,
      },
    ],
    [selectedServicos, selectedOpPadrao, toggleServicoFilter, toggleOpPadraoFilter]
  );

  // Handler de aplicar filtros
  const handleApplyFilters = useCallback(() => {
    setFilterModalVisible(false);
  }, []);

  // Formatar peso para exibição
  const formatWeight = useCallback((weight) => {
    if (weight >= 1000) {
      return `${(weight / 1000).toFixed(1)}t`;
    }
    return `${weight.toLocaleString("pt-BR")}kg`;
  }, []);

  // Preparar items do SummaryCard
  const summaryItems = useMemo(() => {
    return [
      {
        value: totals.veiculos || 0,
        label: "Veículos",
        icon: "📦",
      },
      {
        value: totals.grupos || 0,
        label: "Grupos",
      },
      {
        value: formatWeight(totals.peso || 0),
        label: "Peso Total",
      },
    ];
  }, [totals, formatWeight]);

  // Renderizar header da lista
  const renderHeader = useCallback(() => {
    return (
      <>
        <UpdateBanner
          lastUpdate={new Date()}
          onFilterPress={() => setFilterModalVisible(true)}
          showFilterButton={true}
          hasActiveFilters={hasActiveFilters}
        />
        <SummaryCard items={summaryItems} />
      </>
    );
  }, [summaryItems, hasActiveFilters]);

  // Renderizar cada item
  const renderItem = useCallback(({ item }) => {
    return (
      <VehicleCard
        item={{
          grupo: item.grupo || "N/A",
          fila: item.fila || "N/A",
          produto: item.produto || "Não informado",
          peso: parseFloat(item.peso || 0),
          veiculos: parseInt(item.veiculos || 0),
        }}
        badgeColor={BADGE_COLORS.patioDescarga}
      />
    );
  }, []);

  // KeyExtractor
  const keyExtractor = useCallback((item, index) => {
    return item.grupo || item.fila || index.toString();
  }, []);

  // Renderizar componente vazio
  const renderEmptyComponent = useCallback(() => {
    if (loading) {
      return <EmptyView icon="📦" message="Carregando pátio de descarga..." />;
    }
    return (
      <EmptyView
        icon="📦"
        message={error || "Nenhum veículo descarregando"}
        subMessage="Puxe para baixo para atualizar"
      />
    );
  }, [error, loading]);

  // Loading inicial
  if (loading && (!data || data.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Pátio de Descarga"
          subtitle={`Filial: ${state.selectedFilial}`}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <LoadingSpinner text="Carregando pátio de descarga..." />
      </SafeAreaView>
    );
  }

  // Erro inicial
  if (error && (!data || data.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Pátio de Descarga"
          subtitle={`Filial: ${state.selectedFilial}`}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <ErrorMessage message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Pátio de Descarga"
        subtitle={`Filial: ${state.selectedFilial}`}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        showLoadingIndicator={loading}
      />

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        windowSize={8}
        initialNumToRender={6}
        updateCellsBatchingPeriod={50}
        getItemLayout={(data, index) => ({
          length: 140,
          offset: 140 * index,
          index,
        })}
      />

      {/* Modal de Filtros */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filterGroups={filterGroups}
        onApply={handleApplyFilters}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Indicador de carregamento em background */}
      <BackgroundLoadingIndicator
        visible={loading && data && data.length > 0}
        text="Atualizando pátio de descarga..."
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
  listContent: {
    paddingBottom: 15,
  },
});

export default PatioDescargaScreen;
