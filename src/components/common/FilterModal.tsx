import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { COLORS } from "../../constants";

/**
 * Modal reutilizável para filtros
 *
 * @param {Object} props
 * @param {boolean} props.visible - Controla visibilidade do modal
 * @param {Function} props.onClose - Callback ao fechar o modal
 * @param {Array} props.filterGroups - Array de grupos de filtros
 * @param {Function} props.onApply - Callback ao aplicar filtros
 * @param {Function} props.onReset - Callback ao resetar filtros (opcional)
 * @param {boolean} props.hasActiveFilters - Indica se há filtros ativos (opcional)
 *
 * @example
 * <FilterModal
 *   visible={modalVisible}
 *   onClose={() => setModalVisible(false)}
 *   filterGroups={[
 *     {
 *       title: "Tipos de Serviço",
 *       options: [
 *         { key: "armazenagem", label: "Armazenagem" },
 *         { key: "transbordo", label: "Transbordo" },
 *         { key: "pesagem", label: "Pesagem" }
 *       ],
 *       selected: selectedServicos,
 *       onToggle: toggleServicoFilter
 *     }
 *   ]}
 *   onApply={handleApplyFilters}
 *   onReset={resetFilters}
 *   hasActiveFilters={hasActiveFilters}
 * />
 */
const FilterModal = ({
  visible,
  onClose,
  filterGroups = [],
  onApply,
  onReset,
  hasActiveFilters = false,
}) => {
  const handleApply = () => {
    if (onApply) {
      onApply();
    }
    onClose();
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filtros</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {filterGroups.map((group, groupIndex) => (
              <View key={groupIndex} style={styles.filterGroup}>
                <Text style={styles.groupTitle}>{group.title}</Text>

                <View style={styles.optionsContainer}>
                  {group.options &&
                    group.options.map((option, optionIndex) => {
                      const isSelected = group.selected
                        ? group.selected.includes(option.key)
                        : false;

                      return (
                        <TouchableOpacity
                          key={optionIndex}
                          style={[styles.chip, isSelected && styles.chipActive]}
                          onPress={() => {
                            if (group.onToggle) {
                              group.onToggle(option.key);
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSelected && styles.chipTextActive,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            {hasActiveFilters && onReset && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleReset}
                activeOpacity={0.7}
              >
                <Text style={styles.resetButtonText}>Resetar</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.applyButton,
                hasActiveFilters && onReset && styles.applyButtonSmall,
              ]}
              onPress={handleApply}
              activeOpacity={0.8}
            >
              <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
  },
  closeButton: {
    position: "absolute",
    right: 20,
    top: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 24,
    color: COLORS.gray,
    fontWeight: "300",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  filterGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  chipText: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: "500",
  },
  chipTextActive: {
    color: COLORS.white,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 12,
  },
  resetButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.gray,
  },
  applyButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  applyButtonSmall: {
    flex: 2,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
});

export default FilterModal;
