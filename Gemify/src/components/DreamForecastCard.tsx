import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import type { DreamForecastEntry } from "@/data/progressData";
import { AppText, Card } from "@/shared/components";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/theme";

const FORECAST_ART = require("../../assets/home/will-achieve.png");

type DreamForecastCardProps = {
  forecasts: readonly DreamForecastEntry[];
  loading: boolean;
};

export function DreamForecastCard({ forecasts, loading }: DreamForecastCardProps) {
  return (
    <Card padded={false} style={styles.card} variant="glass">
      <View style={styles.artHeader}>
        <Image
          contentFit="cover"
          contentPosition="center"
          source={FORECAST_ART}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[colors.transparent, colors.background]}
          style={styles.artFade}
        />
      </View>
      <View style={styles.content}>
        <AppText color={colors.primary} variant="title">Dream Forecast</AppText>
        <AppText style={styles.caption} variant="bodySerif">
          If you keep going like this, you are on track to reach your dreams around these dates.
        </AppText>
        {forecasts.length > 0 ? forecasts.map((forecast) => (
          <View key={forecast.dreamId} style={styles.row}>
            <AppText style={styles.dreamTitle} variant="pill">
              {forecast.title}
            </AppText>
            <AppText
              color={forecast.date ? colors.primary : colors.textMuted}
              style={styles.date}
              variant="pill"
            >
              {forecast.date
                ? new Date(`${forecast.date}T12:00:00`).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })
                : "Pending"}
            </AppText>
          </View>
        )) : (
          <AppText style={styles.empty} variant="bodySerif">
            {loading ? "Loading forecasts..." : "Your dream forecasts will appear here."}
          </AppText>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  artFade: {
    bottom: 0,
    height: "40%",
    left: 0,
    position: "absolute",
    right: 0,
  },
  artHeader: {
    aspectRatio: 3.3,
    maxHeight: 220,
    width: "100%",
  },
  caption: {
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  content: {
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  date: {
    flexShrink: 0,
    textAlign: "right",
  },
  dreamTitle: {
    flex: 1,
    minWidth: 0,
  },
  empty: {
    paddingBottom: spacing.md,
  },
  row: {
    alignItems: "center",
    borderTopColor: colors.borderSoft,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 44,
    paddingVertical: spacing.sm,
  },
});
