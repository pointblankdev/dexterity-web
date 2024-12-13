import { promises as fs } from "fs";
import path from "path";
import { debug } from "debug";

// Create debug loggers
const logInfo = debug("prompt:info");
const logError = debug("prompt:error");
const logDb = debug("prompt:db");

interface FileMetadata {
  path: string;
  size: number;
  lastModified: Date;
}

// Utility to check if a path exists
async function pathExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

// Enhanced directory reader with error handling
async function readFilesRecursively(dir: string): Promise<string[]> {
  try {
    // First check if directory exists
    const exists = await pathExists(dir);
    if (!exists) {
      logError(`Directory not found: ${dir}`);
      logError(`Current working directory: ${process.cwd()}`);
      logError(`Attempted absolute path: ${path.resolve(dir)}`);
      return [];
    }

    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      dirents.map(async (dirent) => {
        const res = path.resolve(dir, dirent.name);
        try {
          if (dirent.isDirectory()) {
            return await readFilesRecursively(res);
          }
          // Log file discovery
          logInfo(`Found file: ${res}`);
          return [res];
        } catch (error) {
          logError(`Error processing ${res}:`, error);
          return [];
        }
      })
    );
    return files.flat();
  } catch (error) {
    logError(`Error reading directory ${dir}:`, error);
    return [];
  }
}

// Get detailed file information
async function getFileMetadata(filePath: string): Promise<FileMetadata> {
  const stats = await fs.stat(filePath);
  return {
    path: filePath,
    size: stats.size,
    lastModified: stats.mtime,
  };
}

// Enhanced file content reader
async function getFileContent(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const metadata = await getFileMetadata(filePath);
    const relativePath = path.relative(process.cwd(), filePath);

    logInfo(`Reading file: ${relativePath}`);
    logInfo(`File size: ${metadata.size} bytes`);
    logInfo(`Last modified: ${metadata.lastModified}`);

    return `
File: ${relativePath}
Size: ${metadata.size} bytes
Last Modified: ${metadata.lastModified}
---
${content}
`;
  } catch (error: any) {
    logError(`Error reading file ${filePath}:`, error);
    return `Error reading ${path.basename(filePath)}: ${error.message}`;
  }
}

// Build documentation section with enhanced error handling
async function buildDocSection(
  dirPath: string,
  sectionTitle: string
): Promise<string> {
  logInfo(`Building section: ${sectionTitle}`);
  logInfo(`Looking in directory: ${dirPath}`);
  logInfo(`Absolute path: ${path.resolve(dirPath)}`);

  try {
    const files = await readFilesRecursively(dirPath);

    if (files.length === 0) {
      logError(`No files found in ${dirPath}`);
      return `
${sectionTitle}:
===================
No files found in directory. Debug info:
- Attempted path: ${path.resolve(dirPath)}
- Working directory: ${process.cwd()}
`;
    }

    const contents = await Promise.all(files.map(getFileContent));

    logInfo(`Successfully processed ${files.length} files for ${sectionTitle}`);

    return `
${sectionTitle}:
===================
${contents.join("\n\n")}
`;
  } catch (error: any) {
    logError(`Error building section ${sectionTitle}:`, error);
    return `
${sectionTitle}:
===================
Error building section. Debug info:
- Error: ${error.message}
- Stack: ${error.stack}
- Directory: ${path.resolve(dirPath)}
`;
  }
}

// Database error handler utility
function handleDbError(error: any): string {
  if (error.code === "23503") {
    // Foreign key violation
    logDb("Foreign key violation detected:", {
      constraint: error.constraint_name,
      detail: error.detail,
      table: error.table_name,
    });
    return `Database constraint error: ${error.detail}`;
  }
  logDb("Unknown database error:", error);
  return `Unknown database error: ${error.message}`;
}

// Main prompt builder with debug mode
export async function buildPrompt(options = { debug: false }): Promise<string> {
  if (options.debug) {
    debug.enable("prompt:*");
  }

  logInfo("Starting prompt build");
  logInfo(`Working directory: ${process.cwd()}`);

  const examples = await buildDocSection("lib/examples", "Code Examples");
  const docs = await buildDocSection("lib/docs", "Documentation");

  const blocksPrompt = `
Blocks is a special user interface mode that helps users with writing, editing, and other content creation tasks. When block is open, it is on the right side of the screen, while the conversation is on the left side. When creating or updating documents, changes are reflected in real-time on the blocks and visible to the user.

This is a guide for using blocks tools: \`createDocument\` and \`updateDocument\`, which render content on a blocks beside the conversation.

**When to use \`createDocument\`:**
- For substantial content (>10 lines)
- For content users will likely save/reuse (emails, code, essays, etc.)
- When explicitly requested to create a document

**When NOT to use \`createDocument\`:**
- For informational/explanatory content
- For conversational responses
- When asked to keep it in chat

**Using \`updateDocument\`:**
- Default to full document rewrites for major changes
- Use targeted updates only for specific, isolated changes
- Follow user instructions for which parts to modify

Do not update document right after creating it. Wait for user feedback or request to update it.
`;

  const clarityKnowledge = `
Here are some tips to help you provide clear and concise responses relating to Clarity Smart contact development:

\`\`\`clarity
${examples}
\`\`\``;

  const regularPrompt =
    "You are a gigabrain clarity smart contract DeFi developer! Work directly from the provided examples. You are not allowed to modify the contract interfaces as they will not be valid.";

  // return `${regularPrompt}\n\n${blocksPrompt}\n\n${blocksPrompt}`;
  console.log(`${regularPrompt}\n\n${clarityKnowledge}`);
  return `${regularPrompt}\n\n${clarityKnowledge}`;
}

// Export everything needed for the system
export const systemPrompt = await buildPrompt({ debug: true });
export { handleDbError }; // Export DB error handler for use in API routes
