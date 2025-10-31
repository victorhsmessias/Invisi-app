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
import { filterColors } from "../../constants/theme";

interface FilterOption {
  key: string;
  label: string;
  value: string;
}

interface FilterGroup {
  title: string;
  options: FilterOption[];
  selected: string[];
  onToggle: (key: string) => void;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filterGroups?: FilterGroup[];
  onApply?: () => void;
  onReset?: () => void;
  hasActiveFilters?: boolean;
}

const FilterModal: React.FC<FilterModalProps> = ({
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
              {filterGroups.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Nenhum filtro disponível</Text>
                </View>
              )}

              {filterGroups.map((group, groupIndex) => (
                <View key={groupIndex} style={styles.filterGroup}>
                  <Text style={styles.groupTitle}>{group.title}</Text>

                  <View style={styles.optionsContainer}>
                    {group.options && group.options.length > 0 ? (
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
                      })
                    ) : (
                      <Text style={styles.noOptionsText}>
                        Nenhuma opção disponível
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.footer}>
              {hasActiveFilters && onReset && (
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={onReset}
                  activeOpacity={0.8}
                >
                  <Text style={styles.resetButtonText}>Resetar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  hasActiveFilters && onReset && styles.applyButtonWithReset,
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
    backgroundColor: filterColors.overlay,
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: filterColors.modalBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 500,
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
    borderBottomColor: filterColors.modalBorder,
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
    color: filterColors.closeButtonText,
    fontWeight: "300",
  },
  content: {
    flex: 1,
    minHeight: 200,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 10,
    flexGrow: 1,
  },
  filterGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
    backgroundColor: "#f0f0f0",
    padding: 8,
    borderRadius: 4,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: filterColors.chipInactive,
    borderWidth: 2,
    borderColor: filterColors.chipInactiveBorder,
    marginRight: 8,
    marginBottom: 8,
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  chipActive: {
    backgroundColor: filterColors.chipActive,
    borderColor: filterColors.chipActiveBorder,
    borderWidth: 2,
  },
  chipText: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: filterColors.modalBorder,
  },
  resetButton: {
    backgroundColor: filterColors.resetButtonBackground,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: filterColors.resetButtonText,
  },
  applyButton: {
    flex: 1,
    backgroundColor: filterColors.applyButtonBackground,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  applyButtonWithReset: {
    flex: 1,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: filterColors.applyButtonText,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: "center",
  },
  noOptionsText: {
    fontSize: 14,
    color: COLORS.gray,
    fontStyle: "italic",
    padding: 10,
  },
});

FilterModal.displayName = "FilterModal";

export default FilterModal;
