/**
 * File system utilities
 */

import fs from "fs";
import path from "path";

/**
 * Check if a file exists
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * Get all files in a directory recursively
 */
export function getAllFiles(dirPath: string): string[] {
  let files: string[] = [];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }
  } catch (error) {
    throw new Error(`Failed to read directory: ${error}`);
  }

  return files;
}

/**
 * Get the size of a directory in bytes
 */
export function getDirectorySize(dirPath: string): number {
  let size = 0;

  try {
    const files = getAllFiles(dirPath);
    for (const file of files) {
      const stats = fs.statSync(file);
      size += stats.size;
    }
  } catch (error) {
    throw new Error(`Failed to calculate directory size: ${error}`);
  }

  return size;
}
