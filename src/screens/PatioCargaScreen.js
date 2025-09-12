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
  ScrollView,
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

const PatioCargaScreen = ({ navigation, route }) => {
  const [selectedFilial, setSelectedFilial] = useState(
    route.params?.filial || "LDA"
  );
  const [selectedOpPadrao, setSelectedOpPadrao] = useState([
    "rodo_ferro",
    "ferro_rodo",
    "rodo_rodo",
  ]);
  const [selectedServicos, setSelectedServicos] = useState([
    "armazenagem",
    "transbordo",
  ]);
  const [patioCargaData, setPatioCargaData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [totalVeiculos, setTotalVeiculos] = useState(0);
  const [totalPeso, setTotalPeso] = useState(0);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const toggleOpPadraoFilter = (filterKey) => {
    if (selectedOpPadrao.includes(filterKey)) {
      setSelectedOpPadrao(
        selectedOpPadrao.filter((item) => item !== filterKey)
      );
    } else {
      setSelectedOpPadrao([...selectedOpPadrao, filterKey]);
    }
  };

  const toggleServicoFilter = (filterKey) => {
    if (selectedServicos.includes(filterKey)) {
      setSelectedServicos(
        selectedServicos.filter((item) => item !== filterKey)
      );
    } else {
      setSelectedServicos([...selectedServicos, filterKey]);
    }
  };

  const fetchPatioCargaData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      setLoading(true);
      setErrorMessage("");

      // Preparar o filtro de operação padrão baseado na seleção
      const filtroOpPadrao = {
        rodo_ferro: selectedOpPadrao.includes("rodo_ferro") ? 1 : 0,
        ferro_rodo: selectedOpPadrao.includes("ferro_rodo") ? 1 : 0,
        rodo_rodo: selectedOpPadrao.includes("rodo_rodo") ? 1 : 0,
        outros: selectedOpPadrao.includes("outros") ? 1 : 0,
      };

      // Preparar o filtro de serviço baseado na seleção
      const filtroServico = {
        armazenagem: selectedServicos.includes("armazenagem") ? 1 : 0,
        transbordo: selectedServicos.includes("transbordo") ? 1 : 0,
        pesagem: selectedServicos.includes("pesagem") ? 1 : 0,
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}/monitor.php`, {
        method: "POST",
        headers: {
          token: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          AttApi: {
            tipoOperacao: "monitor_patio_carga",
            filtro_filial: selectedFilial,
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
        setPatioCargaData([]);
        setTotalVeiculos(0);
        setTotalPeso(0);
        setErrorMessage(
          data.mensagemRetorno.mensagem || "Nenhum veículo encontrado"
        );
      } else if (data.dados?.listaPatioCarga?.patioCargaVeiculos) {
        const patioCargaData = data.dados.listaPatioCarga.patioCargaVeiculos;
        setPatioCargaData(patioCargaData);

        // Calcular totais
        const totalV = patioCargaData.reduce(
          (sum, item) => sum + (item.pc_veiculos || 0),
          0
        );
        const totalP = patioCargaData.reduce(
          (sum, item) => sum + (item.pc_peso || 0),
          0
        );

        setTotalVeiculos(totalV);
        setTotalPeso(totalP);
        setErrorMessage("");
      } else {
        setPatioCargaData([]);
        setTotalVeiculos(0);
        setTotalPeso(0);
        setErrorMessage("Nenhum dado disponível");
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error("Erro ao buscar dados do pátio de carga:", error);
      setErrorMessage("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPatioCargaData();
    }, [selectedFilial, selectedOpPadrao, selectedServicos])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPatioCargaData();
    setRefreshing(false);
  }, [selectedFilial, selectedOpPadrao, selectedServicos]);

  const formatPeso = (peso) => {
    if (peso >= 1000000) {
      return (peso / 1000000).toFixed(2) + "T";
    } else if (peso >= 1000) {
      return (peso / 1000).toFixed(1) + "K";
    }
    return peso + "Kg";
  };

  const renderPatioCargaItem = ({ item }) => (
    <View style={styles.patioCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.filaText}>Fila {item.pc_fila}</Text>
        <View style={styles.veiculosBadge}>
          <Text style={styles.veiculosText}>{item.pc_veiculos} veíc.</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Grupo:</Text>
          <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
            {item.pc_grupo || "Não informado"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Produto:</Text>
          <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
            {item.pc_produto || "Não informado"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Peso:</Text>
          <Text style={styles.infoValue}>{formatPeso(item.pc_peso || 0)}</Text>
        </View>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View>
      {/* Última atualização */}
      {lastUpdate && (
        <View style={styles.updateContainer}>
          <Text style={styles.updateText}>
            Atualizado: {lastUpdate.toLocaleTimeString("pt-BR").substring(0, 5)}
          </Text>
        </View>
      )}
      {/* Resumo não fixo */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalVeiculos}</Text>
          <Text style={styles.summaryLabel}>Veículos</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{formatPeso(totalPeso)}</Text>
          <Text style={styles.summaryLabel}>Peso</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{patioCargaData.length}</Text>
          <Text style={styles.summaryLabel}>Filas</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header fixo */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Pátio de Carga</Text>
          <Text style={styles.headerSubtitle}>Filial: {selectedFilial}</Text>
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFiltersVisible(true)}
        >
          <Text style={styles.filterIcon}>🔎</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Veículos no Pátio de Carga com resumo no header */}
      {loading && patioCargaData.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Carregando dados...</Text>
        </View>
      ) : (
        <FlatList
          data={patioCargaData}
          renderItem={renderPatioCargaItem}
          keyExtractor={(item, index) => index.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#007AFF"]}
              tintColor="#007AFF"
            />
          }
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏗️</Text>
              <Text style={styles.emptyText}>
                {errorMessage || "Nenhum veículo no pátio de carga"}
              </Text>
              <Text style={styles.emptySubtext}>
                Verifique os filtros aplicados
              </Text>
            </View>
          }
        />
      )}

      {/* Modal de Filtros */}
      <Modal
        visible={filtersVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFiltersVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros</Text>
              <TouchableOpacity
                onPress={() => setFiltersVisible(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              {/* Filtros de Serviço */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Tipos de Serviço</Text>
                <View style={styles.filterOptions}>
                  {SERVICO_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.filterOptionButton,
                        selectedServicos.includes(option.key) &&
                          styles.filterOptionButtonActive,
                      ]}
                      onPress={() => toggleServicoFilter(option.key)}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          selectedServicos.includes(option.key) &&
                            styles.filterOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Filtros de Operação Padrão */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Tipos de Operação</Text>
                <View style={styles.filterOptions}>
                  {OP_PADRAO_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.filterOptionButton,
                        selectedOpPadrao.includes(option.key) &&
                          styles.filterOptionButtonActive,
                      ]}
                      onPress={() => toggleOpPadraoFilter(option.key)}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          selectedOpPadrao.includes(option.key) &&
                            styles.filterOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => setFiltersVisible(false)}
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
    shadowColor: "#000",
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
  patioCard: {
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
    backgroundColor: "#20c997",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  veiculosText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#ffffff",
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
  // Estilos para o modal de filtros
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
  filterGroup: {
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

export default PatioCargaScreen;
