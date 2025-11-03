import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius } from "../../constants/theme";

interface LocationHeaderProps {
  location: string;
  vehicleCount: number;
  totalWeight?: number;
}

const formatWeight = (weight?: number): string | null => {
  if (!weight || weight === 0) return null;
  return `${weight.toLocaleString("pt-BR")}`;
};

const LocationHeader = React.memo<LocationHeaderProps>(
  ({ location, vehicleCount, totalWeight }) => {
    const formattedWeight = useMemo(
      () => formatWeight(totalWeight),
      [totalWeight]
    );

    return (
      <View style={styles.container}>
        <View style={styles.leftContent}>
          <Ionicons name="location" size={20} color="#0066CC" />
          <Text variant="titleMedium" style={styles.locationText}>
            Local {location}
          </Text>
        </View>

        <View style={styles.rightContent}>
          <View style={styles.badge}>
            <Ionicons name="car" size={14} color={colors.white} />
            <Text variant="labelSmall" style={styles.badgeText}>
              {vehicleCount}
            </Text>
          </View>
        </View>
      </View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.location === nextProps.location &&
      prevProps.vehicleCount === nextProps.vehicleCount &&
      prevProps.totalWeight === nextProps.totalWeight
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E8F4FD",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: "#0066CC",
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationText: {
    fontWeight: "600",
    color: colors.text,
    marginLeft: spacing.sm,
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0066CC",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  badgeText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 12,
  },
});

LocationHeader.displayName = "LocationHeader";

export default LocationHeader;
