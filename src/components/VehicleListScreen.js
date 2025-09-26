import React, { useState, useCallback, useMemo } from "react";
import {
  FlatList,
  RefreshControl,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import BaseScreen from "./BaseScreen";
import { LoadingSpinner, ErrorMessage } from "./index";
import FilterModal from "./FilterModal";
import { COLORS } from "../constants";
import { formatDateTime } from "../utils/formatters";

// Componente de Card de Veículo otimizado
const VehicleCard = React.memo(({ item, fields }) => {
  // Função para obter valor do item com fallbacks
  const getValue = (key) => {
    if (typeof key === "function") return key(item);
    return (
      item[key] || item[key.toLowerCase()] || item[key.toUpperCase()] || "N/A"
    );
  };

  // Detectar qual prefixo usar baseado nos dados disponíveis
  const detectPrefix = () => {
    // Verificar se é dados de contratos (CortesFila)
    if (item.fila && item.grupo && item.prod) {
      return "contratos";
    }

    const prefixes = ["t_", "fd_", "pd_", "pc_", "fc_", "c_", "d_"];
    for (const prefix of prefixes) {
      if (
        item[`${prefix}grupo`] ||
        item[`${prefix}veiculos`] ||
        item[`${prefix}peso`]
      ) {
        return prefix;
      }
    }
    return null;
  };

  const prefix = detectPrefix();

  // Identificador do veículo usando o prefixo correto
  const vehicleId = (() => {
    if (prefix === "contratos") {
      return getValue("grupo") || "N/A";
    }
    if (prefix) {
      return getValue(`${prefix}grupo`) || getValue("veiculo") || "N/A";
    }
    return getValue("veiculo") || getValue("grupo") || "N/A";
  })();

  // Obter quantidade de veículos usando o prefixo correto
  const vehicleCount = (() => {
    if (prefix === "contratos") {
      // Para contratos, somar veículos de descarga e carga
      const descarga = parseInt(getValue("veiculos_descarga") || 0);
      const carga = parseInt(getValue("veiculos_carga") || 0);
      return Math.max(descarga, carga);
    }
    if (prefix) {
      return getValue(`${prefix}veiculos`);
    }
    return getValue("veiculos") || getValue("quantidade") || "N/A";
  })();

  return (
    <View style={styles.vehicleCard}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.vehicleId}>{vehicleId}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{vehicleCount} veículos</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        {fields.map((field) => {
          const value = field.format
            ? field.format(getValue(field.key))
            : getValue(field.key);
          return (
            <VehicleInfoRow key={field.key} label={field.label} value={value} />
          );
        })}
      </View>
    </View>
  );
});

