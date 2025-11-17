import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { error } from "../../config.js";

export const saveIcsFile = (data: string, path: string): void => {
  try {
    const dirPath: string = dirname(path);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath);
    }

    writeFileSync(path, data);
  } catch (_error) {
    error(`save-ics-file: Failed to save data to path: '${path}':`, _error);
  }
};
