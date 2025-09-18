import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { COLORS } from "../constants";

const LoadingSpinner = ({ text = "Carregando...", size = "large", color = COLORS.primary }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray,
    textAlign: "center",
  },
});

export default LoadingSpinner;