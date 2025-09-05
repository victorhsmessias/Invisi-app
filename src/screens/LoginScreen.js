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
  const BACKUP_URL = "http://45.4.111.173:9090/attmonitor/api/login.php"; // URL backup

  const handleLogin = async () => {
    // Validação básica
    if (!username.trim()) {
      Alert.alert("Erro", "Por favor, insira o nome de usuário");
      return;
    } else if (!password.trim()) {
      Alert.alert("Erro", "Por favor, insira sua senha");
      return;
    }

    setLoading(true);

    // Tentar login com retry
    let success = false;
    let lastError = null;
    const urls = [API_URL, BACKUP_URL]; // Tentar URL principal e depois backup

    for (let attempt = 0; attempt < 3; attempt++) {
      // 3 tentativas
      for (const url of urls) {
        try {
          console.log(`Tentativa ${attempt + 1} com URL: ${url}`);

          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              id_nome: username.trim().toUpperCase(),
              senha: password.toUpperCase(),
            }),
          });

          const responseText = await response.text();
          console.log("Status:", response.status);
          console.log("Response preview:", responseText.substring(0, 100));

          if (
            responseText.toLowerCase().includes("failed") ||
            responseText.toLowerCase().includes("invalid") ||
            responseText.toLowerCase().includes("error")
          ) {
            throw new Error("Credenciais inválidas");
          }

          let token = null;

          token =
            response.headers.get("token") ||
            response.headers.get("authorization") ||
            response.headers.get("x-auth-token") ||
            response.headers.get("x-access-token");

          if (!token) {
            try {
              const data = JSON.parse(responseText);
              token =
                data.token ||
                data.jwt ||
                data.access_token ||
                data.accessToken ||
                data.authToken;
            } catch (parseError) {
              console.log("Resposta não é JSON");
            }
          }

          if (!token && response.status === 200) {
            console.log("Status 200 sem token, considerando sucesso");
            token = "success_" + Date.now();
          }

          if (token) {
            await AsyncStorage.setItem("userToken", token);
            await AsyncStorage.setItem("username", username.trim());

            Alert.alert("Sucesso", "Login realizado com sucesso!", [
              {
                text: "OK",
                onPress: () => navigation.replace("Home"),
              },
            ]);

            success = true;
            break;
          }
        } catch (error) {
          console.error(`Erro na tentativa ${attempt + 1}:`, error.message);
          lastError = error;

          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      if (success) break;
    }

    setLoading(false);

    if (!success) {
      let errorMessage = "Não foi possível fazer login";

      if (lastError?.message.includes("Credenciais")) {
        errorMessage = "Usuário ou senha incorretos";
      } else if (lastError?.message.includes("Network")) {
        errorMessage = "Erro de conexão. Verifique sua internet";
      }

      Alert.alert("Erro de Login", errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.loginContainer}>
          {/* Título */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Invisi</Text>
            <Text style={styles.subtitle}>Login </Text>
          </View>

          {/* Campo Usuário */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nome de Usuário</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Digite seu nome de usuário"
              placeholderTextColor="#999"
              autoCapitalize="characters" // Já mostra teclado em maiúsculas
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          {/* Campo Senha */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="Digite sua senha"
                placeholderTextColor="#999"
                autoCorrect={false}
                editable={!loading}
                secureTextEntry={true}
              />
            </View>
          </View>

          {/* Botão de Login */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFF" size="small" />
                <Text style={styles.loginButtonText}>Entrando...</Text>
              </View>
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
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
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
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: "absolute",
    right: 15,
    top: 0,
    height: 50,
    justifyContent: "center",
  },
  eyeText: {
    fontSize: 20,
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
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
  },
  debugContainer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
  },
  debugText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  debugLink: {
    fontSize: 14,
    color: "#007AFF",
    textDecorationLine: "underline",
  },
});

export default LoginScreen;
