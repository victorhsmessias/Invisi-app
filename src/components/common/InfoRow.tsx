import React from "react";
import { View, Text, StyleSheet, TextStyle } from "react-native";
import { COLORS } from "../../constants";

interface InfoRowProps {
  label: string;
  value: string | number;
  isPercentage?: boolean;
  percentageValue?: number;
  isBalance?: boolean;
  balanceValue?: number;
  labelStyle?: TextStyle;
  valueStyle?: TextStyle;
  bold?: boolean;
}

const InfoRow = React.memo<InfoRowProps>(
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
        <Text style={[styles.infoLabel, bold && styles.boldLabel, labelStyle]}>
          {label}
        </Text>
        <Text style={getValueStyle()} numberOfLines={1} ellipsizeMode="tail">
          {value || "N/A"}
        </Text>
      </View>
    );
  }
);

InfoRow.displayName = "InfoRow";

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
