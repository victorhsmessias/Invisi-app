import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { COLORS } from "../../constants";
import { HeaderLoadingIndicator } from "../BackgroundLoadingIndicator";

/**
 * @param {Object} props
 * @param {string} props.title
 * @param {string} props.subtitle
 * @param {Function} props.onBackPress
 * @param {Function} props.onMenuPress
 * @param {Function} props.onRefreshPress
 * @param {boolean} props.isRefreshing
 * @param {boolean} props.showBackButton
 * @param {boolean} props.showRefreshButton
 * @param {boolean} props.showLoadingIndicator
 * @param {React.ReactNode} props.leftComponent
 * @param {React.ReactNode} props.rightComponent
 */

const Header = ({
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
          <TouchableOpacity style={styles.iconButton} onPress={onBackPress}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        ) : onMenuPress ? (
          <TouchableOpacity style={styles.iconButton} onPress={onMenuPress}>
            <Text style={styles.menuIcon}>☰</Text>
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
              >
                {isRefreshing ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Text style={styles.refreshIcon}>🔄</Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
};

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
  headerLeft: {
    width: 40,
    alignItems: "flex-start",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerRight: {
    width: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  iconButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: "#333",
  },
  backIcon: {
    fontSize: 24,
    color: "#333",
  },
  refreshIcon: {
    fontSize: 20,
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

export default Header;
