import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Platform,
} from "react-native";
import { useApp } from "../context/AppContext";
import { useTransportData } from "../hooks/useTransportData";
import {
  StatusCard,
  LoadingSpinner,
  ErrorMessage,
  SideMenu,
} from "../components";
import { COLORS, FILIAIS, SCREEN_NAMES } from "../constants";

const HomeScreen = ({ navigation }) => {
  const { state, actions } = useApp();
  const { data, loading, lastUpdate, refresh, error } = useTransportData();
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleFilialChange = (filial) => {
    actions.setFilial(filial);
  };

  const transportCards = [
    {
      id: "transito",
      title: "Em Trânsito",
      value: data.emTransito,
      icon: "🚛",
      color: COLORS.warning,
      subtitle: "veículos",
      onPress: () =>
        navigation.navigate(SCREEN_NAMES.TRANSITO, {
          filial: state.selectedFilial,
        }),
    },
    {
      id: "filaDescarga",
      title: "Na Fila de Descarga",
      value: data.filaDescarga,
      icon: "⏳",
      color: COLORS.info,
      subtitle: "aguardando",
      onPress: () =>
        navigation.navigate(SCREEN_NAMES.FILA_DESCARGA, {
          filial: state.selectedFilial,
        }),
    },
    {
      id: "filaCarga",
      title: "Na Fila de Carga",
      value: data.filaCarga,
      icon: "⏰",
      color: COLORS.orange,
      subtitle: "aguardando",
      onPress: () =>
        navigation.navigate(SCREEN_NAMES.FILA_CARGA, {
          filial: state.selectedFilial,
        }),
    },
    {
      id: "patioDescarregando",
      title: "No Pátio, Descarregando",
      value: data.patioDescarregando,
      icon: "📦",
      color: COLORS.purple,
      subtitle: "em operação",
      onPress: () =>
        navigation.navigate(SCREEN_NAMES.PATIO_DESCARGA, {
          filial: state.selectedFilial,
        }),
    },
    {
      id: "patioCarregando",
      title: "No Pátio, Carregando",
      value: data.patioCarregando,
      icon: "🏗️",
      color: COLORS.teal,
      subtitle: "em operação",
      onPress: () =>
        navigation.navigate(SCREEN_NAMES.PATIO_CARGA, {
          filial: state.selectedFilial,
        }),
    },
    {
      id: "descargasHoje",
      title: "Descargas Hoje",
      value: data.descargasHoje,
      icon: "✅",
      color: COLORS.success,
      subtitle: "concluídas",
      onPress: () =>
        navigation.navigate(SCREEN_NAMES.DESCARGAS_HOJE, {
          filial: state.selectedFilial,
        }),
    },
    {
      id: "cargasHoje",
      title: "Cargas Hoje",
      value: data.cargasHoje,
      icon: "✅",
      color: COLORS.primary,
      subtitle: "concluídas",
      onPress: () =>
        navigation.navigate(SCREEN_NAMES.CARGAS_HOJE, {
          filial: state.selectedFilial,
        }),
    },
  ];

  if (state.isLoading) {
    return <LoadingSpinner text="Carregando aplicação..." />;
  }

  if (error && !loading) {
    return (
      <ErrorMessage
        message={error}
        onRetry={refresh}
        retryText="Tentar novamente"
      />
    );
  }

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
            <Text style={styles.headerSubtitle}>
              Filial: {state.selectedFilial}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.refreshIcon}>🔄</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Last Update */}
        {lastUpdate && (
          <View style={styles.updateContainer}>
            <Text style={styles.updateText}>
              Última atualização: {lastUpdate.toLocaleTimeString("pt-BR")}
            </Text>
          </View>
        )}

        {/* Filial Selector */}
        <View style={styles.filialSelector}>
          {FILIAIS.map((filial) => (
            <TouchableOpacity
              key={filial}
              style={[
                styles.filialButton,
                state.selectedFilial === filial && styles.filialButtonActive,
              ]}
              onPress={() => handleFilialChange(filial)}
            >
              <Text
                style={[
                  styles.filialText,
                  state.selectedFilial === filial && styles.filialTextActive,
                ]}
              >
                {filial}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Status Cards */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardsContainer}>
            {transportCards.map((card) => (
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

      {/* Side Menu */}
      <SideMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        navigation={navigation}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
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
    color: COLORS.black,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
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
    backgroundColor: COLORS.white,
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
    backgroundColor: COLORS.primary,
  },
  filialText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray,
  },
  filialTextActive: {
    color: COLORS.white,
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
});

export default HomeScreen;
