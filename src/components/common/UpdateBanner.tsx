import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS } from "../../constants";

/**
 * Banner de última atualização com botão de filtro
 *
 * @param {Object} props
 * @param {Date} props.lastUpdate - Data/hora da última atualização
 * @param {Function} props.onFilterPress - Callback quando pressionar botão filtro
 * @param {boolean} props.showFilterButton - Mostrar botão de filtro
 * @param {boolean} props.hasActiveFilters - Indica se há filtros ativos
 * @param {string} props.filterButtonText - Texto do botão de filtro
 */
const UpdateBanner = React.memo(
  ({
    lastUpdate,
    onFilterPress,
    showFilterButton = false,
    hasActiveFilters = false,
    filterButtonText = "Filtros",
  }) => {
    if (!lastUpdate) return null;

    const formatTime = (date) => {
      return date.toLocaleTimeString("pt-BR").substring(0, 5);
    };

    return (
      <View style={styles.updateContainer}>
        <View style={styles.updateRow}>
          <Text style={styles.updateText}>
            Atualizado: {formatTime(lastUpdate)}
          </Text>
          {showFilterButton && onFilterPress && (
            <TouchableOpacity
              style={[
                styles.filterButton,
                hasActiveFilters && styles.filterButtonActive,
              ]}
              onPress={onFilterPress}
            >
              <Text style={styles.filterButtonText}>{filterButtonText}</Text>
              {hasActiveFilters && <View style={styles.filterBadge} />}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  updateContainer: {
    backgroundColor: "#e8f4fd",
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 2,
    marginBottom: 5,
    marginHorizontal: 10,
    borderRadius: 5,
  },
  updateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  updateText: {
    fontSize: 12,
    color: "#0066cc",
  },
  filterButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
    position: "relative",
  },
  filterButtonActive: {
    backgroundColor: COLORS.success,
  },
  filterButtonText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: "500",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
    borderWidth: 1,
    borderColor: COLORS.white,
  },
});

export default UpdateBanner;
