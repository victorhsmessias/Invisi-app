import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { COLORS, SERVICO_OPTIONS, OP_PADRAO_OPTIONS } from "../constants";

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

  const handleApply = () => {
    console.log('[FilterModal] Applying filters:', {
      servico: tempFiltroServico,
      opPadrao: tempFiltroOpPadrao
    });
    setFiltroServico(tempFiltroServico);
    setFiltroOpPadrao(tempFiltroOpPadrao);
    onApply();
    onClose();
  };

  const handleReset = () => {
    const defaultServico = {
      armazenagem: 1,
      transbordo: 1,
      pesagem: 0,
    };
    const defaultOpPadrao = {
      rodo_ferro: 1,
      ferro_rodo: 1,
      rodo_rodo: 1,
      outros: 0,
    };
    setTempFiltroServico(defaultServico);
    setTempFiltroOpPadrao(defaultOpPadrao);
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
      presentationStyle="pageSheet"
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
          {/* Filtro de Serviços */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de Serviço</Text>
            {SERVICO_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={styles.filterItem}
                onPress={() => toggleServico(option.key)}
              >
                <Text style={styles.filterLabel}>{option.label}</Text>
                <View
                  style={[
                    styles.checkbox,
                    tempFiltroServico[option.key] === 1 && styles.checkboxActive,
                  ]}
                >
                  {tempFiltroServico[option.key] === 1 && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Filtro de Operações Padrão */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de Operação</Text>
            {OP_PADRAO_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={styles.filterItem}
                onPress={() => toggleOpPadrao(option.key)}
              >
                <Text style={styles.filterLabel}>{option.label}</Text>
                <View
                  style={[
                    styles.checkbox,
                    tempFiltroOpPadrao[option.key] === 1 && styles.checkboxActive,
                  ]}
                >
                  {tempFiltroOpPadrao[option.key] === 1 && (
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