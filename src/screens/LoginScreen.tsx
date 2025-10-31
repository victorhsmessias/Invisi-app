import type { StackScreenProps } from "@react-navigation/stack";
import type { RootStackParamList } from "../types";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
} from "react-native";
import {
  TextInput,
  Button,
  Text,
  HelperText,
  Surface,
} from "react-native-paper";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components";
import { SCREEN_NAMES } from "../constants";
import { colors, spacing, borderRadius } from "../constants/theme";

type Props = StackScreenProps<RootStackParamList, "Login">;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const { login, loading, error, isLoggedIn } = useAuth();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoggedIn) {
      navigation.replace(SCREEN_NAMES.HOME);
      return;
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [isLoggedIn, navigation, fadeAnim]);

  const handleLogin = async () => {
    try {
      const result = await login(username, password);
      if (result.success) {
        navigation.replace(SCREEN_NAMES.HOME);
      }
    } catch (err) {
      Alert.alert("Erro de Login", err.message);
    }
  };

  const isFormValid = username.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Animated.View style={[styles.loginContainer, { opacity: fadeAnim }]}>
          <View style={styles.headerContainer}>
            <Text variant="displayMedium" style={styles.title}>
              Invisi
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Mobile
            </Text>
          </View>

          <Surface style={styles.card} elevation={2}>
            {error && (
              <HelperText
                type="error"
                visible={!!error}
                style={styles.errorText}
              >
                {error}
              </HelperText>
            )}

            <TextInput
              label="Nome de Usuário"
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              autoCapitalize="characters"
              autoCorrect={false}
              disabled={loading}
              returnKeyType="next"
              left={<TextInput.Icon icon="account-outline" />}
              style={styles.input}
            />

            <TextInput
              label="Senha"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              autoCorrect={false}
              disabled={loading}
              secureTextEntry={secureText}
              returnKeyType="go"
              onSubmitEditing={isFormValid ? handleLogin : undefined}
              left={<TextInput.Icon icon="lock-outline" />}
              right={
                <TextInput.Icon
                  icon={secureText ? "eye-outline" : "eye-off-outline"}
                  onPress={() => setSecureText(!secureText)}
                />
              }
              style={styles.input}
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              disabled={loading || !isFormValid}
              loading={loading}
              style={styles.loginButton}
              contentStyle={styles.loginButtonContent}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </Surface>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: spacing.xxxl,
  },
  title: {
    fontWeight: "700",
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontWeight: "500",
  },
  card: {
    padding: spacing.xxl,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
  },
  errorText: {
    fontSize: 14,
    marginBottom: spacing.md,
  },
  input: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  loginButton: {
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
  loginButtonContent: {
    paddingVertical: spacing.sm,
  },
});

export default LoginScreen;
