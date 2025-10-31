import type { StackScreenProps } from "@react-navigation/stack";
import type { RootStackParamList } from "../types";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, FlatList, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import {
  Header,
  VehicleListCard,
  SummaryCard,
  EmptyView,
  LoadingSpinner,
  ErrorMessage,
  UpdateBanner,
  BackgroundLoadingIndicator,
} from "../components";
import { BADGE_COLORS } from "../constants/colors";
import { COLORS } from "../constants";
import apiService from "../services/apiService";
import type { Filial } from "../constants/api";

type Props = StackScreenProps<RootStackParamList, "FilaDescargaDetalhes">;

interface VehicleItem {
  lfd_filial: string;
  lfd_fila: string;
  lfd_ordem: number;
  lfd_contrato: string | null;
  lfd_veiculo: string;
  lfd_peso: number;
  lfd_data: string;
  lfd_hora: string;
}

const FilaDescargaDetalhesScreen: React.FC<Props> = ({ navigation, route }) => {
  const { state } = useApp();
  const { fila, grupo, produto } = route.params;

  const [data, setData] = useState<VehicleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const isRequestInProgress = useRef(false);

  const formatWeight = useCallback((weight: number) => {
    if (weight >= 1000) {
      return `${(weight / 1000).toFixed(1)}t`;
    }
    return `${weight.toLocaleString("pt-BR")}kg`;
  }, []);

  const calculateTotals = useCallback((vehicles: VehicleItem[]) => {
    if (!vehicles || vehicles.length === 0) {
      return { veiculos: 0, peso: 0 };
    }

    const totalPeso = vehicles.reduce((acc, item) => {
      return acc + (item.lfd_peso || 0);
    }, 0);

    return {
      veiculos: vehicles.length,
      peso: totalPeso,
    };
  }, []);

  const totals = calculateTotals(data);

  const summaryItems = React.useMemo(() => {
    return [
      {
        value: totals.veiculos || 0,
        label: "Veículos",
      },
      {
        value: formatWeight(totals.peso || 0),
        label: "Peso Total",
      },
    ];
  }, [totals, formatWeight]);

  const fetchData = useCallback(
    async (isRefreshing = false): Promise<void> => {
      if (isRequestInProgress.current) {
        return;
      }

      try {
        isRequestInProgress.current = true;

        if (isRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const response = await apiService.getFilaDescargaVeiculosLista(
          state.selectedFilial as Filial,
          fila
        );

        const vehiclesList =
          response?.dados?.listaFilaDescarga?.filaDescargaVeiculos || [];

        setData(vehiclesList);
        setLastUpdate(new Date());
      } catch (err: any) {
        console.error(
          "[FilaDescargaDetalhesScreen] Error fetching vehicles:",
          err
        );
        setError(err?.message || "Erro ao carregar veículos. Tente novamente.");
        setData([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
        isRequestInProgress.current = false;
      }
    },
    [state.selectedFilial, fila]
  );

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderHeader = useCallback(() => {
    return (
      <>
        <UpdateBanner lastUpdate={lastUpdate || new Date()} />
        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Grupo:</Text>
              <Text style={styles.infoValue}>{grupo}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Produto:</Text>
              <Text style={styles.infoValue}>{produto}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Fila:</Text>
              <Text style={styles.infoValue}>{fila}</Text>
            </View>
          </View>
        </View>
        <SummaryCard items={summaryItems} />
      </>
    );
  }, [grupo, produto, fila, summaryItems, lastUpdate]);

  const renderItem = useCallback(({ item }: { item: VehicleItem }) => {
    return (
      <VehicleListCard
        item={{
          ordem: item.lfd_ordem,
          veiculo: item.lfd_veiculo,
          peso: item.lfd_peso,
          data: item.lfd_data,
          hora: item.lfd_hora,
          contrato: item.lfd_contrato,
        }}
        badgeColor={BADGE_COLORS.filaDescarga}
      />
    );
  }, []);

  const keyExtractor = useCallback((item: VehicleItem, index: number) => {
    return `${item.lfd_veiculo}-${item.lfd_ordem}-${index}`;
  }, []);

  const renderEmptyComponent = useCallback(() => {
    if (loading) {
      return <EmptyView icon="car-outline" message="Carregando veículos..." />;
    }
    return (
      <EmptyView
        icon="car-outline"
        message={error || "Nenhum veículo encontrado nesta fila"}
        subMessage="Puxe para baixo para atualizar"
      />
    );
  }, [error, loading]);

  if (loading && (!data || data.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Veículos da Fila"
          subtitle={`Filial: ${state.selectedFilial}`}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <LoadingSpinner text="Carregando veículos..." />
      </SafeAreaView>
    );
  }

  if (error && (!data || data.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Veículos da Fila"
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
        title="Veículos da Fila"
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
        initialNumToRender={8}
        updateCellsBatchingPeriod={50}
        getItemLayout={(data, index) => ({
          length: 150,
          offset: 150 * index,
          index,
        })}
      />

      <BackgroundLoadingIndicator
        visible={loading && data && data.length > 0}
        text="Atualizando lista de veículos..."
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
  infoContainer: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 5,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: "600",
  },
});

export default FilaDescargaDetalhesScreen;
