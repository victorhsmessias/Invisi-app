import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../constants";

/**
 * Componente reutilizável para exibir linha de informação (label + valor)
 *
 * @param {Object} props
 * @param {string} props.label - Label do campo
 * @param {string|number} props.value - Valor do campo
 * @param {boolean} props.isPercentage - Se é percentual, aplica cor baseada no valor
 * @param {number} props.percentageValue - Valor numérico para comparação (positivo/negativo)
 * @param {boolean} props.isBalance - Se é saldo, aplica cor baseada no valor
 * @param {number} props.balanceValue - Valor numérico do saldo
 * @param {Object} props.labelStyle - Estilo customizado para label
 * @param {Object} props.valueStyle - Estilo customizado para valor
 * @param {boolean} props.bold - Label em negrito
 */
const InfoRow = React.memo(
  ({
    label,
    value,
    isPercentage = false,
    percentageValue,
    isBalance = false,
    balanceValue,
    labelStyle,
    valueStyle,
    bold = false,
  }) => {
    // Determinar estilo do valor baseado em condições
    const getValueStyle = () => {
      const baseStyles = [styles.infoValue, valueStyle];

      if (isPercentage && percentageValue !== undefined) {
        if (percentageValue < 0) {
          baseStyles.push(styles.negativeValue);
        } else if (percentageValue > 0) {
          baseStyles.push(styles.positiveValue);
        }
      }

      if (isBalance && balanceValue !== undefined) {
        if (balanceValue < 0) {
          baseStyles.push(styles.negativeValue);
        } else if (balanceValue > 0) {
          baseStyles.push(styles.positiveValue);
        } else {
          baseStyles.push(styles.neutralValue);
        }
      }

      return baseStyles;
    };

    return (
      <View style={styles.infoRow}>
        <Text
          style={[
            styles.infoLabel,
            bold && styles.boldLabel,
            labelStyle,
          ]}
        >
          {label}
        </Text>
        <Text
          style={getValueStyle()}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {value || "N/A"}
        </Text>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    paddingVertical: 2,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.gray,
    flex: 1,
  },
  boldLabel: {
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    textAlign: "right",
  },
  positiveValue: {
    color: COLORS.success,
    fontWeight: "600",
  },
  negativeValue: {
    color: COLORS.danger,
    fontWeight: "600",
  },
  neutralValue: {
    color: COLORS.gray,
  },
});

export default InfoRow;
