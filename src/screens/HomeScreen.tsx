import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { useTransportData } from "../hooks/useTransportData";
import { useGlobalFilters } from "../hooks/useGlobalFilters";
import { useFilterLoader } from "../hooks/useFilterLoader";
import useBackgroundUpdates from "../hooks/useBackgroundUpdates";
import useIntelligentRefresh from "../hooks/useIntelligentRefresh";
import {
  StatusCard,
  LoadingSpinner,
  ErrorMessage,
  SideMenu,
  BackgroundLoadingIndicator,
  Header,
  UpdateBanner,
} from "../components";
import { COLORS, FILIAIS, SCREEN_NAMES } from "../constants";
import { SHORT_DELAY, AUTO_HIDE_SHORT } from "../constants/timing";

const HomeScreen = ({ navigation }) => {
  const { state, actions } = useApp();
  const { data, loading, lastUpdate, refresh, error } = useTransportData();
  const { selectedFilters } = useGlobalFilters();
  const { preloadAllFilters, hasValidCache } = useFilterLoader();
  const [menuVisible, setMenuVisible] = useState(false);
  const [hasShownInitialData, setHasShownInitialData] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Background updates
  const {
    isUpdating: isBackgroundUpdating,
    startBackgroundUpdate,
    finishBackgroundUpdate,
    shouldShowIndicator,
  } = useBackgroundUpdates();

  // Refresh inteligente
  const { manualRefresh, silentRefresh, updateActivity, isDataStale } =
    useIntelligentRefresh(refresh, {
      lastUpdate,
      enabled: state.isLoggedIn,
    });

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (state.isLoggedIn && data && Object.keys(data).length > 0) {
      setHasShownInitialData(true);
    }
  }, [data, state.isLoggedIn]);

  useEffect(() => {
    if (state.isLoggedIn) {
      const timer = setTimeout(() => {
        if (__DEV__) {
          console.log(
            "[HomeScreen] Iniciando precarregamento de filtros em background"
          );
        }
        preloadAllFilters().catch((error) => {
          if (__DEV__) {
            console.log("[HomeScreen] Erro no precarregamento:", error);
          }
        });
      }, SHORT_DELAY);

      return () => clearTimeout(timer);
    }
  }, [state.isLoggedIn, preloadAllFilters]);

  const onRefresh = async () => {
    updateActivity();
    setIsRefreshing(true);
    try {
      await manualRefresh();
      setHasShownInitialData(true);
    } catch (err) {
      console.error("Erro ao fazer refresh:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFilialChange = (filial) => {
    actions.setFilial(filial);

    if (!hasValidCache(filial)) {
      if (__DEV__) {
        console.log(
          `[HomeScreen] Filtros não em cache para ${filial}, carregamento será automático`
        );
      }
    }
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

  if (loading && !hasShownInitialData) {
    return <LoadingSpinner text="Carregando dashboard..." />;
  }

  if (error && !hasShownInitialData && !loading) {
    return (
      <ErrorMessage
        message={error}
        onRetry={manualRefresh}
        retryText="Tentar novamente"
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BackgroundLoadingIndicator
        visible={shouldShowIndicator()}
        text="Atualizando dashboard..."
        variant="discrete"
        autoHide={true}
        autoHideDuration={AUTO_HIDE_SHORT}
        position="bottom"
      />

      <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
        <Header
          title="Invisi"
          subtitle={`Filial: ${state.selectedFilial}`}
          onMenuPress={() => setMenuVisible(true)}
          onRefreshPress={onRefresh}
          isRefreshing={isRefreshing}
          showRefreshButton={true}
          showLoadingIndicator={shouldShowIndicator()}
        />

        {lastUpdate && (
          <View style={styles.updateContainer}>
            <Text style={styles.updateText}>
              Última atualização: {lastUpdate.toLocaleTimeString("pt-BR")}
            </Text>
          </View>
        )}

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

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
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
                loading={false}
                onPress={card.onPress}
              />
            ))}
          </View>
        </ScrollView>
      </Animated.View>

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
