import React, { useState, useCallback, useMemo } from "react";
import {
  FlatList,
  RefreshControl,
  View,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useApp } from "../context/AppContext";
import { useVehicleData } from "../hooks/useVehicleData";
import Header from "../components/common/Header";
import VehicleCard from "../components/common/VehicleCard";
import SummaryCard from "../components/common/SummaryCard";
import EmptyView from "../components/common/EmptyView";
import UpdateBanner from "../components/common/UpdateBanner";
import FilterModal from "../components/FilterModal";
import { LoadingSpinner } from "../components";
import { BADGE_COLORS } from "../constants/colors";
import { COLORS } from "../constants";

const DescargasHojeScreen = ({ navigation }) => {
  const { state } = useApp();
  const {
    data,
    loading,
    lastUpdate,
    error,
    refresh,
    filtroServico,
    setFiltroServico,
    filtroOpPadrao,
    setFiltroOpPadrao,
    applyFiltersAndRefresh,
  } = useVehicleData("descargas_hoje");

  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleFilterPress = useCallback(() => {
    setFilterModalVisible(true);
  }, []);

  const handleFilterApply = useCallback(
    (newFiltroServico, newFiltroOpPadrao) => {
      applyFiltersAndRefresh(newFiltroServico, newFiltroOpPadrao);
    },
    [applyFiltersAndRefresh]
  );

  const summaryItems = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [
        { label: "Veículos", value: "0" },
        { label: "Grupos", value: "0" },
        { label: "Peso Total", value: "0kg" },
      ];
    }

    const totalVehicles = data.reduce((sum, item) => {
      return sum + parseInt(item.d_veiculos || item.veiculos || 0);
    }, 0);

    const totalGroups = data.length;

    const totalWeight = data.reduce((sum, item) => {
      return sum + parseFloat(item.d_peso || item.peso || 0);
    }, 0);

    const formatWeight = (weight) => {
      if (weight >= 1000) {
        return `${(weight / 1000).toFixed(1)}t`;
      }
      return `${weight.toLocaleString("pt-BR")}kg`;
    };

    return [
      { label: "Veículos", value: totalVehicles.toString() },
      { label: "Grupos", value: totalGroups.toString() },
      { label: "Peso Total", value: formatWeight(totalWeight) },
    ];
  }, [data]);

  const getAdditionalFields = useCallback((item) => {
    const fields = [];

    if (item.d_fila) {
      fields.push({ label: "Fila:", value: item.d_fila });
    }

    if (item.d_data) {
      const dataFormatada = new Date(item.d_data).toLocaleDateString("pt-BR");
      fields.push({ label: "Data:", value: dataFormatada });
    }

    if (item.d_hora) {
      const horaFormatada = item.d_hora.substring(0, 8);
      fields.push({ label: "Hora:", value: horaFormatada });
    }

    return fields;
  }, []);

  const normalizeItem = useCallback((item) => {
    return {
      grupo: item.d_grupo || item.grupo || "N/A",
      fila: item.d_fila || item.fila || null,
      produto: item.d_produto || item.produto || "Não informado",
      peso: parseFloat(item.d_peso || item.peso || 0),
      veiculos: parseInt(item.d_veiculos || item.veiculos || 0),
    };
  }, []);

  const renderItem = useCallback(
    ({ item }) => {
      const normalizedItem = normalizeItem(item);
      const additionalFields = getAdditionalFields(item);

      return (
        <VehicleCard
          item={normalizedItem}
          badgeColor={BADGE_COLORS.descargasHoje}
          additionalFields={additionalFields}
        />
      );
    },
    [normalizeItem, getAdditionalFields]
  );

  const renderListHeader = useCallback(() => {
    return (
      <View>
        <UpdateBanner
          lastUpdate={lastUpdate}
          onFilterPress={handleFilterPress}
          showFilterButton={true}
        />
        <SummaryCard items={summaryItems} />
      </View>
    );
  }, [lastUpdate, handleFilterPress, summaryItems]);

  const renderEmptyComponent = useCallback(() => {
    if (error) {
      return (
        <EmptyView
          icon="📤"
          message="Erro ao carregar descargas"
          subMessage={error}
          actionText="Tentar novamente"
          onActionPress={refresh}
        />
      );
    }

    return (
      <EmptyView
        icon="📤"
        message="Nenhuma descarga realizada hoje"
        subMessage="Puxe para baixo para atualizar"
      />
    );
  }, [error, refresh]);

  const keyExtractor = useCallback((item, index) => {
    return (
      item.d_grupo || item.grupo || item.d_fila || item.fila || index.toString()
    );
  }, []);

  if (loading && (!data || data.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Descargas de Hoje"
          subtitle={`Filial: ${state.selectedFilial}`}
          onBackPress={() => navigation.goBack()}
          showBackButton={true}
        />
        <LoadingSpinner text="Carregando descargas..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Descargas de Hoje"
        subtitle={`Filial: ${state.selectedFilial}`}
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
      />

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderListHeader}
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

      {filtroServico &&
        setFiltroServico &&
        filtroOpPadrao &&
        setFiltroOpPadrao && (
          <FilterModal
            visible={filterModalVisible}
            onClose={() => setFilterModalVisible(false)}
            filtroServico={filtroServico}
            setFiltroServico={setFiltroServico}
            filtroOpPadrao={filtroOpPadrao}
            setFiltroOpPadrao={setFiltroOpPadrao}
            onApply={handleFilterApply}
          />
        )}
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

export default DescargasHojeScreen;
