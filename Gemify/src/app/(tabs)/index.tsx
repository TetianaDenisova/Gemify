import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Gemify</Text>
      <Text style={styles.title}>Hello Tania.</Text>
      <Text style={styles.body}>
        Your tab navigator is ready. This Home tab can push screens onto the
        root stack.
      </Text>
      <Link href="../details" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Open details</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: "#4d5662",
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 28,
    maxWidth: 320,
    textAlign: "center",
  },
  button: {
    alignItems: "center",
    backgroundColor: "#208AEF",
    borderRadius: 8,
    minWidth: 148,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  container: {
    alignItems: "center",
    backgroundColor: "#f7f9fc",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  eyebrow: {
    color: "#208AEF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  title: {
    color: "#15171a",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 0,
    marginBottom: 12,
    textAlign: "center",
  },
});
