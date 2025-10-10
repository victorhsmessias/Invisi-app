import React, { useState, useCallback, useMemo } from "react";
import { View, FlatList, RefreshControl, StyleSheet } from "react-native";
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

const FilaDescargaScreen = ({ navigation }) => {
  const { state } = useApp();

  const [filtroServico, setFiltroServico] = useState("T");
  const [filtroOpPadrao, setFiltroOpPadrao] = useState("T");
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const { data, loading, refreshing, totals, error, refresh } = useMonitorData(
    "monitor_fila_desc",
    state.selectedFilial,
    {
      filtroServico,
      filtroOpPadrao,
    }
  );

  const handleFilterApply = useCallback(
    (newFiltroServico, newFiltroOpPadrao) => {
      setFilterModalVisible(false);
      setFiltroServico(newFiltroServico);
      setFiltroOpPadrao(newFiltroOpPadrao);
    },
    []
  );

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
        />
        <SummaryCard items={summaryItems} />
      </>
    );
  }, [summaryItems]);

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
        badgeColor={BADGE_COLORS.filaDescarga}
      />
    );
  }, []);

  const keyExtractor = useCallback((item, index) => {
    return item.grupo || item.fila || index.toString();
  }, []);

  const renderEmptyComponent = useCallback(() => {
    if (loading) {
      return <EmptyView icon="⏳" message="Carregando fila de descarga..." />;
    }
    return (
      <EmptyView
        icon="⏳"
        message={error || "Nenhum veículo na fila de descarga"}
        subMessage="Puxe para baixo para atualizar"
      />
    );
  }, [error, loading]);

  if (loading && (!data || data.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Fila de Descarga"
          subtitle={`Filial: ${state.selectedFilial}`}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <LoadingSpinner text="Carregando fila de descarga..." />
      </SafeAreaView>
    );
  }

  if (error && (!data || data.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Fila de Descarga"
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
        title="Fila de Descarga"
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
        filtroServico={filtroServico}
        setFiltroServico={setFiltroServico}
        filtroOpPadrao={filtroOpPadrao}
        setFiltroOpPadrao={setFiltroOpPadrao}
        onApply={handleFilterApply}
      />

      <BackgroundLoadingIndicator
        visible={loading && data && data.length > 0}
        text="Atualizando fila de descarga..."
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

export default FilaDescargaScreen;
