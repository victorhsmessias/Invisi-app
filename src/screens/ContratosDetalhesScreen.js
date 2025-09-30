import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  FlatList,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import {
  LoadingSpinner,
  ErrorMessage,
  BackgroundLoadingIndicator,
  HeaderLoadingIndicator,
} from "../components";
import useAutoRefresh from "../hooks/useAutoRefresh";
import { COLORS, SCREEN_NAMES } from "../constants";
import {
  formatPeso,
  formatPercentual,
  formatNumber,
} from "../utils/formatters";
import apiService from "../services/apiService";

const ContratosDetalhesScreen = ({ navigation, route }) => {
  const { state } = useApp();
  const { fila, grupo, produto, filial, dadosCorte } = route.params;

  const [data, setData] = useState([]);
  const [cortesData, setCortesData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const { updateActivity } = useAutoRefresh(fetchContratosDetalhes, {
    enabled: true,
    interval: 45000,
    pauseOnBackground: true,
    adaptiveInterval: true,
  });

  const fetchContratosDetalhes = useCallback(
    async (loadingType = "background") => {
      if (!filial || !fila || !grupo || !produto) return;

      try {
        if (loadingType === "manual") {
          setRefreshing(true);
        } else if (loadingType === "initial") {
          setLoading(true);
        }

        const response = await apiService.getContratosFilaData(
          filial,
          fila,
          grupo,
          produto,
          dadosCorte
        );

        if (response.dados?.listaCortes) {
          const cortes = response.dados.listaCortes;

          setCortesData(cortes.CortesFila);

          setData(cortes.Contratos || []);
          setLastUpdate(new Date());
        } else {
          setData([]);
          setCortesData(null);
          setError("Nenhum contrato encontrado para esta fila");
          return;
        }
      } catch (err) {
        console.error("[ContratosDetalhesScreen] Error:", err);
        setError("Erro ao carregar detalhes dos contratos");
        return;
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filial, fila, grupo, produto, dadosCorte]
  );

  useEffect(() => {
    fetchContratosDetalhes("initial");
  }, [fetchContratosDetalhes]);

  const onRefresh = useCallback(async () => {
    updateActivity();
    await fetchContratosDetalhes("manual");
  }, [fetchContratosDetalhes, updateActivity]);

  const ContratoIndividualCard = React.memo(({ item }) => (
    <View style={styles.contratoCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.contratoText}>Contrato {item.contrato}</Text>
      </View>

      <View style={styles.cardContent}>
        <InfoRow label="Peso Origem:" value={formatPeso(item.peso_origem)} />
        <InfoRow
          label="Peso Descarga:"
          value={formatPeso(item.peso_descarga)}
        />
        <InfoRow label="Peso Carga:" value={formatPeso(item.peso_carga)} />

        <View style={styles.separator} />

        <InfoRow
          label="Saldo Físico:"
          value={`${
            parseFloat(item.saldo_fisico) >= 0 ? "+" : ""
          }${formatNumber(item.saldo_fisico)}kg`}
          isBalance
          balanceValue={parseFloat(item.saldo_fisico)}
        />
        <InfoRow
          label="Saldo Contábil:"
          value={`${
            parseFloat(item.saldo_contabil) >= 0 ? "+" : ""
          }${formatNumber(item.saldo_contabil)}kg`}
          isBalance
          balanceValue={parseFloat(item.saldo_contabil)}
        />
      </View>
    </View>
  ));

  const InfoRow = React.memo(
    ({
      label,
      value,
      isPercentage,
      percentageValue,
      isBalance,
      balanceValue,
    }) => (
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text
          style={[
            styles.infoValue,
            isPercentage &&
              (percentageValue < 0
                ? styles.negativeValue
                : styles.positiveValue),
            isBalance &&
              (balanceValue < 0
                ? styles.negativeValue
                : balanceValue > 0
                ? styles.positiveValue
                : styles.neutralValue),
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {value}
        </Text>
      </View>
    )
  );

  const renderHeader = useCallback(() => {
    const totals = data.reduce(
      (acc, item) => {
        const pesoOrigem = parseFloat(item.peso_origem || 0);
        const saldoFisico = parseFloat(item.saldo_fisico || 0);
        const saldoContabil = parseFloat(item.saldo_contabil || 0);

        return {
          totalContratos: acc.totalContratos + 1,
          totalPesoOrigem: acc.totalPesoOrigem + pesoOrigem,
          totalSaldoFisico: acc.totalSaldoFisico + saldoFisico,
          totalSaldoContabil: acc.totalSaldoContabil + saldoContabil,
        };
      },
      {
        totalContratos: 0,
        totalPesoOrigem: 0,
        totalSaldoFisico: 0,
        totalSaldoContabil: 0,
      }
    );

    const formatWeight = (weight) => {
      if (Math.abs(weight) >= 1000) {
        return `${(weight / 1000).toFixed(1)}t`;
      }
      return `${weight.toLocaleString()}kg`;
    };

    return (
      <View>
        <View style={styles.groupInfoContainer}>
          <Text style={styles.groupName}>{grupo}</Text>
          <Text style={styles.filaText}>Fila {fila}</Text>
          {produto && <Text style={styles.productName}>{produto}</Text>}
        </View>
      </View>
    );
  }, [lastUpdate, data, cortesData, grupo, fila, produto]);

  const renderEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyText}>
          {error || "Nenhum contrato individual encontrado"}
        </Text>
        <Text style={styles.emptySubtext}>Puxe para baixo para atualizar</Text>
      </View>
    ),
    [error]
  );

  if (loading && data.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Contratos da Fila</Text>
          </View>
          <View style={styles.headerRight} />
        </View>
        <LoadingSpinner text="Carregando contratos..." />
      </SafeAreaView>
    );
  }

  if (error && data.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Contratos da Fila</Text>
          </View>
          <View style={styles.headerRight} />
        </View>
        <ErrorMessage
          message={error}
          onRetry={() => fetchContratosDetalhes("initial")}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate(SCREEN_NAMES.MONITOR_CORTE)}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Contratos da Fila</Text>
          <Text style={styles.headerSubtitle}>Filial: {filial}</Text>
        </View>

        <View style={styles.headerRight}>
          <HeaderLoadingIndicator visible={loading} />
        </View>
      </View>

      <FlatList
        data={data}
        renderItem={({ item }) => <ContratoIndividualCard item={item} />}
        keyExtractor={(item, index) =>
          `${item.contrato || "no-contrato"}-${
            item.grupo || "no-grupo"
          }-idx-${index}`
        }
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

      <BackgroundLoadingIndicator
        visible={loading && data.length > 0}
        text="Atualizando contratos..."
        position="top"
      />
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
  groupInfoContainer: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 5,
    marginBottom: 10,
    marginHorizontal: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  groupName: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "center",
  },
  filaText: {
    fontSize: 18,
    color: COLORS.white,
    marginTop: 4,
    textAlign: "center",
  },
  productName: {
    fontSize: 16,
    color: COLORS.white,
    marginTop: 4,
    textAlign: "center",
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
  contratoText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  cardContent: {
    marginTop: 5,
  },
  separator: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 8,
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
  neutralValue: {
    color: COLORS.gray,
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
});

export default ContratosDetalhesScreen;
