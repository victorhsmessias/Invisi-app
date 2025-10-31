import React, { useMemo } from "react";
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
    data?: string;
    hora?: string;
  };
  badgeColor?: string;
  borderColor?: string;
  borderWidth?: number;
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
  showEntryTime?: boolean;
}

const formatPeso = (peso?: number): string => {
  if (!peso || peso === 0) return "0kg";
  if (peso >= 1000) {
    return `${(peso / 1000).toFixed(1)}t`;
  }
  return `${peso.toLocaleString("pt-BR")}kg`;
};

const VehicleCard = React.memo<VehicleCardProps>(
  ({
    item,
    badgeColor = colors.success,
    borderColor,
    borderWidth = 5,
    onPress,
    additionalFields = [],
    containerStyle,
    showEntryTime = false,
  }) => {
    const grupo = item?.grupo || "N/A";
    const fila = item?.fila || "N/A";
    const produto = item?.produto || "Não informado";
    const peso = item?.peso || 0;
    const veiculos = item?.veiculos || 0;
    const data = item?.data;
    const hora = item?.hora;

    const pesoFormatado = useMemo(() => formatPeso(peso), [peso]);

    const formatEntryDateTime = useMemo(() => {
      if (!hora) return null;
      if (!data) return hora.substring(0, 5);

      const [year, month, day] = data.split("-");
      const formattedDate = `${day}/${month}`;
      const formattedTime = hora.substring(0, 5);

      return `${formattedDate} às ${formattedTime}`;
    }, [data, hora]);

    const cardStyle = useMemo(() => {
      const baseStyle = [styles.card, containerStyle];
      if (borderColor) {
        if (borderWidth > 5) {
          baseStyle.push({
            borderWidth: borderWidth,
            borderColor: borderColor,
            shadowColor: borderColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 8,
          });
        } else {
          baseStyle.push({
            borderLeftWidth: borderWidth,
            borderLeftColor: borderColor,
          });
        }
      }
      return baseStyle;
    }, [borderColor, borderWidth, containerStyle]);

    return (
      <Card mode="elevated" elevation={2} onPress={onPress} style={cardStyle}>
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
              {showEntryTime && formatEntryDateTime && (
                <View style={styles.timeContainer}>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text variant="bodySmall" style={styles.timeText}>
                    Entrada: {formatEntryDateTime}
                  </Text>
                </View>
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
            <InfoRow label="Peso:" value={pesoFormatado} />

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
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item.grupo === nextProps.item.grupo &&
      prevProps.item.fila === nextProps.item.fila &&
      prevProps.item.produto === nextProps.item.produto &&
      prevProps.item.peso === nextProps.item.peso &&
      prevProps.item.veiculos === nextProps.item.veiculos &&
      prevProps.badgeColor === nextProps.badgeColor &&
      prevProps.additionalFields?.length === nextProps.additionalFields?.length
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
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: spacing.xl + 2,
    marginTop: spacing.xs,
  },
  timeText: {
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    fontSize: 12,
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
