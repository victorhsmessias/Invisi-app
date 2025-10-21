import React, { memo } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { SegmentedButtons } from "react-native-paper";
import { colors, spacing } from "../constants/theme";
import type { Filial } from "../types";

interface FilialSelectorProps {
  filiais: readonly Filial[];
  selectedFilial: Filial;
  onFilialChange: (filial: Filial) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const FilialSelector = memo<FilialSelectorProps>(
  ({
    filiais,
    selectedFilial,
    onFilialChange,
    isLoading = false,
    disabled = false,
  }) => {
    const buttons = filiais.map((filial, index) => ({
      value: filial,
      label: filial,
      disabled: disabled || isLoading,
      showSelectedCheck: false,
      style: {
        borderRadius: 0,
        ...(index === 0 && {
          borderTopLeftRadius: 30,
          borderBottomLeftRadius: 30,
        }),
        ...(index === filiais.length - 1 && {
          borderTopRightRadius: 30,
          borderBottomRightRadius: 30,
        }),
      },
    }));

    return (
      <View style={styles.container}>
        <SegmentedButtons
          value={selectedFilial}
          onValueChange={(value: string) =>
            !disabled && !isLoading && onFilialChange(value as Filial)
          }
          buttons={buttons}
          density="regular"
        />

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          </View>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    paddingTop: 6,
    position: "relative",
    backgroundColor: "transparent",
  },
  loadingOverlay: {
    position: "absolute",
    top: "200%",
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    zIndex: 10,
  },
  loadingContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 50,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

FilialSelector.displayName = "FilialSelector";

export default FilialSelector;
