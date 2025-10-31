import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Animated,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { StackScreenProps } from "@react-navigation/stack";
import { useApp } from "../context/AppContext";
import { useTransportData } from "../hooks/useTransportData";
import { useGlobalFilters } from "../hooks/useGlobalFilters";
import { useFilterLoader } from "../hooks/useFilterLoader";
import useBackgroundUpdates from "../hooks/useBackgroundUpdates";
import useIntelligentRefresh from "../hooks/useIntelligentRefresh";
import {
  StatusCard,
  SkeletonCard,
  FilialSelector,
  LoadingSpinner,
  ErrorMessage,
  SideMenu,
  BackgroundLoadingIndicator,
  Header,
} from "../components";
import { COLORS, FILIAIS, SCREEN_NAMES } from "../constants";
import { SHORT_DELAY, AUTO_HIDE_SHORT } from "../constants/timing";
import type { RootStackParamList, Filial } from "../types";
import { shouldShowFilialSelector, isAdmin } from "../utils/permissions";

interface TransportCardData {
  id: string;
  title: string;
  value: number;
  icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
  color: string;
  subtitle: string;
  onPress: () => void;
}

type HomeScreenProps = StackScreenProps<RootStackParamList, "Home">;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { state, actions } = useApp();
  const { data, loading, lastUpdate, refresh, error } = useTransportData();
  const { selectedFilters } = useGlobalFilters();
  const { preloadAllFilters, hasValidCache } = useFilterLoader();
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [hasShownInitialData, setHasShownInitialData] =
    useState<boolean>(false);
  const [isFilialChanging, setIsFilialChanging] = useState<boolean>(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const {
    isUpdating: isBackgroundUpdating,
    startBackgroundUpdate,
    finishBackgroundUpdate,
    shouldShowIndicator,
  } = useBackgroundUpdates();

  const { manualRefresh, silentRefresh, updateActivity, isDataStale } =
    useIntelligentRefresh(refresh, {
      lastUpdate,
      enabled: state.isLoggedIn,
    });

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (state.isLoggedIn && data && Object.keys(data).length > 0) {
      setHasShownInitialData(true);
    }
  }, [data, state.isLoggedIn]);

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

  const handleFilialChange = useCallback(
    async (filial: Filial) => {
      if (filial === state.selectedFilial) return;

      setIsFilialChanging(true);

      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }).start();

      actions.setFilial(filial);

      setTimeout(() => {
        setIsFilialChanging(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 500);
    },
    [actions, hasValidCache, state.selectedFilial, fadeAnim]
  );

  const transportCards = useMemo<TransportCardData[]>(
    () => [
      {
        id: "transito",
        title: "Em Trânsito",
        value: data.emTransito,
        icon: "car-outline",
        color: COLORS.primary,
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
        icon: "timer-outline",
        color: COLORS.primary,
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
        icon: "timer-outline",
        color: COLORS.primary,
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
        icon: "cube-outline",
        color: COLORS.primary,
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
        icon: "construct-outline",
        color: COLORS.primary,
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
        icon: "checkmark-circle-outline",
        color: COLORS.primary,
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
        icon: "checkmark-circle-outline",
        color: COLORS.primary,
        subtitle: "concluídas",
        onPress: () =>
          navigation.navigate(SCREEN_NAMES.CARGAS_HOJE, {
            filial: state.selectedFilial,
          }),
      },
    ],
    [data, state.selectedFilial, navigation]
  );

  const renderItem = useCallback(({ item }: { item: TransportCardData }) => {
    return (
      <StatusCard
        title={item.title}
        value={item.value}
        icon={item.icon}
        color={item.color}
        subtitle={item.subtitle}
        loading={false}
        onPress={item.onPress}
      />
    );
  }, []);

  const renderSkeletonItem = useCallback(() => <SkeletonCard />, []);

  const keyExtractor = useCallback((item: TransportCardData) => item.id, []);

  const skeletonData = useMemo(
    () =>
      Array(7)
        .fill(null)
        .map((_, i) => ({ id: `skeleton-${i}` })),
    []
  );

  if (state.isLoading) {
    return <LoadingSpinner text="Carregando aplicação..." />;
  }

  if (state.isInitializing) {
    return (
      <LoadingSpinner
        text={
          isAdmin(state.userRole)
            ? "Carregando filtros de todas as filiais..."
            : "Preparando sua filial..."
        }
      />
    );
  }

  if (loading && !hasShownInitialData) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Invisi"
          subtitle={`Filial: ${state.selectedFilial}`}
          onMenuPress={() => setMenuVisible(true)}
          showRefreshButton={false}
        />

        {shouldShowFilialSelector(state.userRole) && (
          <FilialSelector
            filiais={FILIAIS}
            selectedFilial={state.selectedFilial}
            onFilialChange={handleFilialChange}
            disabled={true}
          />
        )}

        <FlatList
          data={skeletonData}
          keyExtractor={(item) => item.id}
          renderItem={renderSkeletonItem}
          contentContainerStyle={styles.cardsContainer}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    );
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
            {isFilialChanging && (
              <Text style={styles.changingText}> • Carregando...</Text>
            )}
          </View>
        )}

        {shouldShowFilialSelector(state.userRole) && (
          <FilialSelector
            filiais={FILIAIS}
            selectedFilial={state.selectedFilial}
            onFilialChange={handleFilialChange}
            isLoading={isFilialChanging}
            disabled={isRefreshing || isFilialChanging}
          />
        )}

        <FlatList
          data={transportCards}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={styles.cardsContainer}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={4}
          windowSize={5}
          initialNumToRender={7}
          getItemLayout={(data, index) => ({
            length: 120,
            offset: 120 * index,
            index,
          })}
        />
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  updateText: {
    fontSize: 12,
    color: "#0066cc",
    textAlign: "center",
  },
  changingText: {
    fontSize: 12,
    color: "#0066cc",
    fontWeight: "600",
  },
  cardsContainer: {
    padding: 15,
  },
});

export default HomeScreen;
