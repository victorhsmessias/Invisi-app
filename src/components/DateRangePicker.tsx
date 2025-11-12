import React, { useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Button, Text } from "react-native-paper";
import { colors, spacing } from "../constants/theme";

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onDateChange: (startDate: Date, endDate: Date) => void;
  disabled?: boolean;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onDateChange,
  disabled = false,
}) => {
  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handlePresetRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    onDateChange(start, end);
  };

  const handleCustomDate = (type: "start" | "end", daysOffset: number) => {
    if (type === "start") {
      const newStart = new Date(startDate);
      newStart.setDate(newStart.getDate() + daysOffset);
      if (newStart <= endDate) {
        onDateChange(newStart, endDate);
      }
    } else {
      const newEnd = new Date(endDate);
      newEnd.setDate(newEnd.getDate() + daysOffset);
      if (newEnd >= startDate && newEnd <= new Date()) {
        onDateChange(startDate, newEnd);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.presetContainer}>
        <Text style={styles.label}>Períodos rápidos:</Text>
        <View style={styles.presetButtons}>
          <Button
            mode="outlined"
            onPress={() => handlePresetRange(7)}
            style={styles.presetButton}
            compact
            disabled={disabled}
          >
            7 dias
          </Button>
          <Button
            mode="outlined"
            onPress={() => handlePresetRange(15)}
            style={styles.presetButton}
            compact
            disabled={disabled}
          >
            15 dias
          </Button>
        </View>
      </View>

      <View style={styles.dateContainer}>
        <View style={styles.dateSection}>
          <Text style={styles.label}>Data Início:</Text>
          <View style={styles.dateControls}>
            <Button
              mode="outlined"
              onPress={() => handleCustomDate("start", -1)}
              style={styles.dateButton}
              compact
              disabled={disabled}
            >
              -
            </Button>
            <Text style={styles.dateText}>{formatDate(startDate)}</Text>
            <Button
              mode="outlined"
              onPress={() => handleCustomDate("start", 1)}
              style={styles.dateButton}
              compact
              disabled={disabled}
            >
              +
            </Button>
          </View>
        </View>

        <View style={styles.dateSection}>
          <Text style={styles.label}>Data Fim:</Text>
          <View style={styles.dateControls}>
            <Button
              mode="outlined"
              onPress={() => handleCustomDate("end", -1)}
              style={styles.dateButton}
              compact
              disabled={disabled}
            >
              -
            </Button>
            <Text style={styles.dateText}>{formatDate(endDate)}</Text>
            <Button
              mode="outlined"
              onPress={() => handleCustomDate("end", 1)}
              style={styles.dateButton}
              compact
              disabled={disabled}
            >
              +
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  presetContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  presetButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  presetButton: {
    flex: 1,
  },
  dateContainer: {
    gap: spacing.md,
  },
  dateSection: {
    gap: spacing.sm,
  },
  dateControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  dateButton: {
    minWidth: 40,
  },
  dateText: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
});
