import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import {
  getOverdueQuests,
  rescheduleQuests,
  rolloverOverdueQuests,
  type QuestWithBreadcrumb,
} from "@/db";
import { useOncePerDay } from "@/hooks/useOncePerDay";
import { addDays, toDateKey, todayKey } from "@/utils/dates";

const PROMPT_KEY = "overdue_prompt";

export type UseOverduePromptResult = {
  /** Yesterday's undone quests, once the prompt is open. */
  quests: QuestWithBreadcrumb[];
  visible: boolean;
  /** Puts them on today, still accepted. */
  moveToToday: () => Promise<void>;
  /** Lets them go: unscheduled and un-accepted, back at their milestone. */
  release: () => Promise<void>;
};

/**
 * Asks, once a day, what to do with the quests that did not happen.
 *
 * Only yesterday's are worth asking about, so anything older is released on
 * the spot: a quest ignored for more than a day is not a plan any more, and it
 * goes back to its milestone un-accepted rather than lingering on a past date.
 *
 * `onChanged` reloads the screen after either answer; it must be stable (a
 * `useCallback`), since it is what the check runs on.
 */
export function useOverduePrompt(
  onChanged: () => void,
): UseOverduePromptResult {
  const { due, markSeen } = useOncePerDay(PROMPT_KEY);
  const [quests, setQuests] = useState<QuestWithBreadcrumb[]>([]);
  const [visible, setVisible] = useState(false);

  // On focus rather than on mount: My Day and the Weekly Plan both hold this
  // hook, and an unfocused tab must never put its modal over the focused one.
  // Whichever screen is focused asks; the other one, focused later, re-checks,
  // finds nothing pending and quietly marks the day seen.
  useFocusEffect(
    useCallback(() => {
      if (!due) return;
      let active = true;

      const check = async () => {
        const today = todayKey();
        const yesterday = toDateKey(addDays(new Date(), -1));
        // Older than yesterday: released without asking.
        const released = await rolloverOverdueQuests(yesterday);
        const pending = await getOverdueQuests(today);

        if (!active) return;
        if (pending.length === 0) {
          // Nothing to ask about; the day is settled.
          await markSeen();
        } else {
          setQuests(pending);
          setVisible(true);
        }
        if (released > 0) onChanged();
      };

      check().catch((cause: unknown) => {
        console.error("Failed to check for overdue quests", cause);
      });

      return () => {
        active = false;
      };
    }, [due, markSeen, onChanged]),
  );

  const finish = useCallback(async () => {
    setVisible(false);
    setQuests([]);
    await markSeen();
    onChanged();
  }, [markSeen, onChanged]);

  const moveToToday = useCallback(async () => {
    try {
      await rescheduleQuests(
        quests.map((quest) => quest.id),
        todayKey(),
      );
    } catch (cause) {
      console.error("Failed to move the overdue quests to today", cause);
    }
    await finish();
  }, [finish, quests]);

  const release = useCallback(async () => {
    try {
      await rolloverOverdueQuests(todayKey());
    } catch (cause) {
      console.error("Failed to release the overdue quests", cause);
    }
    await finish();
  }, [finish]);

  return { quests, visible, moveToToday, release };
}
