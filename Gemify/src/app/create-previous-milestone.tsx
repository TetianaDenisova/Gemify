import { useRouter } from "expo-router";
import type { ReactElement } from "react";
import { useState } from "react";
import {
  Image,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import {
  AppButton,
  AppInput,
  AppText,
  Card,
  ScreenHeader,
  ScreenScaffold,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { controls, fontSizes, lineHeights, spacing } from "@/theme/theme";

const BACKGROUND = require("../../assets/create-goal/entering.png");
const BANNER = require("../../assets/create-goal/banner-create-milestone.png");

const STEP_NAME_MAX_LENGTH = 40;
const SHORT_MAX_LENGTH = 40;
const LONG_MAX_LENGTH = 60;
const MIN_READABLE_BANNER_WIDTH = 380;

type FieldConfig = {
  id: string;
  label: string;
  maxLength: number;
  placeholder: string;
  renderIcon: () => ReactElement;
};

function FlagIcon() {
  return (
    <Svg fill="none" height={34} viewBox="0 0 24 24" width={34}>
      <Path
        d="M5 21V4.8c3.5-2 6 .9 10-.9 1-.4 1.9-.9 3-1.8v9.5c-1.1.9-2 1.4-3 1.8-4 1.8-6.5-1.1-10 .9"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
      />
    </Svg>
  );
}

function HeartIcon() {
  return (
    <Svg fill="none" height={34} viewBox="0 0 24 24" width={34}>
      <Path
        d="M20.6 5.8c-2-2.3-5.2-1.7-6.9.5L12 8.4l-1.7-2.1C8.6 4.1 5.4 3.5 3.4 5.8c-2.3 2.7-.9 6.4 1.6 8.7l7 6.1 7-6.1c2.5-2.3 3.9-6 1.6-8.7Z"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
      />
    </Svg>
  );
}

function UserIcon() {
  return (
    <Svg fill="none" height={34} viewBox="0 0 24 24" width={34}>
      <Path
        d="M12 12.5a4.1 4.1 0 1 0 0-8.2 4.1 4.1 0 0 0 0 8.2ZM4.2 21c.9-4.2 3.7-6.2 7.8-6.2s6.9 2 7.8 6.2"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
      />
    </Svg>
  );
}

function SparkIcon() {
  return (
    <Svg fill="none" height={34} viewBox="0 0 24 24" width={34}>
      <Path
        d="M12 2.8c.7 4.4 2.8 6.5 7.2 7.2-4.4.7-6.5 2.8-7.2 7.2-.7-4.4-2.8-6.5-7.2-7.2 4.4-.7 6.5-2.8 7.2-7.2Z"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
      />
    </Svg>
  );
}

function GiftIcon() {
  return (
    <Svg fill="none" height={34} viewBox="0 0 24 24" width={34}>
      <Path
        d="M4 10h16v11H4V10ZM3 6.8h18V10H3V6.8ZM12 6.8V21M8.2 6.8C6.3 6.5 5.1 5.6 5.1 4.3c0-1.1.9-2 2-2 2.2 0 3.6 2.6 4.9 4.5M15.8 6.8c1.9-.3 3.1-1.2 3.1-2.5 0-1.1-.9-2-2-2-2.2 0-3.6 2.6-4.9 4.5"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
      />
    </Svg>
  );
}

const FIELDS: readonly FieldConfig[] = [
  {
    id: "stepName",
    label: "Step name",
    maxLength: STEP_NAME_MAX_LENGTH,
    placeholder: "e.g. Inner Clarity",
    renderIcon: FlagIcon,
  },
  {
    id: "feeling",
    label: "What will you feel when you finish?",
    maxLength: SHORT_MAX_LENGTH,
    placeholder: "e.g. Calm, confident, relieved",
    renderIcon: HeartIcon,
  },
  {
    id: "helper",
    label: "Who will help you?",
    maxLength: SHORT_MAX_LENGTH,
    placeholder: "e.g. Mentor, Guide, Friend",
    renderIcon: UserIcon,
  },
  {
    id: "artifact",
    label: "What artifact will mark completion?",
    maxLength: LONG_MAX_LENGTH,
    placeholder: "e.g. A letter, A symbol, A key",
    renderIcon: SparkIcon,
  },
  {
    id: "reward",
    label: "What reward will help you on the next steps?",
    maxLength: LONG_MAX_LENGTH,
    placeholder: "e.g. Confidence, Knowledge, New skill",
    renderIcon: GiftIcon,
  },
];

export default function CreatePreviousMilestoneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const compact = height < 760 || width < 380;
  const showBanner = Math.min(width - 24, 620) >= MIN_READABLE_BANNER_WIDTH;
  const [values, setValues] = useState<Record<string, string>>({});

  return (
    <>
      <ScreenHeader asStackHeader />
      <ScreenScaffold
        backgroundImage={BACKGROUND}
        contentStyle={[
          styles.content,
          { paddingTop: insets.top + (compact ? 60 : 72) },
        ]}
        keyboardAvoiding
        overlayOpacity={0.9}
      >
        <Card style={styles.pageSurface}>
          <View style={styles.titleBlock}>
            <AppText
              align="center"
              color={colors.primary}
              style={compact && styles.titleCompact}
              variant="title"
            >
              Which milestone came before &quot;Awakening&quot;?
            </AppText>
            <AppText align="center" style={styles.subtitle} variant="subtitle">
              Trace your journey backward from{" "}
              <AppText color={colors.primary} variant="subtitle">
                Point B
              </AppText>{" "}
              to where it all begins.
            </AppText>
          </View>

          {showBanner ? (
            <View style={styles.bannerContainer}>
              <Image resizeMode="cover" source={BANNER} style={styles.banner} />
            </View>
          ) : null}

          <View style={styles.form}>
            {FIELDS.map((field) => {
              const value = values[field.id] ?? "";
              const Icon = field.renderIcon;

              return (
                <AppInput
                  accessibilityLabel={field.label}
                  icon={<Icon />}
                  key={field.id}
                  label={field.label}
                  maxLength={field.maxLength}
                  onChangeText={(nextValue) =>
                    setValues((current) => ({
                      ...current,
                      [field.id]: nextValue,
                    }))
                  }
                  placeholder={field.placeholder}
                  selectionColor={colors.primary}
                  showCounter
                  value={value}
                />
              );
            })}
          </View>

          <AppButton
            accessibilityLabel="Add new milestone"
            label="Add new milestone"
            onPress={() => router.navigate("/journey-map")}
            size="lg"
            style={styles.placeButton}
            variant="primary"
          />
        </Card>
      </ScreenScaffold>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: "100%",
    width: "100%",
  },
  bannerContainer: {
    alignSelf: "stretch",
    aspectRatio: 1712 / 650,
    marginHorizontal: -controls.surface.cardPadding,
    marginTop: spacing.sm,
    overflow: "hidden",
  },
  content: {
    alignItems: "center",
  },
  form: {
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: "100%",
  },
  pageSurface: {
    overflow: "hidden",
    width: "100%",
  },
  placeButton: {
    marginTop: spacing.xl,
    width: "100%",
  },
  subtitle: {
    marginTop: spacing.sm,
  },
  titleBlock: {
    alignItems: "center",
    width: "100%",
  },
  titleCompact: {
    fontSize: fontSizes.xxxl,
    lineHeight: lineHeights.xxxl,
  },
});
