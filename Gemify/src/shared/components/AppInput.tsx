import { useState, type ReactNode } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { colors } from "@/theme/colors";
import { inputFocusReset, radius, spacing, typography } from "@/theme/theme";

import { AppText } from "./AppText";

export type AppInputProps = Omit<TextInputProps, "style"> & {
  containerStyle?: StyleProp<ViewStyle>;
  /** Leading adornment inside the field. */
  icon?: ReactNode;
  inputStyle?: StyleProp<TextStyle>;
  label?: string;
  /** Show a "n/max" counter (requires maxLength). */
  showCounter?: boolean;
};

/**
 * The standard text field: glass surface, gold border (brighter when
 * focused), optional label, leading icon, and character counter.
 */
export function AppInput({
  containerStyle,
  icon,
  inputStyle,
  label,
  maxLength,
  multiline = false,
  onBlur,
  onFocus,
  showCounter = false,
  value,
  ...rest
}: AppInputProps) {
  const [focused, setFocused] = useState(false);
  const hasCounter = showCounter && maxLength != null;

  return (
    <View style={containerStyle}>
      {label ? (
        <AppText color={colors.primary} style={styles.label} variant="label">
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.field,
          multiline && styles.fieldMultiline,
          focused && styles.fieldFocused,
        ]}
      >
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <TextInput
          {...rest}
          maxLength={maxLength}
          multiline={multiline}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={colors.textPlaceholder}
          style={[styles.input, multiline && styles.inputMultiline, inputStyle]}
          value={value}
        />
        {hasCounter ? (
          <AppText style={styles.counter} variant="caption">
            {(value ?? "").length}/{maxLength}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  counter: {
    bottom: spacing.sm,
    position: "absolute",
    right: spacing.md,
  },
  field: {
    alignItems: "center",
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 58,
    paddingHorizontal: spacing.md,
  },
  fieldFocused: {
    borderColor: colors.primary,
  },
  fieldMultiline: {
    alignItems: "flex-start",
    minHeight: 96,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    ...typography.input,
    ...inputFocusReset,
    flex: 1,
    padding: 0,
  },
  inputMultiline: {
    textAlignVertical: "top",
  },
  label: {
    marginBottom: spacing.sm,
  },
});
