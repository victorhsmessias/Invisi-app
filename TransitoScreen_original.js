import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");

const API_CONFIG = {
  BASE_URL: "http://192.168.10.201/attmonitor/api",
};

// Opções de filtro de operação padrão
const OP_PADRAO_OPTIONS = [
  { key: "rodo_ferro", label: "Rodo-Ferro" },
  { key: "ferro_rodo", label: "Ferro-Rodo" },
  { key: "rodo_rodo", label: "Rodo-Rodo" },
  { key: "outros", label: "Outros" },
];

// Opções de filtro de serviço
const SERVICO_OPTIONS = [
  { key: "armazenagem", label: "Armazenagem" },
  { key: "transbordo", label: "Transbordo" },
  { key: "pesagem", label: "Pesagem" },
];

const TransitoScreen = ({ navigation, route }) => {
  const [state, setState] = useState({
    selectedFilial: route.params?.filial || "LDA",
    selectedOpPadrao: ["rodo_ferro", "ferro_rodo", "rodo_rodo"],
    selectedServicos: ["armazenagem", "transbordo"],
    transitoData: [],
    loading: false,
    refreshing: false,
    lastUpdate: null,
    totalVeiculos: 0,
    totalPeso: 0,
    filtersVisible: false,
    errorMessage: "",
  });

  // Atualizar apenas um campo do estado
  const updateState = (key, value) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const toggleOpPadraoFilter = (filterKey) => {
    setState((prev) => {
      const newOpPadrao = prev.selectedOpPadrao.includes(filterKey)
        ? prev.selectedOpPadrao.filter((item) => item !== filterKey)
        : [...prev.selectedOpPadrao, filterKey];

      return { ...prev, selectedOpPadrao: newOpPadrao };
    });
  };

  const toggleServicoFilter = (filterKey) => {
    setState((prev) => {
      const newServicos = prev.selectedServicos.includes(filterKey)
        ? prev.selectedServicos.filter((item) => item !== filterKey)
        : [...prev.selectedServicos, filterKey];

      return { ...prev, selectedServicos: newServicos };
    });
  };

  const fetchTransitoData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      updateState("loading", true);
      updateState("errorMessage", "");

      // Preparar o filtro de operação padrão baseado na seleção
      const filtroOpPadrao = {
        rodo_ferro: state.selectedOpPadrao.includes("rodo_ferro") ? 1 : 0,
        ferro_rodo: state.selectedOpPadrao.includes("ferro_rodo") ? 1 : 0,
        rodo_rodo: state.selectedOpPadrao.includes("rodo_rodo") ? 1 : 0,
        outros: state.selectedOpPadrao.includes("outros") ? 1 : 0,
      };

      // Preparar o filtro de serviço baseado na seleção
      const filtroServico = {
        armazenagem: state.selectedServicos.includes("armazenagem") ? 1 : 0,
        transbordo: state.selectedServicos.includes("transbordo") ? 1 : 0,
        pesagem: state.selectedServicos.includes("pesagem") ? 1 : 0,
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}/monitor.php`, {
        method: "POST",
        headers: {
          token: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          AttApi: {
            tipoOperacao: "monitor_transito",
            filtro_filial: state.selectedFilial,
            filtro_servico: filtroServico,
            filtro_op_padrao: filtroOpPadrao,
          },
        }),
      });

      const data = await response.json();

      // Verificar se há erro de "não encontrado"
      if (
        data.mensagemRetorno?.codigo === "ERRO" &&
        data.mensagemRetorno?.descricao.includes("Nao tem veiculos")
      ) {
        updateState("transitoData", []);
        updateState("totalVeiculos", 0);
        updateState("totalPeso", 0);
        updateState(
          "errorMessage",
          data.mensagemRetorno.mensagem || "Nenhum veículo encontrado"
        );
      } else if (data.dados?.listaTransito?.transitoVeiculos) {
        const transitoData = data.dados.listaTransito.transitoVeiculos;

        // Calcular totais
        const totalV = transitoData.reduce(
          (sum, item) => sum + (item.t_veiculos || 0),
          0
        );
        const totalP = transitoData.reduce(
          (sum, item) => sum + (item.t_peso || 0),
          0
        );

        updateState("transitoData", transitoData);
        updateState("totalVeiculos", totalV);
        updateState("totalPeso", totalP);
        updateState("errorMessage", "");
      } else {
        updateState("transitoData", []);
        updateState("totalVeiculos", 0);
        updateState("totalPeso", 0);
        updateState("errorMessage", "Nenhum dado disponível");
      }

      updateState("lastUpdate", new Date());
    } catch (error) {
      console.error("Erro ao buscar dados de trânsito:", error);
      updateState("errorMessage", "Erro ao carregar dados");
    } finally {
      updateState("loading", false);
    }
  }, [state.selectedFilial, state.selectedOpPadrao, state.selectedServicos]);

  useFocusEffect(
    useCallback(() => {
      fetchTransitoData();
    }, [fetchTransitoData])
  );

  const onRefresh = useCallback(async () => {
    updateState("refreshing", true);
    await fetchTransitoData();
    updateState("refreshing", false);
  }, [fetchTransitoData]);

  const formatPeso = (peso) => {
    if (!peso || isNaN(peso)) return "0 kg";

    if (peso >= 1000) {
      return (peso / 1000).toFixed(2) + " T";
    }
    return peso + " kg";
  };

  const formatDateTime = (date, time) => {
    if (!date || !time) return "N/A";

    try {
      return time.substring(0, 5);
    } catch (error) {
      return `${date} ${time}`;
    }
  };

  const renderTransitoItem = ({ item, selectedFilial }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("GrupoDetalhes", {
          grupo: item.pc_grupo || "Não informado",
          filial: selectedFilial,
          tipo: "patio_carga",
        })
      }
    >
      <View style={styles.transitoCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.filaText}>{item.t_grupo || "Não informado"}</Text>
          <View style={styles.veiculosBadge}>
            <Text style={styles.veiculosText}>{item.t_veiculos} veíc.</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fila:</Text>
            <Text
              style={styles.infoValue}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.t_fila || "Não informado"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Produto:</Text>
            <Text
              style={styles.infoValue}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.t_produto || "Não informado"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Peso:</Text>
            <Text style={styles.infoValue}>{formatPeso(item.t_peso)}</Text>
          </View>

          {item.t_data && item.t_hora && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Atualizado:</Text>
              <Text style={styles.infoValue}>
                {formatDateTime(item.t_data, item.t_hora)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      {state.lastUpdate && (
        <View style={styles.updateContainer}>
          <Text style={styles.updateText}>
            Atualizado:{" "}
            {state.lastUpdate.toLocaleTimeString("pt-BR").substring(0, 5)}
          </Text>
        </View>
      )}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{state.totalVeiculos}</Text>
          <Text style={styles.summaryLabel}>Veículos</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{formatPeso(state.totalPeso)}</Text>
          <Text style={styles.summaryLabel}>Peso</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{state.transitoData.length}</Text>
          <Text style={styles.summaryLabel}>Grupos</Text>
        </View>
      </View>
    </View>
  );

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
          <Text style={styles.headerTitle}>Veículos em Trânsito</Text>
          <Text style={styles.headerSubtitle}>
            Filial: {state.selectedFilial}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => updateState("filtersVisible", true)}
        >
          <Text style={styles.filterIcon}>🔎</Text>
          {(state.selectedOpPadrao.length < OP_PADRAO_OPTIONS.length ||
            state.selectedServicos.length < SERVICO_OPTIONS.length) && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>!</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {state.loading && state.transitoData.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Carregando dados...</Text>
        </View>
      ) : (
        <FlatList
          data={state.transitoData}
          renderItem={renderTransitoItem}
          keyExtractor={(item, index) => index.toString()}
          refreshControl={
            <RefreshControl
              refreshing={state.refreshing}
              onRefresh={onRefresh}
              colors={["#007AFF"]}
              tintColor="#007AFF"
            />
          }
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🚛</Text>
              <Text style={styles.emptyText}>
                {state.errorMessage || "Nenhum veículo em trânsito"}
              </Text>
              <Text style={styles.emptySubtext}>
                Verifique os filtros aplicados
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={state.filtersVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => updateState("filtersVisible", false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros</Text>
              <TouchableOpacity
                onPress={() => updateState("filtersVisible", false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterGroupTitle}>Tipos de Serviço</Text>
              <View style={styles.filterOptions}>
                {SERVICO_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterOptionButton,
                      state.selectedServicos.includes(option.key) &&
                        styles.filterOptionButtonActive,
                    ]}
                    onPress={() => toggleServicoFilter(option.key)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        state.selectedServicos.includes(option.key) &&
                          styles.filterOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterGroupTitle}>Tipos de Operação</Text>
              <View style={styles.filterOptions}>
                {OP_PADRAO_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterOptionButton,
                      state.selectedOpPadrao.includes(option.key) &&
                        styles.filterOptionButtonActive,
                    ]}
                    onPress={() => toggleOpPadraoFilter(option.key)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        state.selectedOpPadrao.includes(option.key) &&
                          styles.filterOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => {
                updateState("filtersVisible", false);
                fetchTransitoData();
              }}
            >
              <Text style={styles.applyFiltersText}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
    color: "#1a1a1a",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  filterButton: {
    padding: 8,
    position: "relative",
  },
  filterIcon: {
    fontSize: 22,
  },
  filterBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#ff3b30",
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  summaryContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 5,
    marginBottom: 10,
    marginHorizontal: 10,
    borderRadius: 10,
    shadowColor: "##000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 10,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  listContent: {
    paddingBottom: 15,
  },
  transitoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
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
  filaText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  veiculosBadge: {
    backgroundColor: "#ffc107",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  veiculosText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#666",
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
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
    color: "#666",
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalCloseButton: {
    padding: 5,
  },
  modalCloseText: {
    fontSize: 20,
    color: "#666",
  },
  filterSection: {
    marginBottom: 20,
  },
  filterGroupTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  filterOptionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 10,
    marginBottom: 10,
  },
  filterOptionButtonActive: {
    backgroundColor: "#007AFF",
  },
  filterOptionText: {
    fontSize: 14,
    color: "#666",
  },
  filterOptionTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
  applyFiltersButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  applyFiltersText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default TransitoScreen;
