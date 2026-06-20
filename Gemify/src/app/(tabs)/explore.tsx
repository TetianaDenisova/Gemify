import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Explore</Text>
      <Text style={styles.body}>
        Route groups keep this screen at /explore while the tab layout stays
        organized under src/app/(tabs).
      </Text>
      <Link href="/" asChild>
        <Pressable style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Back to home</Text>
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
  secondaryButton: {
    alignItems: "center",
    borderColor: "#cfd8e3",
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 148,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "#15171a",
    fontSize: 16,
    fontWeight: "700",
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
