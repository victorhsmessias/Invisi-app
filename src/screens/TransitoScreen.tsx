import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { useMonitorData } from "../hooks/useMonitorData";
import {
  Header,
  VehicleCard,
  SummaryCard,
  EmptyView,
  LoadingSpinner,
  ErrorMessage,
  UpdateBanner,
  BackgroundLoadingIndicator,
} from "../components";
import FilterModal from "../components/FilterModal";
import { BADGE_COLORS } from "../constants/colors";
import { COLORS } from "../constants";

const TransitoScreen = ({ navigation }) => {
  const { state } = useApp();

  // Estados de filtros
  const [filtroServico, setFiltroServico] = useState("T");
  const [filtroOpPadrao, setFiltroOpPadrao] = useState("T");
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Hook useMonitorData centraliza TODA lógica de fetch
  const { data, loading, refreshing, totals, error, refresh } = useMonitorData(
    "monitor_transito",
    state.selectedFilial,
    {
      filtroServico,
      filtroOpPadrao,
    }
  );

  // Handler de aplicar filtros
  const handleFilterApply = useCallback(
    (newFiltroServico, newFiltroOpPadrao) => {
      setFilterModalVisible(false);
      setFiltroServico(newFiltroServico);
      setFiltroOpPadrao(newFiltroOpPadrao);
    },
    []
  );

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
        />
        <SummaryCard items={summaryItems} />
      </>
    );
  }, [summaryItems]);

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
        badgeColor={BADGE_COLORS.transito}
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
      return <EmptyView icon="🚛" message="Carregando trânsito..." />;
    }
    return (
      <EmptyView
        icon="🚛"
        message={error || "Nenhum trânsito encontrado"}
        subMessage="Puxe para baixo para atualizar"
      />
    );
  }, [error, loading]);

  // Loading inicial
  if (loading && (!data || data.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Trânsito de Veículos"
          subtitle={`Filial: ${state.selectedFilial}`}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <LoadingSpinner text="Carregando trânsito..." />
      </SafeAreaView>
    );
  }

  // Erro inicial
  if (error && (!data || data.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Trânsito de Veículos"
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
        title="Trânsito de Veículos"
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
        filtroServico={filtroServico}
        setFiltroServico={setFiltroServico}
        filtroOpPadrao={filtroOpPadrao}
        setFiltroOpPadrao={setFiltroOpPadrao}
        onApply={handleFilterApply}
      />

      {/* Indicador de carregamento em background */}
      <BackgroundLoadingIndicator
        visible={loading && data && data.length > 0}
        text="Atualizando trânsito..."
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

export default TransitoScreen;
