import { StyleSheet, Text, View } from "react-native";

export default function SprintScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sprint</Text>
      <Text style={styles.body}>
        Plan the next push, keep priorities visible, and turn bigger goals into
        a workable sprint.
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
