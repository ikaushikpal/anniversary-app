import metadata from "../data/metadata.json";
import { defaultConfig } from "../data/defaultConfig";
import { loadConfig, saveConfig, clearConfig } from "./storage";
import { IS_DEV } from "./env";

export function getActiveConfig() {
  if (!IS_DEV) {
    // Production mode: Only read metadata.json
    return metadata ?? defaultConfig;
  }
  // Dev mode: check draft from localStorage first, then metadata.json, then defaultConfig
  return loadConfig() ?? metadata ?? defaultConfig;
}

export async function saveMetadata(config) {
  // Always update localStorage draft in dev mode
  saveConfig(config);

  if (IS_DEV) {
    try {
      const response = await fetch("/api/save-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      if (response.ok) {
        return { success: true, savedToFile: true };
      }
    } catch {
      // Dev server might not be running or endpoint unavailable
    }
  }

  return { success: true, savedToFile: false };
}

export function exportMetadataDownload(config) {
  const blob = new Blob([JSON.stringify(config, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "metadata.json";
  link.click();
  URL.revokeObjectURL(url);
}

export async function uploadMediaFile(file, folder = "photos") {
  if (!file) return "";
  const safeFolder = folder === "music" ? "music" : "photos";

  // In dev mode, upload file to dev server so it gets stored in public/<folder>/ directly
  if (IS_DEV) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const response = await fetch("/api/upload-media", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              dataBase64: reader.result,
              folder: safeFolder
            })
          });
          if (response.ok) {
            const result = await response.json();
            resolve(result.path);
            return;
          }
        } catch {
          // Fallback if endpoint fails
        }
        const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        resolve(`/${safeFolder}/${cleanName}`);
      };
      reader.onerror = () => {
        const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        resolve(`/${safeFolder}/${cleanName}`);
      };
      reader.readAsDataURL(file);
    });
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `/${safeFolder}/${cleanName}`;
}

export { clearConfig };
