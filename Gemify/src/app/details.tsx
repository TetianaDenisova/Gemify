import { StyleSheet, View } from "react-native";

import { AppText, ScreenHeader } from "@/shared/components";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/theme";

export default function DetailsScreen() {
  return (
    <>
      <ScreenHeader asStackHeader />
      <View style={styles.container}>
        <AppText align="center" style={styles.title} variant="title">
          Stack screen
        </AppText>
        <AppText align="center" style={styles.body}>
          This page sits outside the tab group, so it opens above the tabs and
          uses the shared navigation header.
        </AppText>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  body: {
    maxWidth: 340,
  },
  container: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  title: {
    marginBottom: spacing.sm,
  },
});
