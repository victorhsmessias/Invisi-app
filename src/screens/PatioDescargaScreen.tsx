import React, { useState, useCallback, useMemo } from "react";
import { View, SectionList, RefreshControl, StyleSheet } from "react-native";
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
  LocationHeader,
} from "../components";
import { SERVICO_OPTIONS, OP_PADRAO_OPTIONS } from "../constants/filters";
import { BADGE_COLORS } from "../constants/colors";
import { COLORS } from "../constants";

interface VehicleItem {
  pd_filial?: string;
  pd_fila?: string | number;
  pd_grupo?: string;
  pd_produto?: string;
  pd_local_desc?: string;
  pd_veiculos?: number;
  pd_peso?: number;
  grupo?: string;
  fila?: string | number;
  produto?: string;
  local_desc?: string;
  veiculos?: number;
  peso?: number;
}

interface SectionData {
  title: string;
  data: VehicleItem[];
  vehicleCount: number;
  totalWeight: number;
}

const PatioDescargaScreen = ({ navigation }) => {
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
    "monitor_patio_desc_local",
    state.selectedFilial,
    apiFilters
  );

  const groupedDataByLocation = useMemo(() => {
    if (!data || data.length === 0) return [];

    const grouped = data.reduce((acc, item) => {
      const location = item.pd_local_desc || item.local_desc || "SEM LOCAL";

      if (!acc[location]) {
        acc[location] = [];
      }
      acc[location].push(item);
      return acc;
    }, {} as Record<string, VehicleItem[]>);

    const sections: SectionData[] = Object.keys(grouped)
      .sort((a, b) => {
        if (a === "SEM LOCAL") return 1;
        if (b === "SEM LOCAL") return -1;
        return a.localeCompare(b);
      })
      .map((location) => {
        const vehicles = grouped[location];

        const vehicleCount = vehicles.reduce((sum, item) => {
          return sum + (item.pd_veiculos || item.veiculos || 0);
        }, 0);

        const totalWeight = vehicles.reduce((sum, item) => {
          return sum + (item.pd_peso || item.peso || 0);
        }, 0);

        return {
          title: location,
          data: vehicles,
          vehicleCount,
          totalWeight,
        };
      });

    return sections;
  }, [data]);

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
        value: groupedDataByLocation.length || 0,
        label: "Locais",
      },
      {
        value: formatWeight(totals.peso || 0),
        label: "Peso Total",
      },
    ];
  }, [totals, groupedDataByLocation.length, formatWeight]);

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionData }) => (
      <LocationHeader
        location={section.title}
        vehicleCount={section.vehicleCount}
        totalWeight={section.totalWeight}
      />
    ),
    []
  );

  const renderItem = useCallback(({ item }: { item: VehicleItem }) => {
    return (
      <VehicleCard
        item={{
          grupo: item.pd_grupo || item.grupo || "N/A",
          fila: item.pd_fila || item.fila || "N/A",
          produto: item.pd_produto || item.produto || "Não informado",
          peso: parseFloat(String(item.pd_peso || item.peso || 0)),
          veiculos: parseInt(String(item.pd_veiculos || item.veiculos || 0)),
        }}
        badgeColor={BADGE_COLORS.patioDescarga}
      />
    );
  }, []);

  const keyExtractor = useCallback((item: VehicleItem, index: number) => {
    const grupo = item.pd_grupo || item.grupo || "";
    const fila = item.pd_fila || item.fila || "";
    const produto = item.pd_produto || item.produto || item.tp_prod || "";
    const local = item.pd_local_desc || item.local_desc || "";

    if (grupo && produto && local) {
      return `${local}-${grupo}-${produto}-${index}`;
    }
    if (fila && produto && local) {
      return `${local}-${fila}-${produto}-${index}`;
    }
    return `item-${index}`;
  }, []);

  const renderSectionFooter = useCallback(() => {
    return <View style={styles.sectionFooter} />;
  }, []);

  const renderListHeader = useCallback(() => {
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

  const renderEmptyComponent = useCallback(() => {
    if (loading) {
      return (
        <EmptyView
          icon="cube-outline"
          message="Carregando pátio de descarga..."
        />
      );
    }
    return (
      <EmptyView
        icon="cube-outline"
        message={error || "Nenhum veículo descarregando"}
        subMessage="Puxe para baixo para atualizar"
      />
    );
  }, [error, loading]);

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

      <SectionList
        sections={groupedDataByLocation}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
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
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyComponent}
        stickySectionHeadersEnabled={true}
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        windowSize={8}
        initialNumToRender={6}
        updateCellsBatchingPeriod={50}
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
  sectionFooter: {
    height: 8,
  },
});

export default PatioDescargaScreen;
