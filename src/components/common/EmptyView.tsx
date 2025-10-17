import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Text, Button } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../constants/theme";

interface EmptyViewProps {
  icon?: keyof typeof Ionicons.glyphMap;
  message?: string;
  subMessage?: string;
  actionText?: string;
  onActionPress?: () => void;
  containerStyle?: ViewStyle;
}

const EmptyView = React.memo<EmptyViewProps>(
  ({
    icon = "document-text-outline",
    message = "Nenhum dado encontrado",
    subMessage,
    actionText,
    onActionPress,
    containerStyle,
  }) => {
    return (
      <View style={[styles.emptyContainer, containerStyle]}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={64} color={colors.textSecondary} />
        </View>

        <Text variant="titleLarge" style={styles.emptyText}>
          {message}
        </Text>

        {subMessage && (
          <Text variant="bodyMedium" style={styles.emptySubtext}>
            {subMessage}
          </Text>
        )}

        {actionText && onActionPress && (
          <Button
            mode="contained"
            onPress={onActionPress}
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
          >
            {actionText}
          </Button>
        )}
      </View>
    );
  }
);

EmptyView.displayName = "EmptyView";

const styles = StyleSheet.create({
  emptyContainer: {
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceVariant,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  actionButton: {
    marginTop: spacing.md,
  },
  actionButtonContent: {
    paddingHorizontal: spacing.md,
  },
});

export default EmptyView;
