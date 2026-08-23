import { Platform } from "react-native";

/** Subdirectory of the app's document directory that holds memory photos. */
const PHOTO_DIR = "memories";

function uniquePhotoName(sourceUri: string): string {
  const tail = sourceUri.split("?")[0].split("/").pop() ?? "";
  const dotIndex = tail.lastIndexOf(".");
  const extension =
    dotIndex > 0 && /^[A-Za-z0-9]{1,5}$/.test(tail.slice(dotIndex + 1))
      ? tail.slice(dotIndex + 1).toLowerCase()
      : "jpg";
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
}

/**
 * Copies a freshly picked photo into permanent app storage and returns the
 * durable URI. On web the picker already returns a self-contained data URI
 * that can be stored as-is; native picker URIs point into a cache directory
 * the OS may clear, hence the copy. expo-file-system is imported lazily
 * because it has no web implementation.
 */
export async function persistMemoryPhoto(uri: string): Promise<string> {
  if (Platform.OS === "web") return uri;
  const { Directory, File, Paths } = await import("expo-file-system");
  const dir = new Directory(Paths.document, PHOTO_DIR);
  if (!dir.exists) dir.create();
  const target = new File(dir, uniquePhotoName(uri));
  new File(uri).copy(target);
  return target.uri;
}

/** Best-effort removal of photo files this app copied into permanent storage. */
export async function deleteMemoryPhotos(
  uris: readonly string[],
): Promise<void> {
  if (Platform.OS === "web" || uris.length === 0) return;
  const { File } = await import("expo-file-system");
  for (const uri of uris) {
    // Only touch files we own; picker/cache URIs are the system's to manage.
    if (!uri.includes(`/${PHOTO_DIR}/`)) continue;
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch {
      // Losing an orphaned file matters less than completing the delete.
    }
  }
}
