import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants";
import { HeaderLoadingIndicator } from "../BackgroundLoadingIndicator";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBackPress?: () => void;
  onMenuPress?: () => void;
  onRefreshPress?: () => void;
  isRefreshing?: boolean;
  showBackButton?: boolean;
  showRefreshButton?: boolean;
  showLoadingIndicator?: boolean;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = React.memo(
  ({
    title,
    subtitle,
    onBackPress,
    onMenuPress,
    onRefreshPress,
    isRefreshing = false,
    showBackButton = false,
    showRefreshButton = false,
    showLoadingIndicator = false,
    leftComponent,
    rightComponent,
  }) => {
    return (
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {leftComponent ? (
            leftComponent
          ) : showBackButton && onBackPress ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onBackPress}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.black} />
            </TouchableOpacity>
          ) : onMenuPress ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onMenuPress}
              accessibilityRole="button"
              accessibilityLabel="Abrir menu"
            >
              <Ionicons name="menu" size={26} color={COLORS.black} />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconButton} />
          )}
        </View>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
        </View>

        <View style={styles.headerRight}>
          {rightComponent ? (
            rightComponent
          ) : (
            <>
              {showLoadingIndicator && (
                <HeaderLoadingIndicator visible={showLoadingIndicator} />
              )}
              {showRefreshButton && onRefreshPress && (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={onRefreshPress}
                  disabled={isRefreshing}
                  accessibilityRole="button"
                  accessibilityLabel="Atualizar"
                >
                  {isRefreshing ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Ionicons name="refresh" size={22} color={COLORS.black} />
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.title === nextProps.title &&
      prevProps.subtitle === nextProps.subtitle &&
      prevProps.isRefreshing === nextProps.isRefreshing &&
      prevProps.showLoadingIndicator === nextProps.showLoadingIndicator &&
      prevProps.showBackButton === nextProps.showBackButton &&
      prevProps.showRefreshButton === nextProps.showRefreshButton
    );
  }
);

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLeft: {
    width: 60,
    alignItems: "flex-start",
  },
  headerRight: {
    width: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  iconButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
});

Header.displayName = "Header";

export default Header;
