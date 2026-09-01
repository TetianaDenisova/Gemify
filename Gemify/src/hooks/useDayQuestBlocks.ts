import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import type { ActionIcon, TimeBlock } from "@/dto/timeBlocks";
import {
  getScheduledQuests,
  getTimeBlocks,
  setQuestDone,
  type QuestWithBreadcrumb,
} from "@/db";

/**
 * A day's schedule: the routine time-block frames (labels, times, identity)
 * filled with the REAL quests planned in the weekly sprint — each quest
 * belongs to a milestone, and lands in the block whose start time most
 * recently precedes its scheduled time (no time → the flexible block).
 */
export type QuestBlockView = Omit<TimeBlock, "actions"> & {
  actions: (TimeBlock["actions"][number] & {
    /** 0..100 — dream % completing this quest adds. */
    progressPercent: number;
    questId: number;
  })[];
};

export type UseDayQuestBlocksResult = {
  blocks: QuestBlockView[];
  loading: boolean;
  error: string | null;
  totalQuests: number;
  completedQuests: number;
  /** Persists the done state and updates local state optimistically. */
  toggleQuest: (questId: number, done: boolean) => void;
  refresh: () => Promise<void>;
};

/** Key of the block whose start time most recently passed (Home focus). */
export function currentBlockKey(
  blocks: readonly QuestBlockView[],
  now: Date,
): string | null {
  const clock = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;

  let key: string | null = null;
  let latest = "";
  for (const block of blocks) {
    if (block.time !== "Flexible" && block.time <= clock && block.time >= latest) {
      latest = block.time;
      key = block.key;
    }
  }
  return key ?? blocks.find((block) => block.time === "Flexible")?.key ?? null;
}

/** Dream-magic icon variety for quests, stable per quest id. */
const QUEST_ICONS: readonly ActionIcon[] = [
  "star",
  "moon",
  "crystal",
  "wand",
  "key",
  "feather",
];

/** The dream-magic icon a quest keeps everywhere it appears. */
export function questIconForId(questId: number): ActionIcon {
  return QUEST_ICONS[questId % QUEST_ICONS.length];
}

function toAction(quest: QuestWithBreadcrumb): QuestBlockView["actions"][number] {
  return {
    done: quest.isDone,
    dreamTitle: quest.dreamTitle,
    icon: questIconForId(quest.id),
    milestoneTitle: quest.milestoneTitle,
    progressPercent: quest.progressPercent,
    subtitle: "",
    questId: quest.id,
    title: quest.title,
  };
}

export function useDayQuestBlocks(date: string): UseDayQuestBlocksResult {
  const [blocks, setBlocks] = useState<QuestBlockView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const [blockDefs, quests] = await Promise.all([
        getTimeBlocks(),
        getScheduledQuests(date),
      ]);

      // Timed blocks in start-time order; the flexible block collects quests
      // without a time and quests earlier than the first timed block.
      const timed = blockDefs
        .filter((block) => block.startTime !== null)
        .sort((a, b) => (a.startTime! < b.startTime! ? -1 : 1));
      const flexibleKey =
        blockDefs.find((block) => block.startTime === null)?.key ??
        blockDefs[0]?.key;

      const questsByBlock = new Map<string, QuestWithBreadcrumb[]>();
      for (const quest of quests) {
        let key = flexibleKey;
        if (quest.scheduledTime) {
          for (const block of timed) {
            if (block.startTime! <= quest.scheduledTime) key = block.key;
          }
        }
        if (key === undefined) continue;
        const list = questsByBlock.get(key) ?? [];
        list.push(quest);
        questsByBlock.set(key, list);
      }

      if (!mounted.current) return;
      setBlocks(
        blockDefs.map((block) => ({
          key: block.key,
          label: block.label,
          icon: block.iconKey,
          time: block.startTime ?? "Flexible",
          identity: block.identity ?? "",
          routineTitle: block.routineTitle,
          routineSubtitle: block.routineSubtitle ?? "",
          actions: (questsByBlock.get(block.key) ?? []).map(toAction),
        })),
      );
      setError(null);
    } catch (cause) {
      if (mounted.current) {
        setError(
          cause instanceof Error ? cause.message : "Failed to load your day.",
        );
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      mounted.current = true;
      refresh();
      return () => {
        mounted.current = false;
      };
    }, [refresh]),
  );

  const toggleQuest = useCallback(
    (questId: number, done: boolean) => {
      setBlocks((current) =>
        current.map((block) => ({
          ...block,
          actions: block.actions.map((action) =>
            action.questId === questId ? { ...action, done } : action,
          ),
        })),
      );
      setQuestDone(questId, done).catch((cause: unknown) => {
        console.error("Failed to save the quest state", cause);
        if (mounted.current) refresh();
      });
    },
    [refresh],
  );

  const totalQuests = blocks.reduce(
    (sum, block) => sum + block.actions.length,
    0,
  );
  const completedQuests = blocks.reduce(
    (sum, block) => sum + block.actions.filter((action) => action.done).length,
    0,
  );

  return {
    blocks,
    loading,
    error,
    totalQuests,
    completedQuests,
    toggleQuest,
    refresh,
  };
}
