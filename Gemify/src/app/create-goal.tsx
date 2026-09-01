import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";

import { OnboardingStep } from "@/components/OnboardingStep";
import { AppInput } from "@/shared/components";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/theme";

const DREAM_NAME_MAX_LENGTH = 60;

export default function CreateGoalScreen() {
  const router = useRouter();
  const [dreamName, setDreamName] = useState("");

  return (
    <OnboardingStep
      continueDisabled={!dreamName.trim()}
      hint={
        "Keep it simple, poetic, or practical.\nThe name only needs to mean something to you."
      }
      onContinue={() =>
        router.navigate({
          pathname: "/describe-dream",
          params: { name: dreamName.trim() },
        })
      }
      subtitle="Write down the future you want to create. Give it a name, and let the journey begin."
      title={"Give your\ndream a name"}
    >
      <AppInput
        accessibilityLabel="Name your dream"
        containerStyle={styles.inputContainer}
        maxLength={DREAM_NAME_MAX_LENGTH}
        onChangeText={setDreamName}
        placeholder="My dream name is..."
        returnKeyType="next"
        selectionColor={colors.primary}
        value={dreamName}
      />
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: spacing.sm,
    width: "100%",
  },
});
