import React, { useRef, useEffect, memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  ScrollView,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { useApp } from "../context/AppContext";
import { useAuth } from "../hooks/useAuth";
import { COLORS, SCREEN_NAMES } from "../constants";

const { width: screenWidth } = Dimensions.get("window");

const SideMenu = memo(({ visible, onClose, navigation }) => {
  const { state } = useApp();
  const { logout } = useAuth();
  const slideAnim = useRef(new Animated.Value(-screenWidth * 0.75)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -screenWidth * 0.75,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const menuItems = [
    {
      id: "inicio",
      title: "Início",
      icon: "🏠",
      screen: SCREEN_NAMES.HOME,
      description: "Tela inicial",
      onPress: () => navigation.navigate(SCREEN_NAMES.HOME),
    },
    {
      id: "monitor_corte",
      title: "Monitor Corte",
      icon: "🔍",
      screen: SCREEN_NAMES.MONITOR_CORTE,
      description: "Monitor de cortes",
      onPress: () => navigation.navigate(SCREEN_NAMES.MONITOR_CORTE),
    },
    {
      id: "divider",
      isDivider: true,
    },
    {
      id: "logout",
      title: "Sair",
      icon: "🚪",
      isLogout: true,
      description: "Encerrar sessão",
    },
  ];

  const handleMenuPress = (item) => {
    onClose();

    if (item.isLogout) {
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
    } else if (item.screen) {
      navigation.navigate(item.screen);
    }
  };

  return (
    <Modal
      visible={visible}
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
                { transform: [{ translateX: slideAnim }] },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.userAvatar}>
                  <Text style={styles.avatarText}>
                    {state.username ? state.username[0].toUpperCase() : "U"}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {state.username || "Usuário"}
                  </Text>
                  <Text style={styles.userRole}>Operador</Text>
                </View>
              </View>

              <ScrollView style={styles.scroll}>
                {menuItems.map((item) => {
                  if (item.isDivider) {
                    return <View key={item.id} style={styles.divider} />;
                  }

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.menuItem,
                        item.isLogout && styles.menuItemLogout,
                      ]}
                      onPress={() => handleMenuPress(item)}
                    >
                      <Text style={styles.menuItemIcon}>{item.icon}</Text>
                      <View style={styles.menuItemContent}>
                        <Text
                          style={[
                            styles.menuItemTitle,
                            item.isLogout && styles.menuItemTitleLogout,
                          ]}
                        >
                          {item.title}
                        </Text>
                        <Text style={styles.menuItemDescription}>
                          {item.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
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
    backgroundColor: COLORS.white,
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
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ffffff30",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.white,
    textTransform: "capitalize",
  },
  userRole: {
    fontSize: 14,
    color: "#ffffff90",
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemLogout: {
    backgroundColor: "#fff5f5",
  },
  menuItemIcon: {
    fontSize: 24,
    marginRight: 15,
    width: 30,
    textAlign: "center",
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  menuItemTitleLogout: {
    color: COLORS.danger,
  },
  menuItemDescription: {
    fontSize: 12,
    color: COLORS.gray,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 10,
  },
});

SideMenu.displayName = "SideMenu";

export default SideMenu;
