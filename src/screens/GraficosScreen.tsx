import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Divider, Card } from "react-native-paper";
import { BarChart } from "react-native-gifted-charts";
import type { StackScreenProps } from "@react-navigation/stack";
import { useApp } from "../context/AppContext";
import { useChartData, type ProductData } from "../hooks/useChartData";
import { DateRangePicker } from "../components/DateRangePicker";
import { Header, LoadingSpinner, ErrorMessage, SideMenu } from "../components";
import BackgroundLoadingIndicator from "../components/BackgroundLoadingIndicator";
import { colors, spacing } from "../constants/theme";
import type { RootStackParamList } from "../types";

type GraficosScreenProps = StackScreenProps<RootStackParamList, "Graficos">;

const screenWidth = Dimensions.get("window").width;
const chartWidth = screenWidth - 80;

// Converte Date para string YYYY-MM-DD sem problemas de timezone
const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatPeso = (peso: number): string => {
  return (peso / 1000).toFixed(1) + "t";
};

const formatKg = (kg: number): string => {
  return kg.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
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
  } | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

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
        filtro_data_inicio: formatDateToString(newStartDate),
        filtro_data_fim: formatDateToString(newEndDate),
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
      filtro_data_inicio: formatDateToString(startDate),
      filtro_data_fim: formatDateToString(endDate),
      filtro_acumulador: {
        dia: acumuladorTipo === "dia" ? 1 : 0,
        mes: acumuladorTipo === "mes" ? 1 : 0,
        ano: 0,
      },
    });
  }, [state.selectedFilial, fetchData, startDate, endDate, acumuladorTipo]);

  const renderLegend = useCallback((products: ProductData[]) => {
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
  }, []);

  const handleBarPress = useCallback(
    (index: number, type: "descarga" | "carga") => {
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
      });
      setTooltipVisible(true);
    },
    [chartData]
  );

  const renderTooltip = useCallback(() => {
    if (!tooltipData) return null;

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
          <Pressable
            style={styles.tooltipContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <Card style={styles.tooltipCard}>
              <Card.Content>
                <View style={styles.tooltipHeader}>
                  <Text style={styles.tooltipTitle}>
                    {tooltipData.label} -{" "}
                    {tooltipData.type === "descarga" ? "Descarga" : "Carga"}
                  </Text>
                  <Pressable
                    onPress={() => setTooltipVisible(false)}
                    style={styles.closeButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </Pressable>
                </View>
                <Divider style={styles.tooltipDivider} />

                {tooltipData.products.length > 0 && (
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
                              {formatKg(product.peso)} kg (
                              {formatPeso(product.peso)})
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

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
          </Pressable>
        </Pressable>
      </Modal>
    );
  }, [tooltipData, tooltipVisible]);

  const convertToStackData = useCallback(
    (labels: string[], products: ProductData[], type: "descarga" | "carga") => {
      return labels.map((label, index) => {
        const stacks = products
          .map((product) => ({
            value: product.data[index] || 0,
            color: product.color,
            label: product.name,
            peso: product.pesoData[index] || 0,
          }))
          .filter((stack) => stack.value > 0);

        return {
          stacks: stacks.length > 0 ? stacks : [{ value: 0, color: "#E0E0E0" }],
          label: label,
          onPress: () => handleBarPress(index, type),
        };
      });
    },
    [handleBarPress]
  );

  const descargaStackData = useMemo(
    () =>
      convertToStackData(
        chartData.labels,
        chartData.descargaByProduct,
        "descarga"
      ),
    [chartData.labels, chartData.descargaByProduct, convertToStackData]
  );

  const cargaStackData = useMemo(
    () =>
      convertToStackData(chartData.labels, chartData.cargaByProduct, "carga"),
    [chartData.labels, chartData.cargaByProduct, convertToStackData]
  );

  const descargaMaxValue = useMemo(() => {
    const max =
      chartData.descargaVeiculos.length > 0
        ? Math.max(...chartData.descargaVeiculos)
        : 0;
    return max > 0 ? max * 1.1 : 10;
  }, [chartData.descargaVeiculos]);

  const cargaMaxValue = useMemo(() => {
    const max =
      chartData.cargaVeiculos.length > 0
        ? Math.max(...chartData.cargaVeiculos)
        : 0;
    return max > 0 ? max * 1.1 : 10;
  }, [chartData.cargaVeiculos]);

  const hasData = chartData.labels.length > 0;

  if (loading && !hasData) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header
          title="Gráficos"
          subtitle={`Filial: ${state.selectedFilial}`}
          onMenuPress={() => setMenuVisible(true)}
          showRefreshButton={false}
          showLoadingIndicator={true}
        />
        <SideMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          navigation={navigation}
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
        onMenuPress={() => setMenuVisible(true)}
        onRefreshPress={onRefresh}
        isRefreshing={isRefreshing}
        showRefreshButton={true}
        showLoadingIndicator={loading}
      />

      <SideMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        navigation={navigation}
      />

      {renderTooltip()}

      <BackgroundLoadingIndicator
        visible={loading && hasData}
        text="Atualizando dados..."
        variant="discrete"
        autoHide={false}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chartScrollView}
                contentContainerStyle={{ paddingRight: 10 }}
                key={`descarga-${chartData.labels.join('-')}`}
              >
                <BarChart
                  key={`descarga-chart-${chartData.labels.join('-')}`}
                  data={descargaStackData}
                  width={
                    chartData.labels.length *
                      (chartData.labels.length > 15 ? 38 : 53) +
                    50
                  }
                  height={240}
                  barWidth={chartData.labels.length > 15 ? 20 : 28}
                  spacing={chartData.labels.length > 15 ? 18 : 25}
                  stackData={descargaStackData}
                  barBorderRadius={4}
                  xAxisThickness={1}
                  yAxisThickness={1}
                  yAxisTextStyle={{ color: colors.textSecondary, fontSize: 11 }}
                  xAxisLabelTextStyle={{ color: colors.text, fontSize: 11 }}
                  noOfSections={5}
                  maxValue={descargaMaxValue}
                  isAnimated
                  animationDuration={500}
                  initialSpacing={10}
                  endSpacing={0}
                />
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
                    {formatKg(
                      chartData.descargaPeso.reduce((a, b) => a + b, 0)
                    )}{" "}
                    kg
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

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chartScrollView}
                contentContainerStyle={{ paddingRight: 10 }}
                key={`carga-${chartData.labels.join('-')}`}
              >
                <BarChart
                  key={`carga-chart-${chartData.labels.join('-')}`}
                  data={cargaStackData}
                  width={
                    chartData.labels.length *
                      (chartData.labels.length > 15 ? 38 : 53) +
                    50
                  }
                  height={240}
                  barWidth={chartData.labels.length > 15 ? 20 : 28}
                  spacing={chartData.labels.length > 15 ? 18 : 25}
                  stackData={cargaStackData}
                  barBorderRadius={4}
                  xAxisThickness={1}
                  yAxisThickness={1}
                  yAxisTextStyle={{ color: colors.textSecondary, fontSize: 11 }}
                  xAxisLabelTextStyle={{ color: colors.text, fontSize: 11 }}
                  noOfSections={5}
                  maxValue={cargaMaxValue}
                  isAnimated
                  animationDuration={500}
                  initialSpacing={10}
                  endSpacing={0}
                />
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
                    {formatKg(chartData.cargaPeso.reduce((a, b) => a + b, 0))}{" "}
                    kg
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
  chartScrollView: {
    marginVertical: spacing.md,
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  tooltipContainer: {
    width: screenWidth - 80,
    maxWidth: 400,
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
  tooltipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    paddingRight: spacing.sm,
  },
  closeButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 20,
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
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tooltipProductName: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    fontWeight: "600",
  },
  tooltipProductValue: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
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
});

export default GraficosScreen;
