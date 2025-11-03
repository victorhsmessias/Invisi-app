import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius } from "../../constants/theme";
import InfoRow from "./InfoRow";

interface VehicleListCardProps {
  item: {
    ordem?: number;
    veiculo?: string;
    peso?: number;
    data?: string;
    hora?: string;
    contrato?: string | null;
  };
  badgeColor?: string;
  containerStyle?: any;
}

const formatPeso = (peso?: number): string => {
  if (!peso || peso === 0) return "0";
  return `${peso.toLocaleString("pt-BR")}`;
};

const formatData = (data?: string): string => {
  if (!data) return "N/A";
  try {
    const [year, month, day] = data.split("-");
    return `${day}/${month}/${year}`;
  } catch {
    return data;
  }
};

const formatHora = (hora?: string): string => {
  if (!hora) return "N/A";
  try {
    const [h, m] = hora.split(":");
    return `${h}:${m}`;
  } catch {
    return hora;
  }
};

const VehicleListCard = React.memo<VehicleListCardProps>(
  ({ item, badgeColor = colors.success, containerStyle }) => {
    const ordem = item?.ordem || 0;
    const veiculo = item?.veiculo || "N/A";
    const peso = item?.peso || 0;
    const data = item?.data || "";
    const hora = item?.hora || "";
    const contrato = item?.contrato || null;

    const pesoFormatado = useMemo(() => formatPeso(peso), [peso]);
    const dataFormatada = useMemo(() => formatData(data), [data]);
    const horaFormatada = useMemo(() => formatHora(hora), [hora]);

    return (
      <Card mode="elevated" elevation={2} style={[styles.card, containerStyle]}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.ordemContainer}>
                <View
                  style={[styles.ordemBadge, { backgroundColor: badgeColor }]}
                >
                  <Text style={styles.ordemText}>#{ordem}</Text>
                </View>
                <View style={styles.veiculoContainer}>
                  <Text variant="titleMedium" style={styles.veiculoText}>
                    {veiculo}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.pesoContainer}>
              <Ionicons
                name="scale-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Text variant="bodyMedium" style={styles.pesoText}>
                {pesoFormatado}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.content}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text variant="bodySmall" style={styles.infoLabel}>
                  Data:
                </Text>
                <Text variant="bodySmall" style={styles.infoValue}>
                  {dataFormatada}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text variant="bodySmall" style={styles.infoLabel}>
                  Hora:
                </Text>
                <Text variant="bodySmall" style={styles.infoValue}>
                  {horaFormatada}
                </Text>
              </View>
            </View>

            {contrato && <InfoRow label="Contrato:" value={contrato} />}
          </View>
        </Card.Content>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item.ordem === nextProps.item.ordem &&
      prevProps.item.veiculo === nextProps.item.veiculo &&
      prevProps.item.peso === nextProps.item.peso &&
      prevProps.item.data === nextProps.item.data &&
      prevProps.item.hora === nextProps.item.hora &&
      prevProps.item.contrato === nextProps.item.contrato &&
      prevProps.badgeColor === nextProps.badgeColor
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
  ordemContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  ordemBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    minWidth: 40,
    alignItems: "center",
  },
  ordemText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },
  veiculoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  veiculoText: {
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 0.5,
  },
  pesoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
  },
  pesoText: {
    fontWeight: "600",
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.sm,
  },
  content: {
    marginTop: spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontWeight: "500",
  },
  infoValue: {
    color: colors.text,
    fontWeight: "600",
  },
});

VehicleListCard.displayName = "VehicleListCard";

export default VehicleListCard;
