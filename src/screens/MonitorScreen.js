import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MonitorScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilial, setSelectedFilial] = useState("LDA");
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Estados dos dados simulados baseados na documentação da API
  const [monitorData, setMonitorData] = useState({
    contratos_fila: {
      fila: "12",
      grupo: "USINA ALTO ALEGRE",
      produto: "ACUCAR CRISTAL VHP A GRANEL",
      peso_origem: 78977400,
      peso_descarga: 78878080,
      peso_carga: 58431480,
      veiculos_descarga: "2167",
      veiculos_carga: "776",
      eficiencia: 98.5,
    },
    transito: {
      veiculos_transito: 24,
      tempo_medio: "2h 15min",
      proximas_chegadas: 8,
    },
    patio_descarga: {
      ocupacao: 75,
      capacidade_maxima: 120,
      fila_espera: 15,
      tempo_medio_descarga: "45min",
    },
    patio_carga: {
      ocupacao: 62,
      capacidade_maxima: 100,
      fila_espera: 12,
      tempo_medio_carga: "38min",
    },
  });

  const filiais = [
    { code: "LDA", name: "LDA" },
    { code: "CHP", name: "CHP" },
    { code: "JCT", name: "JCT" },
    { code: "CMB", name: "CMB" },
  ];

  const servicos = [
    { key: "armazenagem", label: "Armazenagem", active: true },
    { key: "transbordo", label: "Transbordo", active: true },
    { key: "pesagem", label: "Pesagem", active: false },
  ];

  useEffect(() => {
    fetchMonitorData();

    // Atualização automática a cada 30 segundos
    const interval = setInterval(() => {
      fetchMonitorData();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedFilial]);

  const fetchMonitorData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        navigation.replace("Login");
        return;
      }

      const responses = await Promise.all([
        fetch(`http://192.168.10.52/attmonitor/api/monitor.php`, {
          method: "POST",
          headers: { token: token },
          body: JSON.stringify({
            AttApi: {
              tipoOperacao: "d_monitor",
              filtro_filial: selectedFilial,
            },
          }),
        }),
        fetch(
          `http://192.168.10.52/attmonitor/api/monitor_contratos_fila.php`,
          {
            method: "POST",
            headers: { token: token },
          }
        ),
        // Mais endpoints conforme necessário
      ]);
      setLastUpdate(new Date());

      // Simular pequenas variações nos dados
      setMonitorData((prev) => ({
        ...prev,
        transito: {
          ...prev.transito,
          veiculos_transito:
            prev.transito.veiculos_transito + Math.floor(Math.random() * 3) - 1,
        },
      }));
    } catch (error) {
      console.error("Erro ao buscar dados do monitor:", error);
      Alert.alert("Erro", "Falha ao atualizar dados do monitor");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMonitorData();
    setRefreshing(false);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat("pt-BR").format(num);
  };

  const formatWeight = (weight) => {
    return `${formatNumber(weight)} kg`;
  };

  const formatDateTime = (date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 90) return "#dc3545"; // Vermelho
    if (percentage >= 70) return "#ffc107"; // Amarelo
    return "#28a745"; // Verde
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.lastUpdateText}>
            Atualizado: {formatDateTime(lastUpdate)}
          </Text>
        </View>

        <Text style={styles.title}>Monitor Operacional</Text>

        {/* Seletor de Filial */}
        <View style={styles.filialSelector}>
          {filiais.map((filial) => (
            <TouchableOpacity
              key={filial.code}
              style={[
                styles.filialButton,
                selectedFilial === filial.code && styles.filialButtonActive,
              ]}
              onPress={() => setSelectedFilial(filial.code)}
            >
              <Text
                style={[
                  styles.filialButtonText,
                  selectedFilial === filial.code &&
                    styles.filialButtonTextActive,
                ]}
              >
                {filial.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Serviços Ativos */}
        <View style={styles.servicosContainer}>
          <Text style={styles.servicosLabel}>Serviços:</Text>
          <View style={styles.servicosList}>
            {servicos.map((servico) => (
              <View
                key={servico.key}
                style={[
                  styles.servicoTag,
                  { backgroundColor: servico.active ? "#28a745" : "#6c757d" },
                ]}
              >
                <Text style={styles.servicoTagText}>{servico.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Contratos em Fila */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Contrato em Fila #{monitorData.contratos_fila.fila}
          </Text>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {monitorData.contratos_fila.grupo}
              </Text>
              <View
                style={[styles.statusBadge, { backgroundColor: "#28a745" }]}
              >
                <Text style={styles.statusBadgeText}>Ativo</Text>
              </View>
            </View>

            <Text style={styles.productText}>
              {monitorData.contratos_fila.produto}
            </Text>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatWeight(monitorData.contratos_fila.peso_origem)}
                </Text>
                <Text style={styles.statLabel}>Peso Origem</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatWeight(monitorData.contratos_fila.peso_descarga)}
                </Text>
                <Text style={styles.statLabel}>Peso Descarga</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatWeight(monitorData.contratos_fila.peso_carga)}
                </Text>
                <Text style={styles.statLabel}>Peso Carga</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {monitorData.contratos_fila.eficiencia}%
                </Text>
                <Text style={styles.statLabel}>Eficiência</Text>
              </View>
            </View>

            <View style={styles.vehicleInfo}>
              <View style={styles.vehicleItem}>
                <Text style={styles.vehicleCount}>
                  {monitorData.contratos_fila.veiculos_descarga}
                </Text>
                <Text style={styles.vehicleLabel}>Veículos Descarga</Text>
              </View>
              <View style={styles.vehicleItem}>
                <Text style={styles.vehicleCount}>
                  {monitorData.contratos_fila.veiculos_carga}
                </Text>
                <Text style={styles.vehicleLabel}>Veículos Carga</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Trânsito */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trânsito</Text>
          <View style={styles.card}>
            <View style={styles.transitStats}>
              <View style={styles.transitItem}>
                <Text style={styles.transitNumber}>
                  {monitorData.transito.veiculos_transito}
                </Text>
                <Text style={styles.transitLabel}>Em Trânsito</Text>
              </View>
              <View style={styles.transitItem}>
                <Text style={styles.transitNumber}>
                  {monitorData.transito.tempo_medio}
                </Text>
                <Text style={styles.transitLabel}>Tempo Médio</Text>
              </View>
              <View style={styles.transitItem}>
                <Text style={styles.transitNumber}>
                  {monitorData.transito.proximas_chegadas}
                </Text>
                <Text style={styles.transitLabel}>Próximas Chegadas</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pátios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status dos Pátios</Text>

          {/* Pátio Descarga */}
          <View style={styles.card}>
            <View style={styles.patioHeader}>
              <Text style={styles.patioTitle}>Pátio de Descarga</Text>
              <Text
                style={[
                  styles.patioOccupancy,
                  {
                    color: getStatusColor(
                      (monitorData.patio_descarga.ocupacao /
                        monitorData.patio_descarga.capacidade_maxima) *
                        100
                    ),
                  },
                ]}
              >
                {monitorData.patio_descarga.ocupacao}/
                {monitorData.patio_descarga.capacidade_maxima}
              </Text>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      (monitorData.patio_descarga.ocupacao /
                        monitorData.patio_descarga.capacidade_maxima) *
                      100
                    }%`,
                    backgroundColor: getStatusColor(
                      (monitorData.patio_descarga.ocupacao /
                        monitorData.patio_descarga.capacidade_maxima) *
                        100
                    ),
                  },
                ]}
              />
            </View>

            <View style={styles.patioStats}>
              <View style={styles.patioStat}>
                <Text style={styles.patioStatValue}>
                  {monitorData.patio_descarga.fila_espera}
                </Text>
                <Text style={styles.patioStatLabel}>Fila de Espera</Text>
              </View>
              <View style={styles.patioStat}>
                <Text style={styles.patioStatValue}>
                  {monitorData.patio_descarga.tempo_medio_descarga}
                </Text>
                <Text style={styles.patioStatLabel}>Tempo Médio</Text>
              </View>
            </View>
          </View>

          {/* Pátio Carga */}
          <View style={styles.card}>
            <View style={styles.patioHeader}>
              <Text style={styles.patioTitle}>Pátio de Carga</Text>
              <Text
                style={[
                  styles.patioOccupancy,
                  {
                    color: getStatusColor(
                      (monitorData.patio_carga.ocupacao /
                        monitorData.patio_carga.capacidade_maxima) *
                        100
                    ),
                  },
                ]}
              >
                {monitorData.patio_carga.ocupacao}/
                {monitorData.patio_carga.capacidade_maxima}
              </Text>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      (monitorData.patio_carga.ocupacao /
                        monitorData.patio_carga.capacidade_maxima) *
                      100
                    }%`,
                    backgroundColor: getStatusColor(
                      (monitorData.patio_carga.ocupacao /
                        monitorData.patio_carga.capacidade_maxima) *
                        100
                    ),
                  },
                ]}
              />
            </View>

            <View style={styles.patioStats}>
              <View style={styles.patioStat}>
                <Text style={styles.patioStatValue}>
                  {monitorData.patio_carga.fila_espera}
                </Text>
                <Text style={styles.patioStatLabel}>Fila de Espera</Text>
              </View>
              <View style={styles.patioStat}>
                <Text style={styles.patioStatValue}>
                  {monitorData.patio_carga.tempo_medio_carga}
                </Text>
                <Text style={styles.patioStatLabel}>Tempo Médio</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Botão de Atualização Manual */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => onRefresh()}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.refreshButtonText}>Atualizar Dados</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 15,
    marginBottom: 10,
  },
  backButton: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  lastUpdateText: {
    fontSize: 12,
    color: "#666",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  filialSelector: {
    flexDirection: "row",
    marginBottom: 15,
  },
  filialButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    marginRight: 10,
  },
  filialButtonActive: {
    backgroundColor: "#007AFF",
  },
  filialButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  filialButtonTextActive: {
    color: "#ffffff",
  },
  servicosContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  servicosLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 10,
  },
  servicosList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  servicoTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  servicoTagText: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  productText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statItem: {
    width: "48%",
    alignItems: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  vehicleInfo: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  vehicleItem: {
    alignItems: "center",
  },
  vehicleCount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#28a745",
  },
  vehicleLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  transitStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  transitItem: {
    alignItems: "center",
  },
  transitNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffc107",
  },
  transitLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  patioHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  patioTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  patioOccupancy: {
    fontSize: 16,
    fontWeight: "bold",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#e9ecef",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 15,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  patioStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  patioStat: {
    alignItems: "center",
  },
  patioStatValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  patioStatLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  refreshButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 20,
  },
  refreshButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default MonitorScreen;
