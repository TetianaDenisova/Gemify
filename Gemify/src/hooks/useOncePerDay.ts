import { useCallback, useEffect, useState } from "react";

import { getSetting, setSetting } from "@/db";
import { todayKey } from "@/utils/dates";

export type UseOncePerDayResult = {
  /** True once the stored day is read and it is not today. */
  due: boolean;
  /** Stores today against the key, so `due` stays false until tomorrow. */
  markSeen: () => Promise<void>;
};

/**
 * "Has this been shown today?", per device.
 *
 * `due` starts false and flips only after the stored day is read, so a prompt
 * can never flash open while the answer is still unknown. `markSeen` writes
 * today's key and closes it for the rest of the day.
 */
export function useOncePerDay(key: string): UseOncePerDayResult {
  const [due, setDue] = useState(false);

  useEffect(() => {
    let active = true;
    getSetting(key)
      .then((seenOn) => {
        if (active) setDue(seenOn !== todayKey());
      })
      .catch((cause: unknown) => {
        console.error(`Failed to read the daily flag ${key}`, cause);
      });
    return () => {
      active = false;
    };
  }, [key]);

  const markSeen = useCallback(async () => {
    setDue(false);
    try {
      await setSetting(key, todayKey());
    } catch (cause) {
      console.error(`Failed to store the daily flag ${key}`, cause);
    }
  }, [key]);

  return { due, markSeen };
}
