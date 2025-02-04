/**
 * @fileoverview This module provides functionalities to load files and directories,
 * manage context data, and merge multiple contexts into a single string.
 * It handles file I/O operations and context management with error handling.
 */

import { join } from "@std/path";

/**
 * Represents the context of a file with its content and optional metadata.
 */
export type Context = {
  /**
   * The textual content of the file.
   */
  content: string;

  /**
   * Optional metadata associated with the file.
   */
  metadata?: Record<string, unknown>;
};

/**
 * Represents an error that occurs during file operations.
 */
type FileError = {
  /**
   * The error code identifying the type of error.
   */
  code: string;

  /**
   * A descriptive message providing details about the error.
   */
  message: string;
};

/**
 * Asynchronously loads the content of a file given its path.
 *
 * @param path - The filesystem path to the file to be loaded.
 * @returns A promise that resolves to the content of the file as a string.
 * @throws {FileError} Throws an error if the file cannot be read.
 */
export const loadFile = async (path: string): Promise<string> => {
  try {
    return await Deno.readTextFile(path);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : String(error);
    throw {
      code: "FILE_ERROR",
      message: `Failed to load file: ${message}`,
    } as FileError;
  }
};

/**
 * Asynchronously loads all files from a specified directory and returns their contexts.
 *
 * @param dir - The filesystem path to the directory to be loaded.
 * @returns A promise that resolves to an array of Context objects representing each file.
 */
export const loadDirectory = async (dir: string): Promise<Context[]> => {
  const contexts: Context[] = [];
  for await (const entry of Deno.readDir(dir)) {
    if (entry.isFile) {
      const content = await loadFile(join(dir, entry.name));
      contexts.push({
        content,
        metadata: { filename: entry.name },
      });
    }
  }
  return contexts;
};

/**
 * Merges multiple contexts into a single string, ensuring the total length
 * does not exceed the specified maximum number of tokens.
 *
 * @param contexts - An array of Context objects to be merged.
 * @param maxTokens - The maximum number of characters allowed in the merged string (default is 8000).
 * @returns A single string containing the merged content of all contexts.
 */
export const mergeContexts = (
  contexts: Context[],
  maxTokens = 8000
): string => {
  return contexts
    .map((ctx) => ctx.content)
    .join("\n\n")
    .slice(0, maxTokens);
};