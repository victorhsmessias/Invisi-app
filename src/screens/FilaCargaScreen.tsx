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

const FilaCargaScreen = ({ navigation }) => {
  const { state } = useApp();

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

  const apiFilters = useMemo(() => {
    const filters = getFilters();
    return {
      filtro_servico: filters.filtro_servico,
      filtro_op_padrao: filters.filtro_op_padrao,
    };
  }, [getFilters]);

  const { data, loading, refreshing, totals, error, refresh } = useMonitorData(
    "monitor_fila_carga",
    state.selectedFilial,
    apiFilters
  );

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
    [
      selectedServicos,
      selectedOpPadrao,
      toggleServicoFilter,
      toggleOpPadraoFilter,
    ]
  );

  const handleApplyFilters = useCallback(() => {
    setFilterModalVisible(false);
  }, []);

  const formatWeight = useCallback((weight) => {
    if (weight >= 1000) {
      return `${(weight / 1000).toFixed(1)}t`;
    }
    return `${weight.toLocaleString("pt-BR")}kg`;
  }, []);

  const summaryItems = useMemo(() => {
    return [
      {
        value: totals.veiculos || 0,
        label: "Veículos",
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
    const formatDate = (dateStr) => {
      if (!dateStr) return "N/A";
      return new Date(dateStr).toLocaleDateString("pt-BR");
    };

    const formatTime = (timeStr) => {
      if (!timeStr) return "N/A";
      return timeStr.substring(0, 5);
    };

    return (
      <VehicleCard
        item={{
          grupo: item.grupo || "N/A",
          fila: item.fila || "N/A",
          produto: item.produto || "Não informado",
          peso: parseFloat(item.peso || 0),
          veiculos: parseInt(item.veiculos || 0),
        }}
        badgeColor={BADGE_COLORS.filaCarga}
        additionalFields={[
          { label: "Data:", value: formatDate(item.data) },
          { label: "Hora:", value: formatTime(item.hora) },
        ]}
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
      return <EmptyView icon="⏰" message="Carregando fila de carga..." />;
    }
    return (
      <EmptyView
        icon="⏰"
        message={error || "Nenhum veículo na fila de carga"}
        subMessage="Puxe para baixo para atualizar"
      />
    );
  }, [error, loading]);

  // Loading inicial
  if (loading && (!data || data.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Fila de Carga"
          subtitle={`Filial: ${state.selectedFilial}`}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <LoadingSpinner text="Carregando fila de carga..." />
      </SafeAreaView>
    );
  }

  // Erro inicial
  if (error && (!data || data.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Fila de Carga"
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
        title="Fila de Carga"
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
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={5}
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
        text="Atualizando fila de carga..."
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

export default FilaCargaScreen;
