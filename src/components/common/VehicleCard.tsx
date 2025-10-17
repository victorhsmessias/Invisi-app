import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, Chip } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius } from "../../constants/theme";
import InfoRow from "./InfoRow";

interface VehicleCardProps {
  item: {
    grupo?: string;
    fila?: string | number;
    produto?: string;
    peso?: number;
    veiculos?: number;
  };
  badgeColor?: string;
  onPress?: () => void;
  additionalFields?: Array<{
    label: string;
    value: string | number;
    isPercentage?: boolean;
    percentageValue?: number;
    isBalance?: boolean;
    balanceValue?: number;
  }>;
  containerStyle?: any;
}

const VehicleCard = React.memo<VehicleCardProps>(
  ({
    item,
    badgeColor = colors.success,
    onPress,
    additionalFields = [],
    containerStyle,
  }) => {
    const formatPeso = (peso?: number) => {
      if (!peso || peso === 0) return "0kg";
      if (peso >= 1000) {
        return `${(peso / 1000).toFixed(1)}t`;
      }
      return `${peso.toLocaleString("pt-BR")}kg`;
    };

    const grupo = item?.grupo || "N/A";
    const fila = item?.fila || "N/A";
    const produto = item?.produto || "Não informado";
    const peso = item?.peso || 0;
    const veiculos = item?.veiculos || 0;

    return (
      <Card
        mode="elevated"
        elevation={2}
        onPress={onPress}
        style={[styles.card, containerStyle]}
      >
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.grupoContainer}>
                <Ionicons
                  name="business-outline"
                  size={18}
                  color={colors.text}
                />
                <Text variant="titleMedium" style={styles.grupoText}>
                  {grupo}
                </Text>
              </View>
              {fila && fila !== "N/A" && (
                <Text variant="bodySmall" style={styles.filaText}>
                  Fila {fila}
                </Text>
              )}
            </View>

            <Chip
              mode="flat"
              style={[styles.chip, { backgroundColor: badgeColor }]}
              textStyle={styles.chipText}
              icon={() => (
                <Ionicons name="car" size={16} color={colors.white} />
              )}
            >
              {veiculos}
            </Chip>
          </View>

          <View style={styles.divider} />

          <View style={styles.content}>
            <InfoRow label="Produto:" value={produto} />
            <InfoRow label="Peso:" value={formatPeso(peso)} />

            {additionalFields.map((field, index) => (
              <InfoRow
                key={index}
                label={field.label}
                value={field.value}
                isPercentage={field.isPercentage}
                percentageValue={field.percentageValue}
                isBalance={field.isBalance}
                balanceValue={field.balanceValue}
              />
            ))}
          </View>
        </Card.Content>
      </Card>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  grupoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  grupoText: {
    fontWeight: "600",
    color: colors.text,
    marginLeft: spacing.sm,
  },
  filaText: {
    color: colors.textSecondary,
    marginLeft: spacing.xl + 2,
  },
  chip: {
    height: 32,
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 0,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.white,
    marginLeft: 3,
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.sm,
  },
  content: {
    marginTop: spacing.xs,
  },
});

VehicleCard.displayName = "VehicleCard";

export default VehicleCard;
