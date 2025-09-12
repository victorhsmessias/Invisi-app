import React, { useState, useEffect, useCallback, useRef, memo } from "react";
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
  Dimensions,
  Platform,
  Animated,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: screenWidth } = Dimensions.get("window");

// Configurações
const API_CONFIG = {
  BASE_URL: "http://192.168.10.201/attmonitor/api",
  CACHE_TIME: 2 * 60 * 1000, // 2 minutos
  AUTO_REFRESH: 30 * 1000, // 30 segundos
};

// Componente de Card de Status Otimizado
const StatusCard = memo(
  ({ title, value, icon, color, loading, subtitle, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    const handlePress = () => {
      if (onPress) {
        onPress();
      }
    };

    const getColorByValue = (val, type) => {
      if (type === "fila") {
        if (val > 20) return "#dc3545";
        if (val > 10) return "#ffc107";
        return "#28a745";
      }
      return color;
    };

    const displayColor = getColorByValue(
      value,
      title.includes("fila") ? "fila" : "normal"
    );

    return (
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <Animated.View
          style={[
            styles.statusCard,
            {
              transform: [{ scale: scaleAnim }],
              borderLeftColor: displayColor,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>{icon}</Text>
            <View style={styles.cardContent}>
              {loading ? (
                <ActivityIndicator size="small" color={displayColor} />
              ) : (
                <>
                  <Text style={[styles.cardValue, { color: displayColor }]}>
                    {value}
                  </Text>
                  {subtitle && (
                    <Text style={styles.cardSubtitle}>{subtitle}</Text>
                  )}
                </>
              )}
              <Text style={styles.cardTitle}>{title}</Text>
            </View>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  }
);

// Menu Lateral (Drawer)
const SideMenu = memo(({ visible, onClose, navigation, username }) => {
  const slideAnim = useRef(new Animated.Value(-screenWidth * 0.75)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -screenWidth * 0.75,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const menuItems = [
    {
      id: "contratos",
      title: "Contratos",
      icon: "📋",
      screen: null,
      description: "Gestão de contratos",
    },
    {
      id: "divider",
      isDivider: true,
    },
    {
      id: "logout",
      title: "Sair",
      icon: "🚪",
      isLogout: true,
      description: "Encerrar sessão",
    },
  ];

  const handleMenuPress = (item) => {
    onClose();

    if (item.isLogout) {
      Alert.alert("Confirmar Logout", "Deseja sair do sistema?", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.multiRemove(["userToken", "username"]);
            navigation.replace("Login");
          },
        },
      ]);
    } else if (item.screen) {
      navigation.navigate(item.screen);
    } else {
      Alert.alert("Em Desenvolvimento", `"${item.title}" em breve!`);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.menuOverlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.menuContainer,
                { transform: [{ translateX: slideAnim }] },
              ]}
            >
              {/* Header do Menu */}
              <View style={styles.menuHeader}>
                <View style={styles.userAvatar}>
                  <Text style={styles.avatarText}>
                    {username ? username[0].toUpperCase() : "U"}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{username || "Usuário"}</Text>
                  <Text style={styles.userRole}>Operador</Text>
                </View>
              </View>

              {/* Menu Items */}
              <ScrollView style={styles.menuScroll}>
                {menuItems.map((item) => {
                  if (item.isDivider) {
                    return <View key={item.id} style={styles.menuDivider} />;
                  }

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.menuItem,
                        item.isLogout && styles.menuItemLogout,
                      ]}
                      onPress={() => handleMenuPress(item)}
                    >
                      <Text style={styles.menuItemIcon}>{item.icon}</Text>
                      <View style={styles.menuItemContent}>
                        <Text
                          style={[
                            styles.menuItemTitle,
                            item.isLogout && styles.menuItemTitleLogout,
                          ]}
                        >
                          {item.title}
                        </Text>
                        <Text style={styles.menuItemDescription}>
                          {item.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
});

// Hook para buscar dados
const useTransportData = (filial) => {
  const [data, setData] = useState({
    emTransito: 0,
    filaDescarga: 0,
    filaCarga: 0,
    patioDescarregando: 0,
    patioCarregando: 0,
    descargasHoje: 0,
    cargasHoje: 0,
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      setLoading(true);

      const [
        responseTransito,
        responseFilaDescarga,
        responseFilaCarga,
        responsePatioDesc,
        responsePatioCarga,
      ] = await Promise.all([
        // 1. Em Trânsito
        fetch(`${API_CONFIG.BASE_URL}/monitor.php`, {
          method: "POST",
          headers: {
            token: token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            AttApi: {
              tipoOperacao: "monitor_transito",
              filtro_filial: filial,
              filtro_servico: {
                armazenagem: 1,
                transbordo: 1,
                pesagem: 0,
              },
              filtro_op_padrao: {
                rodo_ferro: 1,
                ferro_rodo: 1,
                rodo_rodo: 1,
                outros: 0,
              },
            },
          }),
        }),

        // 2. Fila de Descarga
        fetch(`${API_CONFIG.BASE_URL}/monitor.php`, {
          method: "POST",
          headers: {
            token: token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            AttApi: {
              tipoOperacao: "monitor_fila_desc",
              filtro_filial: filial,
              filtro_servico: {
                armazenagem: 1,
                transbordo: 1,
                pesagem: 0,
              },
              filtro_op_padrao: {
                rodo_ferro: 1,
                ferro_rodo: 1,
                rodo_rodo: 1,
                outros: 0,
              },
            },
          }),
        }),

        // 3. Fila de Carga
        fetch(`${API_CONFIG.BASE_URL}/monitor.php`, {
          method: "POST",
          headers: {
            token: token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            AttApi: {
              tipoOperacao: "monitor_fila_carga",
              filtro_filial: filial,
              filtro_servico: {
                armazenagem: 1,
                transbordo: 1,
                pesagem: 0,
              },
              filtro_op_padrao: {
                rodo_ferro: 1,
                ferro_rodo: 1,
                rodo_rodo: 1,
                outros: 0,
              },
            },
          }),
        }),

        // 4. Pátio Descarga
        fetch(`${API_CONFIG.BASE_URL}/monitor.php`, {
          method: "POST",
          headers: {
            token: token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            AttApi: {
              tipoOperacao: "monitor_patio_desc",
              filtro_filial: filial,
              filtro_servico: {
                armazenagem: 1,
                transbordo: 1,
                pesagem: 0,
              },
              filtro_op_padrao: {
                rodo_ferro: 1,
                ferro_rodo: 1,
                rodo_rodo: 1,
                outros: 0,
              },
            },
          }),
        }),
        // 5. Pátio Carga
        fetch(`${API_CONFIG.BASE_URL}/monitor.php`, {
          method: "POST",
          headers: {
            token: token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            AttApi: {
              tipoOperacao: "monitor_patio_carga",
              filtro_filial: filial,
              filtro_servico: {
                armazenagem: 1,
                transbordo: 1,
                pesagem: 0,
              },
              filtro_op_padrao: {
                rodo_ferro: 1,
                ferro_rodo: 1,
                rodo_rodo: 1,
                outros: 0,
              },
            },
          }),
        }),
      ]);

      // Converter para JSON
      const [
        dataTransito,
        dataFilaDescarga,
        dataFilaCarga,
        dataPatioDesc,
        dataPatioCarga,
      ] = await Promise.all([
        responseTransito.json(),
        responseFilaDescarga.json(),
        responseFilaCarga.json(),
        responsePatioDesc.json(),
        responsePatioCarga.json(),
      ]);

      // 1. Em Trânsito (já existente)
      const transitoVeiculos =
        dataTransito.dados?.listaTransito?.transitoVeiculos || [];
      const totalEmTransito = transitoVeiculos.reduce(
        (acc, item) => acc + (item.t_veiculos || 0),
        0
      );

      // 2. Fila de Descarga
      const filaDescargaVeiculos =
        dataFilaDescarga.dados?.listaFilaDescarga?.filaDescargaVeiculos || [];

      const filaDescarga = filaDescargaVeiculos.reduce(
        (acc, item) => acc + (item.fd_veiculos || 0),
        0
      );

      // 3. Fila de Carga
      const filaCargaVeiculos =
        dataFilaCarga.dados?.listaFilaCarga?.filaCargaVeiculos || [];

      const filaCarga = filaCargaVeiculos.reduce(
        (acc, item) => acc + (item.fc_veiculos || 0),
        0
      );

      // 4. Pátio Descarregando
      const patioDescargaVeiculos =
        dataPatioDesc.dados?.listaPatioDescarga?.patioDescargaVeiculos || [];

      const patioDescarregando = patioDescargaVeiculos.reduce(
        (acc, item) => acc + (item.pd_veiculos || 0),
        0
      );

      // 5. Pátio Carregando
      const patioCargaVeiculos =
        dataPatioCarga.dados?.listaPatioCarga?.patioCargaVeiculos || [];

      const patioCarregando = patioCargaVeiculos.reduce(
        (acc, item) => acc + (item.pc_veiculos || 0),
        0
      );

      // 6 e 7. Descargas e Cargas Hoje
      const responseMonitor = await fetch(
        `${API_CONFIG.BASE_URL}/d_monitor.php`,
        {
          method: "POST",
          headers: {
            token: token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            AttApi: {
              tipoOperacao: "monitor",
              filtro_filial: filial,
              filtro_servico: {
                armazenagem: 1,
                transbordo: 1,
                pesagem: 0,
              },
              filtro_op_padrao: {
                rodo_ferro: 1,
                ferro_rodo: 1,
                rodo_rodo: 1,
                outros: 0,
              },
              filtro_data_inicio: new Date().toISOString().split("T")[0],
              filtro_data_fim: new Date().toISOString().split("T")[0],
              filtro_acumulador: {
                dia: 1,
                mes: 0,
                ano: 0,
              },
            },
          }),
        }
      );

      const dataMonitor = await responseMonitor.json();

      const descargasHoje =
        dataMonitor.dados?.total_descargas ||
        dataMonitor.dados?.descargas_hoje ||
        dataMonitor.descargas ||
        0;

      const cargasHoje =
        dataMonitor.dados?.total_cargas ||
        dataMonitor.dados?.cargas_hoje ||
        dataMonitor.cargas ||
        0;

      const newData = {
        emTransito: totalEmTransito,
        filaDescarga: filaDescarga,
        filaCarga: filaCarga,
        patioDescarregando: patioDescarregando,
        patioCarregando: patioCarregando,
        descargasHoje: descargasHoje,
        cargasHoje: cargasHoje,
      };

      // Atualizar estados
      setData(newData);
      setLastUpdate(new Date());

      // Salvar em cache
      await AsyncStorage.setItem(
        "transportCache",
        JSON.stringify({ data: newData, timestamp: Date.now() })
      );
    } catch (error) {
      console.error("Erro ao buscar dados:", error);

      // Tentar usar cache em caso de erro
      try {
        const cached = await AsyncStorage.getItem("transportCache");
        if (cached) {
          const { data: cachedData } = JSON.parse(cached);
          setData(cachedData);
        }
      } catch (cacheError) {
        console.error("Erro ao recuperar cache:", cacheError);
      }
    } finally {
      setLoading(false);
    }
  }, [filial]);

  return { data, loading, fetchData, lastUpdate };
};

const HomeScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedFilial, setSelectedFilial] = useState("LDA");
  const { data, loading, fetchData, lastUpdate } =
    useTransportData(selectedFilial);
  useEffect(() => {
    fetchData();
  }, [selectedFilial]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUserData();
    fetchData();

    // Animação de entrada
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Auto-refresh
    const interval = setInterval(fetchData, API_CONFIG.AUTO_REFRESH);
    return () => clearInterval(interval);
  }, []);

  const loadUserData = async () => {
    try {
      const savedUsername = await AsyncStorage.getItem("username");
      if (savedUsername) {
        setUsername(savedUsername);
      }
    } catch (error) {
      console.log("Erro ao carregar usuário:", error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const transportCards = [
    {
      id: "transito",
      title: "Em Trânsito",
      value: data.emTransito,
      icon: "🚛",
      color: "#ffc107",
      subtitle: "veículos",
      onPress: () =>
        navigation.navigate("Transito", { filial: selectedFilial }),
    },
    {
      id: "filaDescarga",
      title: "Na Fila de Descarga",
      value: data.filaDescarga,
      icon: "⏳",
      color: "#17a2b8",
      subtitle: "aguardando",
      onPress: () =>
        navigation.navigate("FilaDescarga", { filial: selectedFilial }),
    },
    {
      id: "filaCarga",
      title: "Na Fila de Carga",
      value: data.filaCarga,
      icon: "⏰",
      color: "#fd7e14",
      subtitle: "aguardando",
      onPress: () =>
        navigation.navigate("FilaCarga", { filial: selectedFilial }),
    },
    {
      id: "patioDescarregando",
      title: "No Pátio, Descarregando",
      value: data.patioDescarregando,
      icon: "📦",
      color: "#6f42c1",
      subtitle: "em operação",
      onPress: () =>
        navigation.navigate("PatioDescarga", { filial: selectedFilial }),
    },
    {
      id: "patioCarregando",
      title: "No Pátio, Carregando",
      value: data.patioCarregando,
      icon: "🏗️",
      color: "#20c997",
      subtitle: "em operação",
      onPress: () =>
        navigation.navigate("PatioCarga", { filial: selectedFilial }),
    },
    {
      id: "descargasHoje",
      title: "Descargas Hoje",
      value: data.descargasHoje,
      icon: "✅",
      color: "#28a745",
      subtitle: "concluídas",
    },
    {
      id: "cargasHoje",
      title: "Cargas Hoje",
      value: data.cargasHoje,
      icon: "✅",
      color: "#007AFF",
      subtitle: "concluídas",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setMenuVisible(true)}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Invisi</Text>
            <Text style={styles.headerSubtitle}>Filial: {selectedFilial}</Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.refreshIcon}>🔄</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Última atualização */}
        {lastUpdate && (
          <View style={styles.updateContainer}>
            <Text style={styles.updateText}>
              Última atualização: {lastUpdate.toLocaleTimeString("pt-BR")}
            </Text>
          </View>
        )}

        {/* Seletor de Filial */}
        <View style={styles.filialSelector}>
          {["LDA", "CHP"].map((filial) => (
            <TouchableOpacity
              key={filial}
              style={[
                styles.filialButton,
                selectedFilial === filial && styles.filialButtonActive,
              ]}
              onPress={() => setSelectedFilial(filial)}
            >
              <Text
                style={[
                  styles.filialText,
                  selectedFilial === filial && styles.filialTextActive,
                ]}
              >
                {filial}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cards de Status do Transporte */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#007AFF"]}
              tintColor="#007AFF"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardsContainer}>
            {transportCards.map((card, index) => (
              <StatusCard
                key={card.id}
                title={card.title}
                value={card.value}
                icon={card.icon}
                color={card.color}
                subtitle={card.subtitle}
                loading={loading}
                onPress={card.onPress}
              />
            ))}
          </View>
        </ScrollView>
      </Animated.View>

      {/* Menu Lateral */}
      <SideMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        navigation={navigation}
        username={username}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
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
        elevation: 4,
      },
    }),
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: "#333",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  refreshIcon: {
    fontSize: 20,
  },
  updateContainer: {
    backgroundColor: "#e8f4fd",
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  updateText: {
    fontSize: 12,
    color: "#0066cc",
    textAlign: "center",
  },
  filialSelector: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  filialButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    marginHorizontal: 5,
    borderRadius: 8,
  },
  filialButtonActive: {
    backgroundColor: "#007AFF",
  },
  filialText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  filialTextActive: {
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  cardsContainer: {
    padding: 15,
  },
  statusCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIcon: {
    fontSize: 28,
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    color: "#666",
  },
  summaryContainer: {
    backgroundColor: "#ffffff",
    marginHorizontal: 15,
    marginTop: 10,
    padding: 20,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 15,
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 10,
  },
  // Menu Lateral Styles
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  menuContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: screenWidth * 0.75,
    backgroundColor: "#ffffff",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  menuHeader: {
    backgroundColor: "#007AFF",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ffffff30",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    textTransform: "capitalize",
  },
  userRole: {
    fontSize: 14,
    color: "#ffffff90",
    marginTop: 2,
  },
  menuScroll: {
    flex: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemLogout: {
    backgroundColor: "#fff5f5",
  },
  menuItemIcon: {
    fontSize: 24,
    marginRight: 15,
    width: 30,
    textAlign: "center",
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  menuItemTitleLogout: {
    color: "#dc3545",
  },
  menuItemDescription: {
    fontSize: 12,
    color: "#666",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 10,
  },
  menuFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    alignItems: "center",
  },
  menuFooterText: {
    fontSize: 12,
    color: "#999",
  },
});

export default HomeScreen;
