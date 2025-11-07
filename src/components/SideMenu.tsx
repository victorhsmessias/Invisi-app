import React, { useRef, useEffect, memo } from "react";
import {
  View,
  TouchableWithoutFeedback,
  Modal,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { List, Avatar, Divider, Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { useAuth } from "../hooks/useAuth";
import { colors, spacing } from "../constants/theme";
import { SCREEN_NAMES } from "../constants";

const screenWidth = Dimensions.get("window").width;

interface NavigationHelpers {
  navigate: (screen: string, params?: object) => void;
  replace: (screen: string, params?: object) => void;
  goBack: () => void;
  [key: string]: unknown;
}

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
  navigation: NavigationHelpers;
}

const SideMenu = memo<SideMenuProps>(({ visible, onClose, navigation }) => {
  const translateX = useRef(new Animated.Value(-screenWidth * 0.75)).current;
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const { state } = useApp();
  const { logout } = useAuth();

  React.useEffect(() => {
    if (visible) {
      setIsModalVisible(true);
      translateX.setValue(-screenWidth * 0.75);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (isModalVisible) {
      Animated.timing(translateX, {
        toValue: -screenWidth * 0.75,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsModalVisible(false);
      });
    }
  }, [visible, translateX, isModalVisible]);

  const handleLogout = () => {
    onClose();
    Alert.alert("Confirmar Logout", "Deseja sair do sistema?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await logout();
          navigation.replace(SCREEN_NAMES.LOGIN);
        },
      },
    ]);
  };

  const handleNavigate = (screen: string) => {
    onClose();
    navigation.navigate(screen);
  };

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.container,
                { transform: [{ translateX: translateX }] },
              ]}
            >
              <View style={styles.header}>
                <Avatar.Text
                  size={56}
                  label={state.username ? state.username[0].toUpperCase() : "U"}
                  style={styles.avatar}
                />
                <Text variant="titleLarge" style={styles.userName}>
                  {state.username || "Usuário"}
                </Text>
                <Text variant="bodySmall" style={styles.userRole}>
                  Filial: {state.selectedFilial}
                </Text>
              </View>

              <List.Section style={styles.listSection}>
                <List.Item
                  title="Início"
                  left={(props) => <List.Icon {...props} icon="home-outline" />}
                  onPress={() => handleNavigate(SCREEN_NAMES.HOME)}
                  titleStyle={styles.listItemTitle}
                />

                <List.Item
                  title="Gráficos"
                  left={(props) => (
                    <List.Icon {...props} icon="chart-bar" />
                  )}
                  onPress={() => handleNavigate(SCREEN_NAMES.GRAFICOS)}
                  titleStyle={styles.listItemTitle}
                />

                <List.Item
                  title="Monitor Corte"
                  left={(props) => (
                    <List.Icon {...props} icon="chart-timeline-variant" />
                  )}
                  onPress={() => handleNavigate(SCREEN_NAMES.MONITOR_CORTE)}
                  titleStyle={styles.listItemTitle}
                />

                <Divider style={styles.divider} />

                <List.Item
                  title="Sair"
                  left={(props) => (
                    <List.Icon {...props} icon="logout" color={colors.danger} />
                  )}
                  onPress={handleLogout}
                  titleStyle={[styles.listItemTitle, { color: colors.danger }]}
                  style={styles.logoutItem}
                />
              </List.Section>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: screenWidth * 0.75,
    backgroundColor: colors.surface,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
  },
  avatar: {
    backgroundColor: colors.primaryDark,
    marginBottom: spacing.md,
  },
  userName: {
    color: colors.white,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  userRole: {
    color: colors.white,
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  listSection: {
    flex: 1,
    paddingTop: spacing.md,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  divider: {
    marginVertical: spacing.md,
  },
  logoutItem: {
    backgroundColor: colors.neutral[50],
  },
});

SideMenu.displayName = "SideMenu";

export default SideMenu;
