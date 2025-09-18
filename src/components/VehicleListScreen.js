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
import { COLORS } from "../constants";
import { formatDateTime } from "../utils/formatters";

// Componente de Card de Veículo otimizado
const VehicleCard = React.memo(({ item, fields }) => {
  // Função para obter valor do item com fallbacks
  const getValue = (key) => {
    if (typeof key === 'function') return key(item);
    return item[key] || item[key.toLowerCase()] || item[key.toUpperCase()] || "N/A";
  };

  // Identificador do veículo com fallbacks
  const vehicleId = getValue('veiculo') || getValue('placa') || getValue('codigo') ||
                   getValue('id') || getValue('numero') || getValue('transportadora') ||
                   getValue('cliente') || `Item ${Math.random().toString(36).substr(2, 9)}`;

  return (
    <View style={styles.vehicleCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.vehicleId}>{vehicleId}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{getValue('status') || getValue('situacao') || "Ativo"}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        {fields.map((field) => {
          const value = field.format ? field.format(getValue(field.key)) : getValue(field.key);
          return (
            <VehicleInfoRow
              key={field.key}
              label={field.label}
              value={value}
            />
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
const ListHeader = React.memo(({ title, count, lastUpdate }) => (
  <View>
    {lastUpdate && (
      <View style={styles.updateContainer}>
        <Text style={styles.updateText}>
          Atualizado: {lastUpdate.toLocaleTimeString("pt-BR").substring(0, 5)}
        </Text>
      </View>
    )}
    <View style={styles.summaryContainer}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryValue}>{count}</Text>
        <Text style={styles.summaryLabel}>{title}</Text>
      </View>
    </View>
  </View>
));

// Componente principal reutilizável para telas de lista de veículos
const VehicleListScreen = ({
  navigation,
  title,
  subtitle,
  data,
  loading,
  error,
  lastUpdate,
  onRefresh,
  fields,
  emptyMessage = "Nenhum veículo encontrado",
  emptyIcon = "🚛",
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  const renderItem = useCallback(
    ({ item }) => <VehicleCard item={item} fields={fields} />,
    [fields]
  );

  const renderHeader = useCallback(
    () => (
      <ListHeader
        title={title}
        count={data.length}
        lastUpdate={lastUpdate}
      />
    ),
    [title, data.length, lastUpdate]
  );

  const renderEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>{emptyIcon}</Text>
        <Text style={styles.emptyText}>{error || emptyMessage}</Text>
        <Text style={styles.emptySubtext}>
          Puxe para baixo para atualizar
        </Text>
      </View>
    ),
    [error, emptyMessage, emptyIcon]
  );

  const keyExtractor = useCallback(
    (item, index) => item.id || item.veiculo || item.placa || item.codigo ||
                    item.numero || item.transportadora || index.toString(),
    []
  );

  // Memoizar o FlatList para evitar re-renders desnecessários
  const listComponent = useMemo(() => (
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
  ), [
    data,
    renderItem,
    keyExtractor,
    refreshing,
    handleRefresh,
    renderHeader,
    renderEmptyComponent,
  ]);

  if (loading && data.length === 0) {
    return (
      <BaseScreen title={title} subtitle={subtitle} navigation={navigation}>
        <LoadingSpinner text={`Carregando ${title.toLowerCase()}...`} />
      </BaseScreen>
    );
  }

  if (error && data.length === 0) {
    return (
      <BaseScreen title={title} subtitle={subtitle} navigation={navigation}>
        <ErrorMessage message={error} onRetry={onRefresh} />
      </BaseScreen>
    );
  }

  // Debug mode - show raw data if no structured data
  if (data.length === 0 && !loading && !error) {
    return (
      <BaseScreen title={title} subtitle={subtitle} navigation={navigation}>
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>🔍 Debug Mode</Text>
          <Text style={styles.debugText}>
            Nenhum dado estruturado encontrado.
          </Text>
          <Text style={styles.debugText}>
            Verifique os logs do console para ver a resposta da API.
          </Text>
          <TouchableOpacity
            style={styles.debugButton}
            onPress={onRefresh}
          >
            <Text style={styles.debugButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      </BaseScreen>
    );
  }

  return (
    <BaseScreen title={title} subtitle={subtitle} navigation={navigation}>
      {listComponent}
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
  updateText: {
    fontSize: 12,
    color: "#0066cc",
    textAlign: "center",
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