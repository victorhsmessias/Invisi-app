// App.js
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import TransitoScreen from "./src/screens/TransitoScreen";
import FilaDescargaScreen from "./src/screens/FilaDescargaScreen";
import FilaCargaScreen from "./src/screens/FilaCargaScreen";
import PatioDescargaScreen from "./src/screens/PatioDescarga";
import PatioCargaScreen from "./src/screens/PatioCargaScreen";

const Stack = createStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      setIsLoggedIn(!!token);
    } catch (error) {
      console.error("Erro ao verificar login:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isLoggedIn ? "Home" : "Login"}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="Transito"
          component={TransitoScreen}
          options={{ title: "Veículos em Trânsito" }}
        />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="FilaDescarga"
          component={FilaDescargaScreen}
          options={{ title: "Fila de Descarga" }}
        />
        <Stack.Screen
          name="FilaCarga"
          component={FilaCargaScreen}
          options={{ title: "Fila de Carga" }}
        />
        <Stack.Screen
          name="PatioDescarga"
          component={PatioDescargaScreen}
          options={{ title: "Pátio de Descarga" }}
        />
        <Stack.Screen
          name="PatioCarga"
          component={PatioCargaScreen}
          options={{ title: "Pátio de Carga" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
