import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from "react-native";
import { COLORS } from "../../constants";
import InfoRow from "./InfoRow";

const VehicleCard = React.memo(
  ({
    item,
    badgeColor = COLORS.success,
    onPress,
    additionalFields = [],
    containerStyle,
  }) => {
    const formatPeso = (peso) => {
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

    const CardContent = (
      <View style={[styles.card, containerStyle]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.grupoText}>{grupo}</Text>
            {fila && fila !== "N/A" && (
              <Text style={styles.filaText}>Fila {fila}</Text>
            )}
          </View>

          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={styles.badgeText}>
              {veiculos} {veiculos === 1 ? "veículo" : "veículos"}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
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
      </View>
    );

    if (onPress) {
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          {CardContent}
        </TouchableOpacity>
      );
    }

    return CardContent;
  }
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    marginHorizontal: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerLeft: {
    flex: 1,
  },
  grupoText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  filaText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.white,
  },
  cardContent: {
    marginTop: 5,
  },
});

VehicleCard.displayName = "VehicleCard";

export default VehicleCard;
