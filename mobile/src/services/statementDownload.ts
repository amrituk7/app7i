// Save a CSV statement to the user's device as a real file. Uses Android's
// Storage Access Framework so the file lands in a folder the user picked
// (typically Downloads or Documents). Falls back to a Share-with-file-URI flow
// on iOS. Both paths lazy-load native modules so an OTA can ship them safely.

import { Platform, Share } from "react-native";

type FileSystemModule = typeof import("expo-file-system/legacy");

let _fileSystem: FileSystemModule | null | undefined;

async function loadFileSystem(): Promise<FileSystemModule | null> {
  if (_fileSystem !== undefined) return _fileSystem;
  try {
    // expo-file-system v55 split: the high-level legacy API (StorageAccessFramework,
    // EncodingType, writeAsStringAsync, documentDirectory) lives under /legacy.
    _fileSystem = (await import("expo-file-system/legacy")) as FileSystemModule;
    return _fileSystem;
  } catch {
    _fileSystem = null;
    return null;
  }
}

export type DownloadResult =
  | { kind: "saved"; location: string }
  | { kind: "shared" }
  | { kind: "cancelled" }
  | { kind: "unavailable"; reason: string };

type DownloadInput = {
  filename: string;
  content: string;
  mimeType?: string;
  /** When true, `content` is base64-encoded binary (e.g. a PDF). */
  base64?: boolean;
};

/**
 * Save `content` as a real file on the device. On Android the user is asked
 * to pick a folder once (e.g. Downloads). On iOS the share sheet opens with
 * the file attached, so the user can choose Files, Mail, Drive etc.
 */
export async function saveStatementFile({
  filename,
  content,
  mimeType = "text/csv",
  base64 = false,
}: DownloadInput): Promise<DownloadResult> {
  const FileSystem = await loadFileSystem();
  if (!FileSystem) {
    return {
      kind: "unavailable",
      reason: "File system unavailable on this build — try reinstalling the app.",
    };
  }

  if (Platform.OS === "android") {
    return saveOnAndroid(FileSystem, filename, content, mimeType, base64);
  }
  return saveOnIOS(FileSystem, filename, content, base64);
}

async function saveOnAndroid(
  FileSystem: FileSystemModule,
  filename: string,
  content: string,
  mimeType: string,
  base64: boolean,
): Promise<DownloadResult> {
  const SAF = FileSystem.StorageAccessFramework;
  if (!SAF) {
    return { kind: "unavailable", reason: "Storage Access Framework not supported." };
  }
  const permissions = await SAF.requestDirectoryPermissionsAsync();
  if (!permissions.granted) {
    return { kind: "cancelled" };
  }
  try {
    const fileUri = await SAF.createFileAsync(permissions.directoryUri, filename, mimeType);
    await SAF.writeAsStringAsync(fileUri, content, {
      encoding: base64 ? FileSystem.EncodingType.Base64 : FileSystem.EncodingType.UTF8,
    });
    return { kind: "saved", location: prettyFolderFromSafUri(permissions.directoryUri) };
  } catch (err) {
    return {
      kind: "unavailable",
      reason: err instanceof Error ? err.message : "Couldn't save file.",
    };
  }
}

async function saveOnIOS(
  FileSystem: FileSystemModule,
  filename: string,
  content: string,
  base64: boolean,
): Promise<DownloadResult> {
  // Write to the app's cache (private but readable by Share sheet), then hand
  // the URL to the system share sheet. User picks Files / Mail / Drive etc.
  const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  if (!dir) {
    return { kind: "unavailable", reason: "No writable directory available." };
  }
  const uri = `${dir}${filename}`;
  await FileSystem.writeAsStringAsync(uri, content, {
    encoding: base64 ? FileSystem.EncodingType.Base64 : FileSystem.EncodingType.UTF8,
  });
  try {
    await Share.share({ url: uri, title: filename });
    return { kind: "shared" };
  } catch {
    return { kind: "cancelled" };
  }
}

function prettyFolderFromSafUri(directoryUri: string): string {
  // SAF URIs look like `content://com.android.externalstorage.documents/tree/primary%3ADownload`.
  // We pull the trailing folder name for a friendly toast.
  try {
    const decoded = decodeURIComponent(directoryUri);
    const m = decoded.match(/([^/:]+)$/);
    return m ? m[1] : "your chosen folder";
  } catch {
    return "your chosen folder";
  }
}
