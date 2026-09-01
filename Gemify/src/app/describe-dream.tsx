import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";

import { OnboardingStep } from "@/components/OnboardingStep";
import { AppInput } from "@/shared/components";
import { colors } from "@/theme/colors";

const DESCRIPTION_MAX_LENGTH = 300;

export default function DescribeDreamScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name?: string }>();
  const [description, setDescription] = useState("");

  return (
    <OnboardingStep
      hint={"Be vivid. Be honest. Be you.\nThere's no right or wrong here."}
      onContinue={() =>
        router.navigate({
          pathname: "/see-dream",
          params: { name: name ?? "", description: description.trim() },
        })
      }
      subtitle={"Not a goal. A reality.\nA life you want to live."}
      title={"Describe\nyour dream"}
    >
      {(compactLayout) => (
        <AppInput
          accessibilityLabel="Describe your future reality"
          containerStyle={styles.inputContainer}
          inputStyle={{ minHeight: compactLayout ? 98 : 128 }}
          maxLength={DESCRIPTION_MAX_LENGTH}
          multiline
          onChangeText={setDescription}
          placeholder="Write your future..."
          selectionColor={colors.primary}
          showCounter
          value={description}
        />
      )}
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    width: "100%",
  },
});
