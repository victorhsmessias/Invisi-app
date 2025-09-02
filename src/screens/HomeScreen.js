import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HomeScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [userToken, setUserToken] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const navigateToSection = useCallback(
    (section) => {
      switch (section) {
        case "Monitor":
          navigation.navigate("Monitor");
          break;
        default:
          Alert.alert("Navegação", `Tela "${section}" em desenvolvimento`);
          break;
      }
    },
    [navigation]
  );

  const loadUserData = useCallback(async () => {
    try {
      const [savedUsername, savedToken] = await AsyncStorage.multiGet([
        "username",
        "userToken",
      ]);

      if (savedUsername[1]) setUsername(savedUsername[1]);
      if (savedToken[1]) setUserToken(savedToken[1]);
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
    }
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert("Confirmar Logout", "Tem certeza que deseja sair do sistema?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove(["userToken", "username"]);
            navigation.replace("Login");
          } catch (error) {
            console.error("Erro ao fazer logout:", error);
            Alert.alert("Erro", "Erro ao sair do sistema");
          }
        },
      },
    ]);
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadUserData();
      setCurrentTime(new Date());
    } catch (error) {
      console.error("Erro ao atualizar:", error);
    } finally {
      setRefreshing(false);
    }
  }, [loadUserData]);

  useEffect(() => {
    loadUserData();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, [loadUserData]);

  const formatDateTime = (date) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleDateString("pt-BR", options);
  };

  const menuItems = [
    {
      id: "monitor",
      title: "Monitor",
      subtitle: "Visualizar dados em tempo real",
      icon: "📊",
      color: "#007AFF",
    },
    {
      id: "contratos",
      title: "Contratos",
      subtitle: "Gerenciar contratos e filas",
      icon: "📋",
      color: "#28a745",
    },
    {
      id: "transito",
      title: "Trânsito",
      subtitle: "Monitoramento de trânsito",
      icon: "🚛",
      color: "#ffc107",
    },
    {
      id: "descarga",
      title: "Descarga",
      subtitle: "Pátio e fila de descarga",
      icon: "📦",
      color: "#17a2b8",
    },
    {
      id: "carga",
      title: "Carga",
      subtitle: "Pátio e fila de carga",
      icon: "🏗️",
      color: "#fd7e14",
    },
    {
      id: "relatorios",
      title: "Relatórios",
      subtitle: "Relatórios e análises",
      icon: "📈",
      color: "#6f42c1",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              <Text style={styles.welcomeText}>Bem-vindo,</Text>
              <Text style={styles.usernameText}>
                {username
                  ? username.charAt(0).toUpperCase() +
                    username.slice(1).toLowerCase()
                  : "Usuário"}
              </Text>
              <Text style={styles.dateText}>{formatDateTime(currentTime)}</Text>
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Sair</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* System Status */}
        <View style={styles.statusContainer}>
          <View style={styles.statusCard}>
            <View style={[styles.statusIndicator, styles.statusOnline]} />
            <Text style={styles.statusText}>Sistema Online</Text>
          </View>
        </View>

        {/* Menu Grid */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Sistema de Monitoramento</Text>

          <View style={styles.menuGrid}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, { borderLeftColor: item.color }]}
                onPress={() => navigateToSection(item.title)}
              >
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <View style={styles.menuItemText}>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                    <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Resumo Rápido</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Operações Hoje</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Em Trânsito</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Na Fila</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0%</Text>
              <Text style={styles.statLabel}>Eficiência</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Invisi - Sistema de Monitoramento
          </Text>
          <Text style={styles.versionText}>Versão 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: "#ffffff",
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  usernameText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: "#888",
    textTransform: "capitalize",
  },
  logoutButton: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  statusContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  statusCard: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusOnline: {
    backgroundColor: "#28a745",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  menuContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  menuGrid: {
    gap: 12,
  },
  menuItem: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    width: "48%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  versionText: {
    fontSize: 12,
    color: "#999",
  },
});

export default HomeScreen;
