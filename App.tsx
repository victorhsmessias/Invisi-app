import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import {
  createStackNavigator,
  CardStyleInterpolators,
} from "@react-navigation/stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider, useApp } from "./src/context/AppContext";
import { LoadingSpinner } from "./src/components";
import { SCREEN_NAMES } from "./src/constants";
import type { RootStackParamList } from "./src/types";

import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import TransitoScreen from "./src/screens/TransitoScreen";
import FilaDescargaScreen from "./src/screens/FilaDescargaScreen";
import FilaCargaScreen from "./src/screens/FilaCargaScreen";
import PatioDescargaScreen from "./src/screens/PatioDescargaScreen";
import PatioCargaScreen from "./src/screens/PatioCargaScreen";
import CargasHojeScreen from "./src/screens/CargasHojeScreen";
import DescargasHojeScreen from "./src/screens/DescargasHojeScreen";
import MonitorCorteScreen from "./src/screens/MonitorCorteScreen";
import ContratosDetalhesScreen from "./src/screens/ContratosDetalhesScreen";

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { state } = useApp();

  if (state.isLoading) {
    return <LoadingSpinner text="Carregando aplicação..." />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={
          state.isLoggedIn ? SCREEN_NAMES.HOME : SCREEN_NAMES.LOGIN
        }
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator:
            CardStyleInterpolators.forFadeFromBottomAndroid,
        }}
      >
        <Stack.Screen name={SCREEN_NAMES.LOGIN} component={LoginScreen} />
        <Stack.Screen name={SCREEN_NAMES.HOME} component={HomeScreen} />
        <Stack.Screen
          name={SCREEN_NAMES.MONITOR_CORTE}
          component={MonitorCorteScreen}
        />
        <Stack.Screen
          name={SCREEN_NAMES.CONTRATOS_DETALHES}
          component={ContratosDetalhesScreen}
        />

        <Stack.Screen
          name={SCREEN_NAMES.CARGAS_HOJE}
          component={CargasHojeScreen}
          options={{ title: "Cargas de Hoje" }}
        />
        <Stack.Screen
          name={SCREEN_NAMES.DESCARGAS_HOJE}
          component={DescargasHojeScreen}
          options={{ title: "Descargas de Hoje" }}
        />
        <Stack.Screen
          name={SCREEN_NAMES.TRANSITO}
          component={TransitoScreen}
          options={{ title: "Veículos em Trânsito" }}
        />
        <Stack.Screen
          name={SCREEN_NAMES.FILA_DESCARGA}
          component={FilaDescargaScreen}
          options={{ title: "Fila de Descarga" }}
        />
        <Stack.Screen
          name={SCREEN_NAMES.FILA_CARGA}
          component={FilaCargaScreen}
          options={{ title: "Fila de Carga" }}
        />
        <Stack.Screen
          name={SCREEN_NAMES.PATIO_DESCARGA}
          component={PatioDescargaScreen}
          options={{ title: "Pátio de Descarga" }}
        />
        <Stack.Screen
          name={SCREEN_NAMES.PATIO_CARGA}
          component={PatioCargaScreen}
          options={{ title: "Pátio de Carga" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
};

export default App;
