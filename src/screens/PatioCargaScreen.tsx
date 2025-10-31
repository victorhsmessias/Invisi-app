import type { StackScreenProps } from "@react-navigation/stack";
import type { RootStackParamList } from "../types";
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

type Props = StackScreenProps<RootStackParamList, "PatioCarga">;

const PatioCargaScreen: React.FC<Props> = ({ navigation }) => {
  const { state } = useApp();

  const {
    selectedServicos,
    selectedOpPadrao,
    tempSelectedServicos,
    tempSelectedOpPadrao,
    toggleTempServicoFilter,
    toggleTempOpPadraoFilter,
    initializeTempFilters,
    applyTempFilters,
    resetFilters,
    getFilters,
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

  const { data, loading, refreshing, totals, error, refresh, lastUpdate } = useMonitorData(
    "monitor_patio_carga",
    state.selectedFilial,
    apiFilters
  );

  const filterGroups = useMemo(
    () => [
      {
        title: "Tipos de Serviço",
        options: SERVICO_OPTIONS,
        selected: tempSelectedServicos,
        onToggle: toggleTempServicoFilter,
      },
      {
        title: "Tipos de Operação",
        options: OP_PADRAO_OPTIONS,
        selected: tempSelectedOpPadrao,
        onToggle: toggleTempOpPadraoFilter,
      },
    ],
    [
      tempSelectedServicos,
      tempSelectedOpPadrao,
      toggleTempServicoFilter,
      toggleTempOpPadraoFilter,
    ]
  );

  const handleOpenFilter = useCallback(() => {
    initializeTempFilters();
    setFilterModalVisible(true);
  }, [initializeTempFilters]);

  const handleApplyFilters = useCallback(() => {
    applyTempFilters();
    setFilterModalVisible(false);
  }, [applyTempFilters]);

  const formatWeight = useCallback((weight: number) => {
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
          lastUpdate={lastUpdate || new Date()}
          onFilterPress={handleOpenFilter}
          showFilterButton={true}
          hasActiveFilters={hasActiveFilters}
        />
        <SummaryCard items={summaryItems} />
      </>
    );
  }, [summaryItems, hasActiveFilters, handleOpenFilter, lastUpdate]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    return (
      <VehicleCard
        item={{
          grupo: item.grupo || "N/A",
          fila: item.fila || "N/A",
          produto: item.produto || "Não informado",
          peso: parseFloat(item.peso || 0),
          veiculos: parseInt(item.veiculos || 0),
        }}
        badgeColor={BADGE_COLORS.patioCarga}
      />
    );
  }, []);

  const keyExtractor = useCallback((item: any, index: number) => {
    const grupo = item.grupo || "";
    const fila = item.fila || "";
    const produto = item.produto || item.tp_prod || "";
    const peso = item.peso || "";
    const veiculos = item.veiculos || "";

    if (grupo && produto) {
      return `${grupo}-${produto}-${peso}-${veiculos}`;
    }
    if (fila && produto) {
      return `${fila}-${produto}-${peso}-${veiculos}`;
    }
    return `item-${grupo || fila}-${produto}-${index}`;
  }, []);

  const renderEmptyComponent = useCallback(() => {
    if (loading) {
      return (
        <EmptyView
          icon="construct-outline"
          message="Carregando pátio de carga..."
        />
      );
    }
    return (
      <EmptyView
        icon="construct-outline"
        message={error || "Nenhum veículo carregando"}
        subMessage="Puxe para baixo para atualizar"
      />
    );
  }, [error, loading]);

  if (loading && (!data || data.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Pátio de Carga"
          subtitle={`Filial: ${state.selectedFilial}`}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <LoadingSpinner text="Carregando pátio de carga..." />
      </SafeAreaView>
    );
  }

  if (error && (!data || data.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Pátio de Carga"
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
        title="Pátio de Carga"
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

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filterGroups={filterGroups}
        onApply={handleApplyFilters}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <BackgroundLoadingIndicator
        visible={loading && data && data.length > 0}
        text="Atualizando pátio de carga..."
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

export default PatioCargaScreen;
