import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components";
import { COLORS, SCREEN_NAMES } from "../constants";

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error, isLoggedIn } = useAuth();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Auto-navigate if already logged in
    if (isLoggedIn) {
      navigation.replace(SCREEN_NAMES.HOME);
      return;
    }

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [isLoggedIn]);

  const handleLogin = async () => {
    try {
      const result = await login(username, password);
      if (result.success) {
        Alert.alert("Sucesso", "Login realizado com sucesso!", [
          {
            text: "OK",
            onPress: () => navigation.replace(SCREEN_NAMES.HOME),
          },
        ]);
      }
    } catch (err) {
      Alert.alert("Erro de Login", err.message);
    }
  };

  const isFormValid = username.trim().length > 0 && password.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Animated.View style={[styles.loginContainer, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Invisi</Text>
            <Text style={styles.subtitle}>Login</Text>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Username Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nome de Usuário</Text>
            <TextInput
              style={[styles.input, !isFormValid && styles.inputInvalid]}
              value={username}
              onChangeText={setUsername}
              placeholder="Digite seu nome de usuário"
              placeholderTextColor={COLORS.gray}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!loading}
              returnKeyType="next"
            />
          </View>

          {/* Password Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={[styles.input, !isFormValid && styles.inputInvalid]}
              value={password}
              onChangeText={setPassword}
              placeholder="Digite sua senha"
              placeholderTextColor={COLORS.gray}
              autoCorrect={false}
              editable={!loading}
              secureTextEntry={true}
              returnKeyType="go"
              onSubmitEditing={isFormValid ? handleLogin : null}
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              loading && styles.loginButtonDisabled,
              !isFormValid && styles.loginButtonInvalid
            ]}
            onPress={handleLogin}
            disabled={loading || !isFormValid}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <LoadingSpinner
                  text="Entrando..."
                  size="small"
                  color={COLORS.white}
                />
              </View>
            ) : (
              <Text style={styles.loginButtonText}>Entrar</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
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
    color: COLORS.black,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
  },
  errorContainer: {
    backgroundColor: "#ffe6e6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.black,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: COLORS.white,
    fontSize: 16,
  },
  inputInvalid: {
    borderColor: "#ffcccc",
  },
  loginButton: {
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonInvalid: {
    backgroundColor: "#cccccc",
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default LoginScreen;