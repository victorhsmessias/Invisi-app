import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { COLORS } from "../../constants";

/**
 * Card de resumo com totais (veículos, grupos, peso, etc)
 *
 * @param {Object} props
 * @param {Array} props.items - Array de itens do resumo [{label, value, icon}]
 * @param {Object} props.containerStyle - Estilo customizado para o container
 */
const SummaryCard = React.memo(({ items = [], containerStyle }) => {
  if (!items || items.length === 0) return null;

  return (
    <View style={[styles.summaryContainer, containerStyle]}>
      {items.map((item, index) => (
        <View key={index} style={styles.summaryItem}>
          {item.icon && <Text style={styles.summaryIcon}>{item.icon}</Text>}
          <Text style={[styles.summaryValue, item.valueStyle]}>
            {item.value}
          </Text>
          <Text style={[styles.summaryLabel, item.labelStyle]}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  summaryContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 5,
    marginBottom: 10,
    marginHorizontal: 10,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
});

export default SummaryCard;
