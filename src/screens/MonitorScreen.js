// MonitorScreen.js
import React, { useState, useCallback, useRef } from "react";
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
import { useFocusEffect } from "@react-navigation/native";

const BASE_URL = "http://192.168.10.201/attmonitor/api";

const apiFetch = async (
  path,
  { token, method = "POST", body = null, timeoutMs = 12000, signal } = {}
) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE_URL}/${path}`, {
      method,
      headers: {
        ...(token ? { token } : {}),
        ...(method !== "GET" ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: signal || controller.signal,
    });
    const text = await res.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      /* mantém null */
    }
    return { ok: res.ok, status: res.status, text, data };
  } finally {
    clearTimeout(id);
  }
};

/* ===================== Tela ===================== */
const MonitorScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilial, setSelectedFilial] = useState("LDA");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [error, setError] = useState(null);

  const inFlightRef = useRef(false);
  const pollTimerRef = useRef(null);

  const [monitorData, setMonitorData] = useState({
    contratos_fila: {
      fila: "N/A",
      grupo: "Sem dados",
      produto: "Produto não informado",
      peso_origem: 0,
      peso_descarga: 0,
      peso_carga: 0,
      veiculos_descarga: "0",
      veiculos_carga: "0",
      eficiencia: 0,
    },
    transito: {
      veiculos_transito: 0,
      proximas_chegadas: 0,
    },
    patio_descarga: {
      ocupacao: 0,
      capacidade_maxima: 100,
      fila_espera: 0,
      tempo_medio_descarga: "—",
    },
    patio_carga: {
      ocupacao: 0,
      capacidade_maxima: 100,
      fila_espera: 0,
      tempo_medio_carga: "—",
    },
  });

  const filiais = [
    { code: "LDA", name: "LDA" },
    { code: "CHP", name: "CHP" },
  ];

  const servicos = [
    { key: "armazenagem", label: "Armazenagem", active: 1 },
    { key: "transbordo", label: "Transbordo", active: 1 },
    { key: "pesagem", label: "Pesagem", active: 0 },
  ];

  const formatNumber = (num) =>
    new Intl.NumberFormat("pt-BR").format(Number(num || 0));
  const formatWeight = (w) => `${formatNumber(w)} kg`;
  const formatDateTime = (d) =>
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const getStatusColor = (p) =>
    p >= 90 ? "#dc3545" : p >= 70 ? "#ffc107" : "#28a745";

  const fetchMonitorData = useCallback(async () => {
    if (inFlightRef.current) return; // evita chamadas paralelas
    inFlightRef.current = true;

    try {
      setError(null);
      if (!refreshing) setLoading(true);

      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        navigation.replace("Login");
        return;
      }

      const okResp = (resp) =>
        resp?.ok && resp?.data && typeof resp.data === "object";
      const isSucesso = (resp) =>
        okResp(resp) && resp.data?.mensagemRetorno?.codigo === "SUCESSO";
      const getDados = (resp) => (okResp(resp) ? resp.data?.dados : null);

      /* ========== CONTRATOS (se a API continuar respondendo ERRO, mantemos defaults) ========== */
      let contratos = null;
      try {
        const r = await apiFetch("monitor_contratos_fila.php", {
          token,
          body: {
            AttApi: {
              tipoOperacao: "monitor_contratos_fila",
              filial: selectedFilial,
            },
          },
        });
        if (isSucesso(r)) {
          contratos = getDados(r) || r.data; // cobre ambos formatos
        }
      } catch (e) {
        console.warn("contratos erro:", e?.message);
      }

      /* ========== D_MONITOR (agregados) – opcionalmente útil p/ métricas globais) ========== */
      try {
        await apiFetch("d_monitor.php", {
          token,
          body: {
            AttApi: {
              tipoOperacao: "d_monitor",
              filtro_filial: selectedFilial,
              filtro_servico: { armazenagem: 1, transbordo: 1, pesagem: 0 },
              filtro_op_padrao: {
                rodo_ferro: 1,
                ferro_rodo: 1,
                rodo_rodo: 1,
                outros: 0,
              },
              filtro_data_inicio: "2024-08-01",
              filtro_data_fim: "2025-12-31",
              filtro_acumulador: { dia: 0, mes: 1, ano: 0 },
            },
          },
        });
      } catch (e) {
        console.warn("d_monitor erro:", e?.message);
      }

      /* ========== TRÂNSITO ========== */
      let transito = {
        veiculos_transito: 0,
        proximas_chegadas: 0,
      };
      try {
        const r = await apiFetch("monitor.php", {
          token,
          body: {
            AttApi: {
              tipoOperacao: "monitor_transito",
              filtro_filial: selectedFilial,
              filtro_servico: { armazenagem: 1, transbordo: 1, pesagem: 0 },
              filtro_op_padrao: {
                rodo_ferro: 1,
                ferro_rodo: 1,
                rodo_rodo: 1,
                outros: 0,
              },
            },
          },
        });
        if (isSucesso(r)) {
          const arr = getDados(r)?.listaTransito?.transitoVeiculos;
          if (Array.isArray(arr)) {
            const total = arr.reduce(
              (s, it) => s + (Number(it?.t_veiculos) || 0),
              0
            );
            transito = {
              veiculos_transito: total,
              proximas_chegadas: arr.length,
            };
          }
        }
      } catch (e) {
        console.warn("transito erro:", e?.message);
      }

      /* ========== PÁTIO DESCARGA ========== */
      let patio_descarga = {
        ocupacao: 0,
        capacidade_maxima: 100,
        fila_espera: 0,
        tempo_medio_descarga: "—",
      };
      try {
        const r = await apiFetch("monitor.php", {
          token,
          body: {
            AttApi: {
              tipoOperacao: "monitor_patio_desc",
              filtro_filial: selectedFilial,
            },
          },
        });
        if (isSucesso(r)) {
          const dados = getDados(r);
          patio_descarga = {
            ocupacao: Number(dados?.ocupacao ?? dados?.total_ocupacao ?? 0),
            capacidade_maxima: Number(
              dados?.capacidade_maxima ?? dados?.capacidade_total ?? 100
            ),
            fila_espera: Number(dados?.fila_espera ?? dados?.total_fila ?? 0),
            tempo_medio_descarga:
              dados?.tempo_medio_descarga ?? dados?.tempo_medio ?? "—",
          };
        }
      } catch (e) {
        console.warn("patio desc erro:", e?.message);
      }

      /* ========== PÁTIO CARGA ========== */
      let patio_carga = {
        ocupacao: 0,
        capacidade_maxima: 100,
        fila_espera: 0,
        tempo_medio_carga: "—",
      };
      try {
        const r = await apiFetch("monitor.php", {
          token,
          body: {
            AttApi: {
              tipoOperacao: "monitor_patio_carga",
              filtro_filial: selectedFilial,
            },
          },
        });
        if (isSucesso(r)) {
          const dados = getDados(r);
          patio_carga = {
            ocupacao: Number(dados?.ocupacao ?? dados?.total_ocupacao ?? 0),
            capacidade_maxima: Number(
              dados?.capacidade_maxima ?? dados?.capacidade_total ?? 100
            ),
            fila_espera: Number(dados?.fila_espera ?? dados?.total_fila ?? 0),
            tempo_medio_carga:
              dados?.tempo_medio_carga ?? dados?.tempo_medio ?? "—",
          };
        }
      } catch (e) {
        console.warn("patio carga erro:", e?.message);
      }

      /* ========== Mapeia para UI ========== */
      setMonitorData({
        contratos_fila: {
          fila: contratos?.fila ?? contratos?.id ?? "N/A",
          grupo:
            contratos?.grupo ??
            contratos?.empresa ??
            contratos?.cliente ??
            "Sem dados",
          produto:
            contratos?.produto ??
            contratos?.prod ??
            contratos?.tipo_produto ??
            "Produto não informado",
          peso_origem: Number(contratos?.peso_origem ?? 0),
          peso_descarga: Number(contratos?.peso_descarga ?? 0),
          peso_carga: Number(contratos?.peso_carga ?? 0),
          veiculos_descarga: String(
            contratos?.veiculos_descarga ?? contratos?.total_veiculos_desc ?? 0
          ),
          veiculos_carga: String(
            contratos?.veiculos_carga ?? contratos?.total_veiculos_carga ?? 0
          ),
          eficiencia:
            Number(
              contratos?.eficiencia ?? contratos?.percentual_eficiencia ?? 0
            ) || 0,
        },
        transito,
        patio_descarga,
        patio_carga,
      });

      setLastUpdate(new Date());
    } catch (err) {
      console.error("=== ERRO GERAL ===", err);
      setError(`Erro ao carregar dados: ${err?.message || err}`);
      Alert.alert(
        "Erro ao Carregar Dados",
        `Não foi possível carregar os dados do monitor.\n\nErro: ${
          err?.message || err
        }`,
        [
          { text: "Tentar Novamente", onPress: () => fetchMonitorData() },
          { text: "OK" },
        ]
      );
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, [navigation, refreshing, selectedFilial]);

  // Polling apenas quando a tela está em foco
  useFocusEffect(
    useCallback(() => {
      fetchMonitorData();
      pollTimerRef.current = setInterval(fetchMonitorData, 30000);
      return () => {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      };
    }, [fetchMonitorData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    await fetchMonitorData();
    setRefreshing(false);
  }, [fetchMonitorData]);

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
        {/* Loading */}
        {loading && !refreshing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>
              Carregando dados do monitor...
            </Text>
          </View>
        )}

        {/* Erro */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Erro de Conexão</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                fetchMonitorData();
              }}
            >
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Conteúdo */}
        {!loading && !error && (
          <>
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
              onPress={onRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.refreshButtonText}>Atualizar Dados</Text>
              )}
            </TouchableOpacity>
          </>
        )}
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
  backButton: { fontSize: 16, color: "#007AFF", fontWeight: "500" },
  lastUpdateText: { fontSize: 12, color: "#666" },
  title: { fontSize: 24, fontWeight: "bold", color: "#333", marginBottom: 15 },
  filialSelector: { flexDirection: "row", marginBottom: 15 },
  filialButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    marginRight: 10,
  },
  filialButtonActive: { backgroundColor: "#007AFF" },
  filialButtonText: { fontSize: 14, color: "#666", fontWeight: "500" },
  filialButtonTextActive: { color: "#ffffff" },
  servicosContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  servicosLabel: { fontSize: 14, color: "#666", marginRight: 10 },
  servicosList: { flexDirection: "row", flexWrap: "wrap" },
  servicoTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  servicoTagText: { fontSize: 12, color: "#ffffff", fontWeight: "500" },
  content: { flex: 1, paddingHorizontal: 20 },
  section: { marginTop: 20 },
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
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#333", flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusBadgeText: { color: "#ffffff", fontSize: 12, fontWeight: "500" },
  productText: { fontSize: 14, color: "#666", marginBottom: 15 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statItem: { width: "48%", alignItems: "center", marginBottom: 10 },
  statValue: { fontSize: 16, fontWeight: "bold", color: "#007AFF" },
  statLabel: { fontSize: 12, color: "#666", marginTop: 2 },
  vehicleInfo: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  vehicleItem: { alignItems: "center" },
  vehicleCount: { fontSize: 20, fontWeight: "bold", color: "#28a745" },
  vehicleLabel: { fontSize: 12, color: "#666", marginTop: 4 },
  transitStats: { flexDirection: "row", justifyContent: "space-around" },
  transitItem: { alignItems: "center" },
  transitNumber: { fontSize: 18, fontWeight: "bold", color: "#ffc107" },
  transitLabel: { fontSize: 12, color: "#666", marginTop: 4 },
  patioHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  patioTitle: { fontSize: 16, fontWeight: "600", color: "#333" },
  patioOccupancy: { fontSize: 16, fontWeight: "bold" },
  progressBar: {
    height: 8,
    backgroundColor: "#e9ecef",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 15,
  },
  progressFill: { height: "100%", borderRadius: 4 },
  patioStats: { flexDirection: "row", justifyContent: "space-around" },
  patioStat: { alignItems: "center" },
  patioStatValue: { fontSize: 16, fontWeight: "bold", color: "#333" },
  patioStatLabel: { fontSize: 12, color: "#666", marginTop: 2 },
  refreshButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 20,
  },
  refreshButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  errorIcon: { fontSize: 48, marginBottom: 15 },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#dc3545",
    marginBottom: 10,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
});

export default MonitorScreen;
