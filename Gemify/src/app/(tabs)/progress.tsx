import { StyleSheet, Text, View } from "react-native";

export default function ProgressScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progress</Text>
      <Text style={styles.body}>
        Track momentum over time and make the next useful move easier to see.
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