// Componente de linha de informação reutilizável
const VehicleInfoRow = React.memo(({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
      {value || "N/A"}
    </Text>
  </View>
));

// Componente de header da lista
const ListHeader = React.memo(
  ({ title, count, lastUpdate, data, onFilterPress }) => {
    // Calcular totais agregados dos dados
    const totals = React.useMemo(() => {
      if (!data || !Array.isArray(data) || data.length === 0) {
        return { totalVehicles: 0, totalGroups: 0, totalWeight: 0 };
      }

      const totalVehicles = data.reduce((sum, item) => {
        // Verificar se é dados de contratos
        if (item.fila && item.grupo && item.prod) {
          const descarga = parseInt(item.veiculos_descarga || 0);
          const carga = parseInt(item.veiculos_carga || 0);
          return sum + Math.max(descarga, carga);
        }

        // Detectar automaticamente qual prefixo usar para cada item
        const prefixes = ["t_", "fd_", "pd_", "pc_", "fc_", "c_", "d_"];
        let vehicles = 0;

        for (const prefix of prefixes) {
          if (item[`${prefix}veiculos`]) {
            vehicles = parseInt(item[`${prefix}veiculos`] || 0);
            break;
          }
        }

        // Fallback para campos sem prefixo
        if (vehicles === 0) {
          vehicles = parseInt(item.veiculos || item.quantidade || 0);
        }

        return sum + vehicles;
      }, 0);

      const totalGroups = data.length;

      const totalWeight = data.reduce((sum, item) => {
        // Verificar se é dados de contratos
        if (item.fila && item.grupo && item.prod) {
          return sum + parseFloat(item.peso_origem || 0);
        }

        // Detectar automaticamente qual prefixo usar para cada item
        const prefixes = ["t_", "fd_", "pd_", "pc_", "fc_", "c_", "d_"];
        let weight = 0;

        for (const prefix of prefixes) {
          if (item[`${prefix}peso`]) {
            weight = parseFloat(item[`${prefix}peso`] || 0);
            break;
          }
        }

        // Fallback para campos sem prefixo
        if (weight === 0) {
          weight = parseFloat(item.peso || item.weight || 0);
        }

        return sum + weight;
      }, 0);

      return { totalVehicles, totalGroups, totalWeight };
    }, [data]);

    // Formatar peso em toneladas se for muito grande
    const formatWeight = (weight) => {
      if (weight >= 1000) {
        return `${(weight / 1000).toFixed(1)}t`;
      }
      return `${weight.toLocaleString()}kg`;
    };

    return (
      <View>
        {lastUpdate && (
          <View style={styles.updateContainer}>
            <View style={styles.updateRow}>
              <Text style={styles.updateText}>
                Atualizado:{" "}
                {lastUpdate.toLocaleTimeString("pt-BR").substring(0, 5)}
              </Text>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={onFilterPress}
              >
                <Text style={styles.filterButtonText}>Filtros</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totals.totalVehicles}</Text>
            <Text style={styles.summaryLabel}>Veículos</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totals.totalGroups}</Text>
            <Text style={styles.summaryLabel}>Grupos</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {formatWeight(totals.totalWeight)}
            </Text>
            <Text style={styles.summaryLabel}>Peso Total</Text>
          </View>
        </View>
      </View>
    );
  }
);

const VehicleListScreen = ({
  navigation,
  title,
  subtitle,
  data = [],
  loading,
  error,
  lastUpdate,
  onRefresh,
  onApplyFilters,
  fields,
  emptyMessage = "Nenhum veículo encontrado",
  emptyIcon = "🚛",
  filtroServico,
  setFiltroServico,
  filtroOpPadrao,
  setFiltroOpPadrao,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  const handleFilterPress = useCallback(() => {
    setFilterModalVisible(true);
  }, []);

  const handleFilterApply = useCallback((newFiltroServico, newFiltroOpPadrao) => {
    if (__DEV__) {
      console.log(
        "[VehicleListScreen] Filter apply triggered with specific filters:",
        { newFiltroServico, newFiltroOpPadrao }
      );
    }

    // Usar onApplyFilters se disponível, senão fallback para onRefresh
    if (onApplyFilters) {
      onApplyFilters(newFiltroServico, newFiltroOpPadrao);
    } else if (onRefresh) {
      // Fallback para comportamento antigo
      onRefresh();
    }
  }, [onApplyFilters, onRefresh]);

  const renderItem = useCallback(
    ({ item }) => <VehicleCard item={item} fields={fields} />,
    [fields]
  );

  const renderHeader = useCallback(
    () => (
      <ListHeader
        title={title}
        count={Array.isArray(data) ? data.length : 0}
        lastUpdate={lastUpdate}
        data={data}
        onFilterPress={handleFilterPress}
      />
    ),
    [title, data, lastUpdate, handleFilterPress]
  );

  const renderEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>{emptyIcon}</Text>
        <Text style={styles.emptyText}>{error || emptyMessage}</Text>
        <Text style={styles.emptySubtext}>Puxe para baixo para atualizar</Text>
      </View>
    ),
    [error, emptyMessage, emptyIcon]
  );

  const keyExtractor = useCallback((item, index) => {
    // Verificar se é dados de contratos
    if (item.fila && item.grupo && item.prod) {
      return `${item.fila}-${item.grupo}-${index}`;
    }

    // Detectar automaticamente qual prefixo usar
    const prefixes = ["t_", "fd_", "pd_", "pc_", "fc_", "c_", "d_"];
    let prefix = null;

    for (const p of prefixes) {
      if (item[`${p}grupo`] || item[`${p}veiculos`] || item[`${p}peso`]) {
        prefix = p;
        break;
      }
    }

    if (prefix) {
      return (
        item[`${prefix}grupo`] || item[`${prefix}fila`] || `${prefix}${index}`
      );
    }

    return item.id || item.grupo || index.toString();
  }, []);

  const listComponent = useMemo(
    () => (
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
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={5}
      />
    ),
    [
      data,
      renderItem,
      keyExtractor,
      refreshing,
      handleRefresh,
      renderHeader,
      renderEmptyComponent,
    ]
  );

  if (loading && (!data || data.length === 0)) {
    return (
      <BaseScreen title={title} subtitle={subtitle} navigation={navigation}>
        <LoadingSpinner text={`Carregando ${title.toLowerCase()}...`} />
      </BaseScreen>
    );
  }

  if (error && (!data || data.length === 0)) {
    return (
      <BaseScreen title={title} subtitle={subtitle} navigation={navigation}>
        <ErrorMessage message={error} onRetry={onRefresh} />
      </BaseScreen>
    );
  }
  return (
    <BaseScreen title={title} subtitle={subtitle} navigation={navigation}>
      {listComponent}

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
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 15,
  },
  updateContainer: {
    backgroundColor: "#e8f4fd",
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 2,
    marginHorizontal: 10,
    borderRadius: 5,
  },
  updateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  updateText: {
    fontSize: 12,
    color: "#0066cc",
  },
  filterButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 4,
  },
  filterButtonText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: "500",
  },
  summaryContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 5,
    marginBottom: 10,
    marginHorizontal: 10,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  vehicleCard: {
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
  headerLeft: {
    flex: 1,
  },
  vehicleId: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statusBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.white,
  },
  cardContent: {
    marginTop: 5,
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
  debugContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  debugTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 20,
  },
  debugText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 24,
  },
  debugButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  debugButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default VehicleListScreen;
