import React from "react";
import { View, Text, StyleSheet, Platform, ViewStyle, TextStyle } from "react-native";
import { COLORS } from "../../constants";

interface SummaryItem {
  icon?: string;
  value: string | number;
  label: string;
  valueStyle?: TextStyle;
  labelStyle?: TextStyle;
}

interface SummaryCardProps {
  items?: SummaryItem[];
  containerStyle?: ViewStyle;
}

const SummaryCard: React.FC<SummaryCardProps> = React.memo(
  ({ items = [], containerStyle }) => {
    if (!items || items.length === 0) return null;

    return (
      <View style={[styles.summaryContainer, containerStyle]}>
        {items.map((item: SummaryItem, index: number) => (
          <View key={`${item.label}-${index}`} style={styles.summaryItem}>
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
  },
  (prevProps, nextProps) => {
    if (prevProps.items?.length !== nextProps.items?.length) return false;

    return prevProps.items?.every((item, index) =>
      item.value === nextProps.items?.[index]?.value &&
      item.label === nextProps.items?.[index]?.label
    ) ?? true;
  }
);

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

SummaryCard.displayName = "SummaryCard";

export default SummaryCard;
