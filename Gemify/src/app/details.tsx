import { Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function DetailsScreen() {
  return (
    <View style={styles.container}>
      <Stack.Title>Gem details</Stack.Title>
      <Text style={styles.title}>Stack screen</Text>
      <Text style={styles.body}>
        This page sits outside the tab group, so it opens above the tabs and
        gets the native stack back button automatically.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: "#4d5662",
    fontSize: 16,
    lineHeight: 23,
    maxWidth: 340,
    textAlign: "center",
  },
  container: {
    alignItems: "center",
    backgroundColor: "#f7f9fc",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: "#15171a",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0,
    marginBottom: 12,
    textAlign: "center",
  },
});
