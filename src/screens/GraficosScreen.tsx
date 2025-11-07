import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Text as RNText,
  Modal,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Button, Divider, Card } from "react-native-paper";
import { BarChart, StackedBarChart } from "react-native-chart-kit";
import type { StackScreenProps } from "@react-navigation/stack";
import { useApp } from "../context/AppContext";
import { useChartData, type ProductData } from "../hooks/useChartData";
import { DateRangePicker } from "../components/DateRangePicker";
import { Header, LoadingSpinner, ErrorMessage } from "../components";
import { colors, spacing } from "../constants/theme";
import type { RootStackParamList } from "../types";

type GraficosScreenProps = StackScreenProps<RootStackParamList, "Graficos">;

const screenWidth = Dimensions.get("window").width;
const chartWidth = screenWidth - 48;

const chartConfig = {
  backgroundColor: colors.surface,
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 55, 110, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: "4",
    strokeWidth: "2",
    stroke: colors.primary,
  },
  barPercentage: 0.3,
  barRadius: 2,
  propsForBackgroundLines: {
    strokeWidth: 1,
    stroke: "#e3e3e3",
  },
  propsForLabels: {
    fontSize: 12,
  },
};

const GraficosScreen: React.FC<GraficosScreenProps> = ({ navigation }) => {
  const { state } = useApp();
  const { chartData, loading, error, fetchData, refreshData } = useChartData(
    state.selectedFilial
  );

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [acumuladorTipo, setAcumuladorTipo] = useState<"dia" | "mes">("dia");
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipData, setTooltipData] = useState<{
    label: string;
    products: { name: string; value: number; peso: number; color: string }[];
    total: number;
    peso: number;
    type: "descarga" | "carga";
    position: { x: number; y: number };
  } | null>(null);

  const handleDateChange = useCallback(
    (newStartDate: Date, newEndDate: Date) => {
      setStartDate(newStartDate);
      setEndDate(newEndDate);

      const daysDiff = Math.ceil(
        (newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const newAcumulador = daysDiff > 45 ? "mes" : "dia";
      setAcumuladorTipo(newAcumulador);

      fetchData({
        filtro_data_inicio: newStartDate.toISOString().split("T")[0],
        filtro_data_fim: newEndDate.toISOString().split("T")[0],
        filtro_acumulador: {
          dia: newAcumulador === "dia" ? 1 : 0,
          mes: newAcumulador === "mes" ? 1 : 0,
          ano: 0,
        },
      });
    },
    [fetchData]
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshData]);

  useEffect(() => {
    fetchData({
      filtro_data_inicio: startDate.toISOString().split("T")[0],
      filtro_data_fim: endDate.toISOString().split("T")[0],
      filtro_acumulador: {
        dia: acumuladorTipo === "dia" ? 1 : 0,
        mes: acumuladorTipo === "mes" ? 1 : 0,
        ano: 0,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedFilial]);

  const formatPeso = (peso: number): string => {
    return (peso / 1000).toFixed(1) + "t";
  };

  const renderLegend = (products: ProductData[]) => {
    if (products.length === 0) return null;

    return (
      <View style={styles.legendContainer}>
        {products.map((product, index) => (
          <View key={index} style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: product.color }]}
            />
            <Text style={styles.legendText}>{product.name}</Text>
          </View>
        ))}
      </View>
    );
  };

  interface ChartPressData {
    index?: number;
    x?: number;
    y?: number;
  }

  const handleChartPress = (
    data: ChartPressData,
    type: "descarga" | "carga"
  ) => {
    const { index, x, y } = data;
    if (index === undefined) return;

    const label = chartData.labels[index];
    const products =
      type === "descarga"
        ? chartData.descargaByProduct
        : chartData.cargaByProduct;

    const productValues = products
      .map((product) => ({
        name: product.name,
        value: product.data[index] || 0,
        peso: product.pesoData[index] || 0,
        color: product.color,
      }))
      .filter((p) => p.value > 0);

    const total =
      type === "descarga"
        ? chartData.descargaVeiculos[index]
        : chartData.cargaVeiculos[index];

    const peso =
      type === "descarga"
        ? chartData.descargaPeso[index]
        : chartData.cargaPeso[index];

    setTooltipData({
      label,
      products: productValues,
      total,
      peso,
      type,
      position: { x: x || 0, y: y || 0 },
    });
    setTooltipVisible(true);
  };

  const formatKg = (kg: number): string => {
    return kg.toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const renderTooltip = () => {
    if (!tooltipData) return null;

    // Posição do tooltip próximo ao toque
    const tooltipWidth = 240;
    const tooltipHeight = 200;
    const margin = 20;

    // Calcula posição horizontal: centraliza no ponto clicado, mas mantém dentro da tela
    let tooltipLeft = tooltipData.position.x - tooltipWidth / 2;
    tooltipLeft = Math.max(margin, Math.min(tooltipLeft, screenWidth - tooltipWidth - margin));

    // Calcula posição vertical: acima do ponto clicado, mas mantém dentro da tela
    let tooltipTop = tooltipData.position.y - tooltipHeight - 20;
    if (tooltipTop < 60) {
      // Se não couber acima, mostra abaixo
      tooltipTop = tooltipData.position.y + 20;
    }

    return (
      <Modal
        visible={tooltipVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTooltipVisible(false)}
      >
        <Pressable
          style={styles.tooltipOverlay}
          onPress={() => setTooltipVisible(false)}
        >
          <View
            style={[
              styles.tooltipFloating,
              { left: tooltipLeft, top: tooltipTop },
            ]}
          >
            <Card style={styles.tooltipCard}>
              <Card.Content>
                <Text style={styles.tooltipTitle}>
                  {tooltipData.label} -{" "}
                  {tooltipData.type === "descarga" ? "Descarga" : "Carga"}
                </Text>
                <Divider style={styles.tooltipDivider} />

                <View style={styles.tooltipSection}>
                  <Text style={styles.tooltipSectionTitle}>Por Produto:</Text>
                  {tooltipData.products.map((product, index) => (
                    <View key={index} style={styles.tooltipProductRow}>
                      <View style={styles.tooltipProductInfo}>
                        <View
                          style={[
                            styles.tooltipProductColor,
                            { backgroundColor: product.color },
                          ]}
                        />
                        <View style={styles.tooltipProductDetails}>
                          <Text style={styles.tooltipProductName}>
                            {product.name}
                          </Text>
                          <Text style={styles.tooltipProductValue}>
                            {product.value} veículos
                          </Text>
                          <Text style={styles.tooltipProductPeso}>
                            {formatKg(product.peso)} kg ({formatPeso(product.peso)})
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>

                <Divider style={styles.tooltipDivider} />

                <View style={styles.tooltipTotalSection}>
                  <View style={styles.tooltipTotalRow}>
                    <Text style={styles.tooltipTotalLabel}>
                      Total de Veículos:
                    </Text>
                    <Text style={styles.tooltipTotalValue}>
                      {tooltipData.total}
                    </Text>
                  </View>
                  <View style={styles.tooltipTotalRow}>
                    <Text style={styles.tooltipTotalLabel}>Peso Total:</Text>
                    <Text style={styles.tooltipTotalValue}>
                      {formatKg(tooltipData.peso)} kg
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          </View>
        </Pressable>
      </Modal>
    );
  };

  const hasData = chartData.labels.length > 0;

  if (loading && !hasData) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header
          title="Gráficos"
          subtitle={`Filial: ${state.selectedFilial}`}
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <LoadingSpinner text="Carregando dados dos gráficos..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title="Gráficos"
        subtitle={`Filial: ${state.selectedFilial}`}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      {renderTooltip()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onDateChange={handleDateChange}
          disabled={loading}
        />

        {error && (
          <View style={styles.errorContainer}>
            <ErrorMessage message={error} />
          </View>
        )}

        {!hasData && !loading && !error && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Nenhum dado encontrado para o período selecionado
            </Text>
          </View>
        )}

        {hasData && (
          <>
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>
                Veículos de Descarga por{" "}
                {acumuladorTipo === "dia" ? "Dia" : "Mês"}
              </Text>
              <Text style={styles.chartSubtitle}>
                Quantidade de veículos descarregados por produto
              </Text>
              {renderLegend(chartData.descargaByProduct)}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {chartData.descargaByProduct.length > 0 ? (
                  <StackedBarChart
                    data={{
                      labels: chartData.labels,
                      legend: chartData.descargaByProduct.map((p) => p.name),
                      data: chartData.labels.map((_, index) =>
                        chartData.descargaByProduct.map(
                          (p) => p.data[index] || 0
                        )
                      ),
                      barColors: chartData.descargaByProduct.map(
                        (p) => p.color
                      ),
                    }}
                    width={Math.max(chartWidth, chartData.labels.length * 60)}
                    height={240}
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(0, 55, 110, ${opacity})`,
                      barPercentage: 0.4,
                    }}
                    style={styles.chart}
                    withHorizontalLabels={true}
                    hideLegend={true}
                    showBarTops={true}
                    withVerticalLabels={true}
                    segments={5}
                    onDataPointClick={(data) =>
                      handleChartPress(data, "descarga")
                    }
                  />
                ) : (
                  <BarChart
                    data={{
                      labels: chartData.labels,
                      datasets: [
                        {
                          data:
                            chartData.descargaVeiculos.length > 0
                              ? chartData.descargaVeiculos
                              : [0],
                        },
                      ],
                    }}
                    width={Math.max(chartWidth, chartData.labels.length * 60)}
                    height={240}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={{
                      ...chartConfig,
                      barPercentage: 0.4,
                    }}
                    style={styles.chart}
                    withInnerLines={true}
                    fromZero={true}
                    showValuesOnTopOfBars={true}
                    onDataPointClick={(data) =>
                      handleChartPress(data, "descarga")
                    }
                  />
                )}
              </ScrollView>
              <View style={styles.summaryContainer}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Veículos:</Text>
                  <Text style={styles.summaryValue}>
                    {chartData.descargaVeiculos.reduce((a, b) => a + b, 0)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Peso Total:</Text>
                  <Text style={styles.summaryValue}>
                    {formatPeso(
                      chartData.descargaPeso.reduce((a, b) => a + b, 0)
                    )}
                  </Text>
                </View>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>
                Veículos de Carga por {acumuladorTipo === "dia" ? "Dia" : "Mês"}
              </Text>
              <Text style={styles.chartSubtitle}>
                Quantidade de veículos carregados por produto
              </Text>
              {renderLegend(chartData.cargaByProduct)}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {chartData.cargaByProduct.length > 0 ? (
                  <StackedBarChart
                    data={{
                      labels: chartData.labels,
                      legend: chartData.cargaByProduct.map((p) => p.name),
                      data: chartData.labels.map((_, index) =>
                        chartData.cargaByProduct.map((p) => p.data[index] || 0)
                      ),
                      barColors: chartData.cargaByProduct.map((p) => p.color),
                    }}
                    width={Math.max(chartWidth, chartData.labels.length * 60)}
                    height={240}
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
                      barPercentage: 0.5,
                    }}
                    style={styles.chart}
                    withHorizontalLabels={true}
                    hideLegend={true}
                    showBarTops={true}
                    withVerticalLabels={true}
                    segments={5}
                    onDataPointClick={(data) => handleChartPress(data, "carga")}
                  />
                ) : (
                  <BarChart
                    data={{
                      labels: chartData.labels,
                      datasets: [
                        {
                          data:
                            chartData.cargaVeiculos.length > 0
                              ? chartData.cargaVeiculos
                              : [0],
                        },
                      ],
                    }}
                    width={Math.max(chartWidth, chartData.labels.length * 60)}
                    height={240}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
                      barPercentage: 0.5,
                    }}
                    style={styles.chart}
                    withInnerLines={true}
                    fromZero={true}
                    showValuesOnTopOfBars={true}
                    onDataPointClick={(data) => handleChartPress(data, "carga")}
                  />
                )}
              </ScrollView>
              <View style={styles.summaryContainer}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Veículos:</Text>
                  <Text style={styles.summaryValue}>
                    {chartData.cargaVeiculos.reduce((a, b) => a + b, 0)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Peso Total:</Text>
                  <Text style={styles.summaryValue}>
                    {formatPeso(chartData.cargaPeso.reduce((a, b) => a + b, 0))}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  chartContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  chartSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: 12,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
  },
  divider: {
    marginVertical: spacing.lg,
    backgroundColor: colors.border,
  },
  errorContainer: {
    marginBottom: spacing.md,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
  infoContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.md,
    marginBottom: spacing.xs,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 3,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legendText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "500",
  },
  tooltipOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  tooltipFloating: {
    position: "absolute",
    width: 240,
    maxWidth: screenWidth - 40,
  },
  tooltipCard: {
    backgroundColor: colors.surface,
    elevation: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  tooltipDivider: {
    marginVertical: spacing.sm,
    backgroundColor: colors.border,
  },
  tooltipSection: {
    marginVertical: spacing.sm,
  },
  tooltipSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tooltipProductRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  tooltipProductInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  tooltipProductDetails: {
    flex: 1,
  },
  tooltipProductColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tooltipProductName: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  tooltipProductValue: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    marginTop: 2,
  },
  tooltipProductPeso: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tooltipTotalSection: {
    marginTop: spacing.sm,
  },
  tooltipTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  tooltipTotalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  tooltipTotalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  tooltipCloseButton: {
    marginTop: spacing.md,
  },
});

export default GraficosScreen;
