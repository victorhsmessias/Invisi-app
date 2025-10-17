import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Platform } from "react-native";
import { COLORS } from "../constants";

const SkeletonCard: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Animated.View style={[styles.icon, { opacity: pulseAnim }]} />
        <View style={styles.content}>
          <Animated.View style={[styles.value, { opacity: pulseAnim }]} />
          <Animated.View style={[styles.subtitle, { opacity: pulseAnim }]} />
          <Animated.View style={[styles.title, { opacity: pulseAnim }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.lightGray,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.lightGray,
    marginRight: 15,
  },
  content: {
    flex: 1,
  },
  value: {
    width: 60,
    height: 32,
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
    marginBottom: 4,
  },
  subtitle: {
    width: 80,
    height: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    marginBottom: 6,
  },
  title: {
    width: 120,
    height: 14,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
  },
});

SkeletonCard.displayName = "SkeletonCard";

export default SkeletonCard;
