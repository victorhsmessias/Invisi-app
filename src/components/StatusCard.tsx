import React, { useRef, memo } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius } from "../constants/theme";

interface StatusCardProps {
  title: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  loading?: boolean;
  subtitle?: string;
  onPress?: () => void;
}

const StatusCard = memo<StatusCardProps>(
  ({ title, value, icon, color, loading = false, subtitle, onPress }) => {
    const theme = useTheme();
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    const handlePress = () => {
      if (onPress) {
        onPress();
      }
    };

    const getColorByValue = (val: number, type: "fila" | "normal"): string => {
      if (type === "fila") {
        if (val > 20) return colors.danger;
        if (val > 10) return colors.warning;
        return colors.success;
      }
      return color;
    };

    const displayColor = getColorByValue(
      value,
      title.toLowerCase().includes("fila") ? "fila" : "normal"
    );

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Card
          mode="elevated"
          elevation={2}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.card, { borderLeftColor: displayColor, borderLeftWidth: 4 }]}
        >
          <Card.Content style={styles.content}>
            <View style={styles.iconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: displayColor + '15' }]}>
                <Ionicons name={icon} size={28} color={displayColor} />
              </View>
            </View>

            <View style={styles.infoContainer}>
              <Text
                variant="displaySmall"
                style={[styles.value, { color: displayColor }]}
              >
                {loading ? "..." : value}
              </Text>

              {subtitle && (
                <Text variant="bodySmall" style={styles.subtitle}>
                  {subtitle}
                </Text>
              )}

              <Text variant="bodyMedium" style={styles.title}>
                {title}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </Animated.View>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  iconContainer: {
    marginRight: spacing.lg,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  value: {
    fontWeight: "700",
    marginBottom: 2,
  },
  subtitle: {
    color: colors.textSecondary,
    marginBottom: 2,
  },
  title: {
    color: colors.text,
    fontWeight: "500",
  },
});

StatusCard.displayName = "StatusCard";

export default StatusCard;
