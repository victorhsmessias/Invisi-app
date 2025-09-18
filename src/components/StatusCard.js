import React, { useRef, memo } from "react";
import {
  View,
  Text,
  TouchableWithoutFeedback,
  Animated,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { COLORS } from "../constants";

const StatusCard = memo(
  ({ title, value, icon, color, loading, subtitle, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    const handlePress = () => {
      if (onPress) {
        onPress();
      }
    };

    const getColorByValue = (val, type) => {
      if (type === "fila") {
        if (val > 20) return COLORS.danger;
        if (val > 10) return COLORS.warning;
        return COLORS.success;
      }
      return color;
    };

    const displayColor = getColorByValue(
      value,
      title.includes("fila") ? "fila" : "normal"
    );

    return (
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              borderLeftColor: displayColor,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.icon}>{icon}</Text>
            <View style={styles.content}>
              {loading ? (
                <ActivityIndicator size="small" color={displayColor} />
              ) : (
                <>
                  <Text style={[styles.value, { color: displayColor }]}>
                    {value}
                  </Text>
                  {subtitle && (
                    <Text style={styles.subtitle}>{subtitle}</Text>
                  )}
                </>
              )}
              <Text style={styles.title}>{title}</Text>
            </View>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    fontSize: 28,
    marginRight: 15,
  },
  content: {
    flex: 1,
  },
  value: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    color: COLORS.gray,
  },
});

StatusCard.displayName = "StatusCard";

export default StatusCard;