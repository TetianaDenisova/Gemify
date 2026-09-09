/**
 * A one-line notice that a sync brought new data in.
 *
 * Screens load through focus-refreshing hooks, which is enough while the user
 * is moving around the app — but a sync that lands on the screen already open
 * (the one on start, or on coming back to the foreground) would otherwise sit
 * there invisible until the next navigation.
 *
 * Deliberately dependency-free so any layer can import it without dragging
 * the sync engine along.
 */

type Listener = () => void;

const listeners = new Set<Listener>();

/** Returns the unsubscribe function. */
export function subscribeToSyncApplied(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifySyncApplied(): void {
  for (const listener of [...listeners]) {
    listener();
  }
}
