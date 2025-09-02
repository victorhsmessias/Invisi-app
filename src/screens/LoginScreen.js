import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = "http://192.168.10.52/attmonitor/api/login.php";

  const handleLogin = async () => {
    if (!username.trim()) {
      Alert.alert("Erro", "Por favor, insira o nome de usuário");
      return;
    } else if (!password.trim()) {
      Alert.alert("Erro", "Por favor, insira sua senha");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {},
        body: JSON.stringify({
          id_nome: username.trim(),
          senha: password,
        }),
      });

      const responseText = await response.text();

      if (response.ok) {
        if (
          responseText.includes("Login failed") ||
          responseText.includes("failed")
        ) {
          Alert.alert("Erro de Login", "Credenciais inválidas");
          return;
        }

        const headerToken =
          response.headers.get("token") ||
          response.headers.get("authorization") ||
          response.headers.get("x-auth-token");

        if (headerToken) {
          await AsyncStorage.setItem("userToken", headerToken);
          await AsyncStorage.setItem("username", username.trim());

          Alert.alert("Sucesso", "Login realizado com sucesso!", [
            {
              text: "OK",
              onPress: () => navigation.replace("Home"),
            },
          ]);
          return;
        }

        try {
          const data = JSON.parse(responseText);
          const token = data.token || data.jwt || data.access_token;

          if (token) {
            await AsyncStorage.setItem("userToken", token);
            await AsyncStorage.setItem("username", username.trim());

            Alert.alert("Sucesso", "Login realizado com sucesso!", [
              {
                text: "OK",
                onPress: () => navigation.replace("Home"),
              },
            ]);
            return;
          }
        } catch (parseError) {
          console.warn("Erro ao parsear resposta JSON:", parseError);
        }

        if (response.status === 200) {
          await AsyncStorage.setItem("userToken", "login_success");
          await AsyncStorage.setItem("username", username.trim());

          Alert.alert("Sucesso", "Login realizado com sucesso!", [
            {
              text: "OK",
              onPress: () => navigation.replace("Home"),
            },
          ]);
          return;
        }

        Alert.alert("Erro", "Resposta inesperada do servidor");
      } else {
        let errorMessage = "Credenciais inválidas";

        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          if (response.status === 404) {
            errorMessage = "Serviço não encontrado. Verifique sua conexão.";
          } else {
            errorMessage = `Erro ${response.status}: ${
              response.statusText || "Credenciais inválidas"
            }`;
          }
        }

        Alert.alert("Erro de Autenticação", errorMessage);
      }
    } catch (error) {
      console.error("Erro de conexão:", error);

      let errorMessage = "Erro de conexão com o servidor";

      if (error.message.includes("Network request failed")) {
        errorMessage =
          "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.";
      } else if (error.message.includes("timeout")) {
        errorMessage = "Tempo limite de conexão excedido";
      }

      Alert.alert("Erro de Conexão", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(["userToken", "username"]);
      setUsername("");
      setPassword("");
      Alert.alert("Sucesso", "Dados limpos com sucesso");
    } catch (error) {
      console.error("Erro ao limpar dados:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.loginContainer}>
          <Text style={styles.title}>Invisi</Text>
          <Text style={styles.subtitle}>Sistema de Monitoramento</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nome de Usuário</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Digite seu nome de usuário"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Digite sua senha"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Entrar</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  keyboardAvoid: {
    flex: 1,
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  loginButton: {
    height: 50,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default LoginScreen;
