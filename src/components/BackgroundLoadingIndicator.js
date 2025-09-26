import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from "react-native";
import { COLORS } from "../constants";

const BackgroundLoadingIndicator = ({
  visible,
  text = "Atualizando...",
  position = "top",
}) => {
  const [fadeAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        position === "bottom" ? styles.bottomPosition : styles.topPosition,
        { opacity: fadeAnim },
      ]}
    >
      <View style={styles.content}>
        <ActivityIndicator
          size="small"
          color={COLORS.white}
          style={styles.spinner}
        />
        <Text style={styles.text}>{text}</Text>
      </View>
    </Animated.View>
  );
};

export const HeaderLoadingIndicator = ({ visible }) => {
  const [rotateAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();
      return () => rotateAnimation.stop();
    }
  }, [visible, rotateAnim]);

  if (!visible) return null;

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={[styles.headerIndicator, { transform: [{ rotate }] }]}
    >
      <Text style={styles.syncIcon}>⟳</Text>
    </Animated.View>
  );
};

export const PulseIndicator = ({ visible, color = COLORS.primary }) => {
  const [pulseAnim] = React.useState(new Animated.Value(1));

  React.useEffect(() => {
    if (visible) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [visible, pulseAnim]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.pulseIndicator, { opacity: pulseAnim }]}>
      <View style={[styles.pulseDot, { backgroundColor: color }]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  topPosition: {
    top: 0,
  },
  bottomPosition: {
    bottom: 0,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 122, 255, 0.9)",
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  spinner: {
    marginRight: 8,
  },
  text: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "500",
  },
  headerIndicator: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  syncIcon: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  pulseIndicator: {
    position: "absolute",
    top: 5,
    right: 5,
    zIndex: 100,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default BackgroundLoadingIndicator;
