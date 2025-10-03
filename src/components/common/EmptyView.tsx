import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS } from "../../constants";

/**
 *
 * @param {Object} props
 * @param {string} props.icon
 * @param {string} props.message
 * @param {string} props.subMessage
 * @param {string} props.actionText
 * @param {Function} props.onActionPress
 * @param {Object} props.containerStyle
 */
const EmptyView = React.memo(
  ({
    icon = "📋",
    message = "Nenhum dado encontrado",
    subMessage,
    actionText,
    onActionPress,
    containerStyle,
  }) => {
    return (
      <View style={[styles.emptyContainer, containerStyle]}>
        <Text style={styles.emptyIcon}>{icon}</Text>
        <Text style={styles.emptyText}>{message}</Text>
        {subMessage && <Text style={styles.emptySubtext}>{subMessage}</Text>}
        {actionText && onActionPress && (
          <TouchableOpacity style={styles.actionButton} onPress={onActionPress}>
            <Text style={styles.actionButtonText}>{actionText}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  emptyContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.gray,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
  actionButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default EmptyView;
