import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, Badge } from "react-native-paper";
import { colors, spacing, borderRadius } from "../../constants/theme";

interface UpdateBannerProps {
  lastUpdate: Date | null;
  onFilterPress?: () => void;
  showFilterButton?: boolean;
  hasActiveFilters?: boolean;
  filterButtonText?: string;
}

const UpdateBanner = React.memo<UpdateBannerProps>(
  ({
    lastUpdate,
    onFilterPress,
    showFilterButton = false,
    hasActiveFilters = false,
    filterButtonText = "Filtros",
  }) => {
    if (!lastUpdate) return null;

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    return (
      <View style={styles.container}>
        <Text variant="bodySmall" style={styles.updateText}>
          Atualizado: {formatTime(lastUpdate)}
        </Text>

        {showFilterButton && onFilterPress && (
          <View style={styles.filterButtonContainer}>
            <Button
              mode="contained-tonal"
              onPress={onFilterPress}
              compact
              style={[
                styles.filterButton,
                hasActiveFilters && styles.filterButtonActive,
              ]}
            >
              {filterButtonText}
            </Button>
            {hasActiveFilters && <Badge size={8} style={styles.filterBadge} />}
          </View>
        )}
      </View>
    );
  }
);

UpdateBanner.displayName = "UpdateBanner";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    top: spacing.xs,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    minHeight: spacing.xxl,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
  },
  updateText: {
    color: colors.textSecondary,
    fontWeight: "500",
  },
  filterButtonContainer: {
    position: "relative",
  },
  filterButton: {
    borderRadius: borderRadius.md,
  },
  filterButtonActive: {
    backgroundColor: colors.success + "20",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: colors.danger,
  },
});

export default UpdateBanner;
