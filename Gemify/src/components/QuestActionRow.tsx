import { DayActionRow } from "@/components/DayActionCard";
import { useLayoutSize } from "@/hooks/useLayoutSize";
import { AppText } from "@/shared/components";
import { colors } from "@/theme/colors";

export function QuestActionRow({
  done,
  dreamTitle,
  last,
  onPress,
  onToggle,
  progressPercent,
  subtitle,
  title,
}: {
  done: boolean;
  dreamTitle?: string;
  last?: boolean;
  onPress?: () => void;
  onToggle: () => void;
  progressPercent: number;
  subtitle?: string;
  title: string;
}) {
  const { phone } = useLayoutSize();

  return (
    <DayActionRow
      checkLabel={`Mark ${title} ${done ? "incomplete" : "complete"}`}
      done={done}
      last={last}
      trailing={
        <AppText color={colors.primary} variant={phone ? "pill" : "titleSm"}>
          +{Math.max(1, Math.round(progressPercent))}%
        </AppText>
      }
      onPress={onPress}
      onToggle={onToggle}
      subtitle={dreamTitle || subtitle}
      title={title}
    />
  );
}
