import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
} from "react-native";
import {
  COLORS,
  SERVICO_OPTIONS,
  OP_PADRAO_OPTIONS,
  DEFAULT_FILTERS,
} from "../constants";

const FilterModal = ({
  visible,
  onClose,
  filtroServico,
  setFiltroServico,
  filtroOpPadrao,
  setFiltroOpPadrao,
  onApply,
}) => {
  const [tempFiltroServico, setTempFiltroServico] = useState(filtroServico);
  const [tempFiltroOpPadrao, setTempFiltroOpPadrao] = useState(filtroOpPadrao);

  useEffect(() => {
    if (visible) {
      setTempFiltroServico(filtroServico);
      setTempFiltroOpPadrao(filtroOpPadrao);
    }
  }, [visible, filtroServico, filtroOpPadrao]);

  const handleApply = () => {
    if (__DEV__) {
      console.log("[FilterModal] Applying filters:", {
        servico: tempFiltroServico,
        opPadrao: tempFiltroOpPadrao,
      });
    }
    setFiltroServico(tempFiltroServico);
    setFiltroOpPadrao(tempFiltroOpPadrao);

    // Chamar onApply com os filtros específicos para sincronização imediata
    if (onApply) {
      onApply(tempFiltroServico, tempFiltroOpPadrao);
    }

    onClose();
  };

  const handleReset = () => {
    setTempFiltroServico(DEFAULT_FILTERS.servico);
    setTempFiltroOpPadrao(DEFAULT_FILTERS.opPadrao);
  };

  const toggleServico = (key) => {
    setTempFiltroServico((prev) => ({
      ...prev,
      [key]: prev[key] === 1 ? 0 : 1,
    }));
  };

  const toggleOpPadrao = (key) => {
    setTempFiltroOpPadrao((prev) => ({
      ...prev,
      [key]: prev[key] === 1 ? 0 : 1,
    }));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Filtros</Text>
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <Text style={styles.resetText}>Limpar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de Serviço</Text>
            {SERVICO_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={styles.filterItem}
                onPress={() => toggleServico(option.key)}
                accessibilityRole="checkbox"
                accessibilityState={{
                  checked: !!tempFiltroServico[option.key],
                }}
              >
                <Text style={styles.filterLabel}>{option.label}</Text>
                <View
                  style={[
                    styles.checkbox,
                    !!tempFiltroServico[option.key] && styles.checkboxActive,
                  ]}
                >
                  {!!tempFiltroServico[option.key] && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de Operação</Text>
            {OP_PADRAO_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={styles.filterItem}
                onPress={() => toggleOpPadrao(option.key)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: tempFiltroOpPadrao[option.key] }}
              >
                <Text style={styles.filterLabel}>{option.label}</Text>
                <View
                  style={[
                    styles.checkbox,
                    !!tempFiltroOpPadrao[option.key] && styles.checkboxActive,
                  ]}
                >
                  {!!tempFiltroOpPadrao[option.key] && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyText}>Aplicar Filtros</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  cancelButton: {
    paddingVertical: 5,
  },
  cancelText: {
    fontSize: 16,
    color: COLORS.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
  },
  resetButton: {
    paddingVertical: 5,
  },
  resetText: {
    fontSize: 16,
    color: COLORS.danger,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 15,
  },
  filterItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 16,
    color: COLORS.black,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.gray,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "bold",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  applyText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default FilterModal;
