import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs/promises";
import * as crypto from "crypto";
import cookieParser from "cookie-parser";
import multer from "multer";
import * as userManager from "./src/server/users.js";

const PORT = Number(process.env.PORT || 3000);
const MAX_TREE_DEPTH = Number(process.env.MAX_TREE_DEPTH || 3);
const PREVIEW_MAX_BYTES = Number(process.env.PREVIEW_MAX_BYTES || 64 * 1024); // 64KB cap
const SESSION_SECRET = process.env.SESSION_SECRET || "your-secret-key";

// Session storage (in-memory, replace with database for production)
const sessions: Record<string, { username: string; expiresAt: number }> = {};

// Load roots configuration
interface RootConfig {
  id: string;
  name?: string;
  path: string;
}

interface PathsConfig {
  systemPaths?: Array<RootConfig>;
  userPaths?: Array<{ id: string; path: string }>;
  roots?: Array<RootConfig>; // Legacy support
}

let pathsConfig: PathsConfig = { systemPaths: [], userPaths: [] };
try {
  const configPath = path.join(process.cwd(), "roots.json");
  const configContent = await fs.readFile(configPath, "utf8");
  pathsConfig = JSON.parse(configContent);
} catch (err) {
  console.warn("Could not load roots.json, using default root");
  pathsConfig = { systemPaths: [{ id: "default", name: "Root", path: process.env.ROOT_DIR || "." }], userPaths: [] };
}

// Helper function to extract endpoint directory name from path
function getEndpointName(fullPath: string): string {
  const normalized = fullPath.replace(/\/$/, ""); // Remove trailing slash
  const parts = normalized.split("/").filter(p => p !== "");
  return parts[parts.length - 1] || "root";
}

// Helper function to check if a path exists
async function pathExists(resolvedPath: string): Promise<boolean> {
  try {
    await fs.access(resolvedPath);
    const stat = await fs.stat(resolvedPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

// Process system paths (will be initialized with existence check)
let systemPaths: Array<{
  id: string;
  name: string;
  path: string;
  resolvedPath: string;
  type: "system";
  exists: boolean;
}> = [];

// Process user paths (will be initialized with existence check)
let userPaths: Array<{
  id: string;
  name: string;
  path: string;
  resolvedPath: string;
  type: "user";
  exists: boolean;
}> = [];

// Legacy support: if old format with "roots" array exists
let legacyRoots: Array<{
  id: string;
  name: string;
  path: string;
  resolvedPath: string;
  type: "system";
  exists: boolean;
}> = [];

// Combine all roots (system paths + user paths + legacy)
let allRoots: Array<{
  id: string;
  name: string;
  path: string;
  resolvedPath: string;
  type: "system" | "user";
  exists: boolean;
}> = [];

// Initialize paths with existence check
async function initializePaths() {
  // Process system paths
  systemPaths = await Promise.all(
    (pathsConfig.systemPaths || []).map(async (r) => {
      const resolvedPath = path.resolve(r.path);
      const exists = await pathExists(resolvedPath);
      return {
        id: r.id,
        name: r.name || getEndpointName(r.path),
        path: r.path,
        resolvedPath,
        type: "system" as const,
        exists,
      };
    })
  );

  // Process user paths
  userPaths = await Promise.all(
    (pathsConfig.userPaths || []).map(async (r) => {
      const resolvedPath = path.resolve(r.path);
      const exists = await pathExists(resolvedPath);
      return {
        id: r.id,
        name: getEndpointName(r.path),
        path: r.path,
        resolvedPath,
        type: "user" as const,
        exists,
      };
    })
  );

  // Legacy support
  legacyRoots = await Promise.all(
    (pathsConfig.roots || []).map(async (r) => {
      const resolvedPath = path.resolve(r.path);
      const exists = await pathExists(resolvedPath);
      return {
        id: r.id,
        name: r.name || getEndpointName(r.path),
        path: r.path,
        resolvedPath,
        type: "system" as const,
        exists,
      };
    })
  );

  allRoots = [...systemPaths, ...userPaths, ...legacyRoots];
}

// Function to reload paths configuration
async function reloadPathsConfig() {
  try {
    const configPath = path.join(process.cwd(), "roots.json");
    const configContent = await fs.readFile(configPath, "utf8");
    pathsConfig = JSON.parse(configContent);
    
    // Reprocess paths with existence check
    systemPaths = await Promise.all(
      (pathsConfig.systemPaths || []).map(async (r) => {
        const resolvedPath = path.resolve(r.path);
        const exists = await pathExists(resolvedPath);
        return {
          id: r.id,
          name: r.name || getEndpointName(r.path),
          path: r.path,
          resolvedPath,
          type: "system" as const,
          exists,
        };
      })
    );
    
    userPaths = await Promise.all(
      (pathsConfig.userPaths || []).map(async (r) => {
        const resolvedPath = path.resolve(r.path);
        const exists = await pathExists(resolvedPath);
        return {
          id: r.id,
          name: getEndpointName(r.path),
          path: r.path,
          resolvedPath,
          type: "user" as const,
          exists,
        };
      })
    );
    
    legacyRoots = await Promise.all(
      (pathsConfig.roots || []).map(async (r) => {
        const resolvedPath = path.resolve(r.path);
        const exists = await pathExists(resolvedPath);
        return {
          id: r.id,
          name: r.name || getEndpointName(r.path),
          path: r.path,
          resolvedPath,
          type: "system" as const,
          exists,
        };
      })
    );
    
    allRoots = [...systemPaths, ...userPaths, ...legacyRoots];
    
    console.log(`[PATHS] Reloaded paths configuration`);
    console.log(`System paths: ${systemPaths.map((r) => `${r.name} (${r.path})${r.exists ? "" : " [NOT FOUND]"}`).join(", ") || "none"}`);
    console.log(`User paths: ${userPaths.map((r) => `${r.name} (${r.path})${r.exists ? "" : " [NOT FOUND]"}`).join(", ") || "none"}`);
  } catch (err) {
    console.error(`[PATHS] Error reloading paths configuration: ${(err as Error).message}`);
    throw err;
  }
}

function getRoot(rootId?: string) {
  const root = allRoots.find((r) => r.id === rootId) || allRoots[0];
  if (!root) throw new Error("No root configured");
  return root;
}

// Get available roots for a user based on their role (only existing paths)
async function getAvailableRoots(username?: string): Promise<Array<{ id: string; name: string; path: string }>> {
  if (!username) {
    // Not authenticated - return empty or user paths only (only existing ones)
    return userPaths.filter((r) => r.exists).map((r) => ({ id: r.id, name: r.name, path: r.path }));
  }
  
  const role = await getUserRole(username);
  if (role === "root") {
    // Root users can see all paths (only existing ones)
    return allRoots.filter((r) => r.exists).map((r) => ({ id: r.id, name: r.name, path: r.path }));
  } else {
    // Regular users can only see user paths (only existing ones)
    return userPaths.filter((r) => r.exists).map((r) => ({ id: r.id, name: r.name, path: r.path }));
  }
}

// Check if user has access to a specific root
async function hasAccessToRoot(username: string, rootId?: string): Promise<boolean> {
  const role = await getUserRole(username);
  if (role === "root") {
    return true; // Root users have access to all roots
  }
  
  // For regular users, check if the root is in userPaths
  if (!rootId) {
    return false; // No root specified
  }
  
  const root = allRoots.find((r) => r.id === rootId);
  if (!root) {
    return false; // Root not found
  }
  
  return root.type === "user"; // Only user paths are accessible
}

// Authentication functions - using central user management module
// All user data comes from data/users.json with plain text passwords

async function verifyPassword(username: string, password: string): Promise<boolean> {
  try {
    const ok = await userManager.verifyPassword(username, password);
    if (ok) {
      console.log(`[AUTH] Password verified for ${username} via central user DB`);
    } else {
      console.log(`[AUTH] Password verification failed for ${username}`);
    }
    return ok;
  } catch (err) {
    console.error(`[AUTH] Error verifying password: ${(err as Error).message}`);
    return false;
  }
}

async function getUserRole(username: string): Promise<string | undefined> {
  try {
    return await userManager.getUserRole(username);
  } catch (err) {
    console.error(`[AUTH] Error getting user role: ${(err as Error).message}`);
    return undefined;
  }
}

function createSession(username: string): string {
  const sessionId = crypto.randomBytes(32).toString("hex");
  sessions[sessionId] = {
    username,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  return sessionId;
}

function validateSession(sessionId: string): string | null {
  const session = sessions[sessionId];
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    delete sessions[sessionId];
    return null;
  }
  return session.username;
}

// Middleware to check authentication
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const sessionId = req.cookies.sessionId;
  const username = validateSession(sessionId);
  
  if (!username) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  (req as any).username = username;
  next();
}

// Middleware to check if user is root
async function requireRoot(req: express.Request, res: express.Response, next: express.NextFunction) {
  const sessionId = req.cookies.sessionId;
  const username = validateSession(sessionId);
  
  if (!username) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const role = await getUserRole(username);
  if (role !== "root") {
    return res.status(403).json({ error: "Forbidden: Root access required" });
  }
  
  (req as any).username = username;
  next();
}

// Middleware to check if user is root or admin
async function requireRootOrAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const sessionId = req.cookies.sessionId;
  const username = validateSession(sessionId);
  
  if (!username) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const role = await getUserRole(username);
  if (role !== "root" && role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Root or Admin access required" });
  }
  
  (req as any).username = username;
  next();
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Configure multer for file uploads (memory storage for temporary files)
const storage = multer.memoryStorage();
const upload = multer({ storage });

function resolveSafe(requestPath: string, rootId?: string) {
  const root = getRoot(rootId);
  const normalized = requestPath === "" ? "/" : requestPath;
  const target = path.resolve(root.resolvedPath, "." + normalized);
  if (!target.startsWith(root.resolvedPath)) {
    throw new Error("Forbidden path");
  }
  return { fullPath: target, root };
}

function toFileItem(entryPath: string, rootPath: string, stat: Awaited<ReturnType<typeof fs.stat>>) {
  const name = path.basename(entryPath);
  const relPath = "/" + path.relative(rootPath, entryPath).split(path.sep).join("/");
  const isDirectory = stat.isDirectory();
  const ext = isDirectory ? null : (name.includes(".") ? name.split(".").pop() ?? null : null);
  return {
    name,
    path: relPath === "" ? "/" : relPath.startsWith("/") ? relPath : `/${relPath}`,
    isDirectory,
    size: stat.size,
    modified: stat.mtime.toISOString(),
    created: stat.ctime.toISOString(),
    extension: ext,
    permissions: (Number(stat.mode) & 0o777).toString(8),
  };
}

async function listDirectory(requestPath: string, rootId?: string) {
  const { fullPath, root } = resolveSafe(requestPath, rootId);
  const entries = await fs.readdir(fullPath, { withFileTypes: true });
  const items = await Promise.all(
    entries.map(async (entry) => {
      const entryFull = path.join(fullPath, entry.name);
      const stat = await fs.stat(entryFull);
      return toFileItem(entryFull, root.resolvedPath, stat);
    }),
  );
  return { items, total: items.length };
}

async function buildTree(requestPath: string, depth: number, rootId?: string): Promise<any[]> {
  if (depth < 0) return [];
  const { fullPath } = resolveSafe(requestPath, rootId);
  const entries = await fs.readdir(fullPath, { withFileTypes: true });
  const children = await Promise.all(
    entries
      .filter((e) => e.isDirectory())
      .map(async (entry) => {
        const childPath = path.posix.join(requestPath === "/" ? "" : requestPath, entry.name);
        return {
          name: entry.name,
          path: childPath.startsWith("/") ? childPath : `/${childPath}`,
          children: depth > 0 ? await buildTree(childPath, depth - 1, rootId) : undefined,
        };
      }),
  );
  return children;
}

async function getPreview(requestPath: string, rootId?: string) {
  const { fullPath } = resolveSafe(requestPath, rootId);
  const stat = await fs.stat(fullPath);
  if (stat.isDirectory()) {
    return { path: requestPath, type: "unsupported", size: stat.size };
  }

  const ext = path.extname(fullPath).replace(".", "").toLowerCase();
  const size = stat.size;
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
    return { path: requestPath, type: "image", size, mimeType: `image/${ext === "jpg" ? "jpeg" : ext}` };
  }

  if (size > PREVIEW_MAX_BYTES) {
    return { path: requestPath, type: "unsupported", size };
  }

  const content = await fs.readFile(fullPath, "utf8");
  if (ext === "json") {
    return { path: requestPath, type: "json", content, size };
  }
  return { path: requestPath, type: "text", content, size };
}

// Get available roots (filtered based on user role)
// Re-check path existence on each request to ensure accuracy
app.get("/api/roots", async (req, res) => {
  try {
    // Re-check path existence for all paths
    systemPaths = await Promise.all(
      systemPaths.map(async (r) => {
        const exists = await pathExists(r.resolvedPath);
        return { ...r, exists };
      })
    );
    
    userPaths = await Promise.all(
      userPaths.map(async (r) => {
        const exists = await pathExists(r.resolvedPath);
        return { ...r, exists };
      })
    );
    
    legacyRoots = await Promise.all(
      legacyRoots.map(async (r) => {
        const exists = await pathExists(r.resolvedPath);
        return { ...r, exists };
      })
    );
    
    allRoots = [...systemPaths, ...userPaths, ...legacyRoots];
    
    const sessionId = req.cookies.sessionId;
    const username = validateSession(sessionId);
    const availableRoots = await getAvailableRoots(username || undefined);
    res.json(availableRoots);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Authentication endpoints
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }
    
    // Verify password against system user
    const isValid = await verifyPassword(username, password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Create session
    const sessionId = createSession(username);
    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
    
    res.json({ success: true, username });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post("/api/auth/logout", (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (sessionId) {
    delete sessions[sessionId];
  }
  res.clearCookie("sessionId");
  res.json({ success: true });
});

app.get("/api/auth/check", async (req, res) => {
  const sessionId = req.cookies.sessionId;
  const username = validateSession(sessionId);
  
  if (!username) {
    return res.status(401).json({ authenticated: false });
  }
  
  const role = await getUserRole(username);
  res.json({ authenticated: true, username, role: role || undefined });
});

app.get("/api/list", requireAuth, async (req, res) => {
  try {
    const requestPath = (req.query.path as string) || "/";
    const rootId = req.query.rootId as string | undefined;
    const username = (req as any).username;
    
    // Check if user has access to this root
    const hasAccess = await hasAccessToRoot(username, rootId);
    if (!hasAccess) {
      return res.status(403).json({ error: "Forbidden: You don't have access to this path" });
    }
    
    // Only root users can access "/" path in system roots
    // Regular users can access "/" in their user paths
    if (requestPath === "/") {
      const role = await getUserRole(username);
      if (role !== "root") {
        // Check if this is a user path - if so, allow access
        const root = allRoots.find((r) => r.id === rootId);
        if (!root || root.type !== "user") {
          return res.status(403).json({ error: "Forbidden: Root access required to view root path" });
        }
        // It's a user path, so allow access to "/"
      }
    }
    
    const data = await listDirectory(requestPath, rootId);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.get("/api/tree", requireAuth, async (req, res) => {
  try {
    const requestPath = (req.query.path as string) || "/";
    const rootId = req.query.rootId as string | undefined;
    const username = (req as any).username;
    
    // Check if user has access to this root
    const hasAccess = await hasAccessToRoot(username, rootId);
    if (!hasAccess) {
      return res.status(403).json({ error: "Forbidden: You don't have access to this path" });
    }
    
    // Only root users can access "/" path in system roots
    // Regular users can access "/" in their user paths
    if (requestPath === "/") {
      const role = await getUserRole(username);
      if (role !== "root") {
        // Check if this is a user path - if so, allow access
        const root = allRoots.find((r) => r.id === rootId);
        if (!root || root.type !== "user") {
          return res.status(403).json({ error: "Forbidden: Root access required to view root path" });
        }
        // It's a user path, so allow access to "/"
      }
    }
    
    const root = getRoot(rootId);
    const children = await buildTree(requestPath, MAX_TREE_DEPTH, rootId);
    res.json([{ name: root.name, path: "/", children }]);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.get("/api/preview", requireAuth, async (req, res) => {
  try {
    const requestPath = (req.query.path as string) || "/";
    const rootId = req.query.rootId as string | undefined;
    const username = (req as any).username;
    
    // Check if user has access to this root
    const hasAccess = await hasAccessToRoot(username, rootId);
    if (!hasAccess) {
      return res.status(403).json({ error: "Forbidden: You don't have access to this path" });
    }
    
    // Only root users can access "/" path in system roots
    // Regular users can access "/" in their user paths (though previewing a directory isn't useful)
    if (requestPath === "/") {
      const role = await getUserRole(username);
      if (role !== "root") {
        // Check if this is a user path - if so, allow access
        const root = allRoots.find((r) => r.id === rootId);
        if (!root || root.type !== "user") {
          return res.status(403).json({ error: "Forbidden: Root access required to view root path" });
        }
        // It's a user path, so allow access to "/"
      }
    }
    
    const preview = await getPreview(requestPath, rootId);
    res.json(preview);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.get("/api/download", requireAuth, async (req, res) => {
  try {
    const requestPath = (req.query.path as string) || "";
    const rootId = req.query.rootId as string | undefined;
    const username = (req as any).username;
    
    // Check if user has access to this root
    const hasAccess = await hasAccessToRoot(username, rootId);
    if (!hasAccess) {
      return res.status(403).json({ error: "Forbidden: You don't have access to this path" });
    }
    
    if (!requestPath) throw new Error("path is required");
    const { fullPath } = resolveSafe(requestPath, rootId);
    const stat = await fs.stat(fullPath);
    if (stat.isDirectory()) {
      throw new Error("Cannot download directories");
    }
    res.download(fullPath);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.post("/api/upload", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const requestPath = (req.body.path as string) || "/";
    const rootId = req.body.rootId as string | undefined;
    const filename = (req.body.filename as string) || req.file?.originalname;
    const username = (req as any).username;
    
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    if (!filename) {
      return res.status(400).json({ error: "Filename is required" });
    }
    
    // Check if user has access to this root
    const hasAccess = await hasAccessToRoot(username, rootId);
    if (!hasAccess) {
      return res.status(403).json({ error: "Forbidden: You don't have access to this path" });
    }
    
    // Resolve the target directory
    const { fullPath } = resolveSafe(requestPath, rootId);
    
    // Check if target is a directory
    const stat = await fs.stat(fullPath);
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: "Target path must be a directory" });
    }
    
    // Check if file already exists
    const targetPath = path.join(fullPath, filename);
    try {
      await fs.access(targetPath);
      // File exists
      return res.status(400).json({ error: `File "${filename}" already exists in this directory` });
    } catch (err) {
      // File doesn't exist, which is what we want - continue with upload
    }
    
    // Write file to target directory
    await fs.writeFile(targetPath, req.file.buffer);
    
    res.json({ success: true, message: `File ${filename} uploaded successfully` });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.post("/api/directory", requireAuth, async (req, res) => {
  try {
    const requestPath = (req.body.path as string) || "/";
    const rootId = req.body.rootId as string | undefined;
    const directoryName = req.body.name as string;
    const username = (req as any).username;
    
    if (!directoryName || directoryName.trim() === "") {
      return res.status(400).json({ error: "Directory name is required" });
    }
    
    // Check if user has access to this root
    const hasAccess = await hasAccessToRoot(username, rootId);
    if (!hasAccess) {
      return res.status(403).json({ error: "Forbidden: You don't have access to this path" });
    }
    
    // Resolve the target directory
    const { fullPath } = resolveSafe(requestPath, rootId);
    
    // Check if target is a directory
    const stat = await fs.stat(fullPath);
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: "Target path must be a directory" });
    }
    
    // Check if directory already exists
    const targetPath = path.join(fullPath, directoryName.trim());
    try {
      await fs.access(targetPath);
      // Directory exists
      return res.status(400).json({ error: `Directory "${directoryName.trim()}" already exists in this location` });
    } catch (err) {
      // Directory doesn't exist, which is what we want - continue with creation
    }
    
    // Create directory
    await fs.mkdir(targetPath, { recursive: false });
    
    res.json({ success: true, message: `Directory "${directoryName.trim()}" created successfully` });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.delete("/api/item", requireRoot, async (req, res) => {
  try {
    const requestPath = (req.query.path as string) || "";
    const rootId = req.query.rootId as string | undefined;
    if (!requestPath) throw new Error("path is required");
    const { fullPath } = resolveSafe(requestPath, rootId);
    await fs.rm(fullPath, { recursive: true, force: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// User Management API - Only accessible to root users
app.get("/api/users", requireRoot, async (req, res) => {
  try {
    const users = await userManager.listUsers();
    res.json(users);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.get("/api/users/:username", requireRoot, async (req, res) => {
  try {
    const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
    const user = await userManager.getUser(username);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Return user with password for editing (only root can access this endpoint)
    res.json({ username: user.username, password: user.password, role: user.role });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.post("/api/users", requireRoot, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ error: "Username, password, and role are required" });
    }
    await userManager.addUser(username, password, role);
    res.json({ success: true, message: `User ${username} created successfully` });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.put("/api/users/:username", requireRoot, async (req, res) => {
  try {
    const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
    const { password, role } = req.body;
    const updates: any = {};
    if (password !== undefined) updates.password = password;
    if (role !== undefined) updates.role = role;
    await userManager.updateUser(username, updates);
    res.json({ success: true, message: `User ${username} updated successfully` });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.delete("/api/users/:username", requireRoot, async (req, res) => {
  try {
    const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
    const currentUsername = (req as any).username;
    // Prevent root from deleting themselves
    if (username === currentUsername) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }
    await userManager.deleteUser(username);
    res.json({ success: true, message: `User ${username} deleted successfully` });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// Paths Management API - Only accessible to root and admin users
app.get("/api/paths", requireRootOrAdmin, async (req, res) => {
  try {
    const paths = {
      systemPaths: systemPaths.map((p) => ({ id: p.id, name: p.name, path: p.path, exists: p.exists })),
      userPaths: userPaths.map((p) => ({ id: p.id, name: p.name, path: p.path, exists: p.exists })),
    };
    res.json(paths);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.post("/api/paths", requireRootOrAdmin, async (req, res) => {
  try {
    const { type, id, name, path: pathValue } = req.body;
    
    if (!type || !id || !pathValue) {
      return res.status(400).json({ error: "Type, id, and path are required" });
    }
    
    if (type !== "system" && type !== "user") {
      return res.status(400).json({ error: "Type must be 'system' or 'user'" });
    }
    
    // Check if id already exists
    if (allRoots.some((r) => r.id === id)) {
      return res.status(400).json({ error: `Path with id "${id}" already exists` });
    }
    
    // Read current config
    const configPath = path.join(process.cwd(), "roots.json");
    const configContent = await fs.readFile(configPath, "utf8");
    const config: PathsConfig = JSON.parse(configContent);
    
    // Add new path
    if (type === "system") {
      if (!config.systemPaths) config.systemPaths = [];
      config.systemPaths.push({ id, name: name || getEndpointName(pathValue), path: pathValue });
    } else {
      if (!config.userPaths) config.userPaths = [];
      config.userPaths.push({ id, path: pathValue });
    }
    
    // Write back to file
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf8");
    
    // Reload configuration
    await reloadPathsConfig();
    
    res.json({ success: true, message: `Path ${id} created successfully` });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.put("/api/paths/:id", requireRootOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, path: pathValue, type } = req.body;
    
    // Read current config
    const configPath = path.join(process.cwd(), "roots.json");
    const configContent = await fs.readFile(configPath, "utf8");
    const config: PathsConfig = JSON.parse(configContent);
    
    let found = false;
    
    // Update system path
    if (config.systemPaths) {
      const systemPath = config.systemPaths.find((p) => p.id === id);
      if (systemPath) {
        if (name !== undefined) systemPath.name = name;
        if (pathValue !== undefined) systemPath.path = pathValue;
        found = true;
      }
    }
    
    // Update user path
    if (!found && config.userPaths) {
      const userPath = config.userPaths.find((p) => p.id === id);
      if (userPath) {
        if (pathValue !== undefined) userPath.path = pathValue;
        found = true;
      }
    }
    
    if (!found) {
      return res.status(404).json({ error: "Path not found" });
    }
    
    // Write back to file
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf8");
    
    // Reload configuration
    await reloadPathsConfig();
    
    res.json({ success: true, message: `Path ${id} updated successfully` });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.delete("/api/paths/:id", requireRootOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting the system root
    if (id === "root") {
      return res.status(400).json({ error: "Cannot delete the system root path" });
    }
    
    // Read current config
    const configPath = path.join(process.cwd(), "roots.json");
    const configContent = await fs.readFile(configPath, "utf8");
    const config: PathsConfig = JSON.parse(configContent);
    
    let found = false;
    
    // Remove from system paths
    if (config.systemPaths) {
      const index = config.systemPaths.findIndex((p) => p.id === id);
      if (index !== -1) {
        config.systemPaths.splice(index, 1);
        found = true;
      }
    }
    
    // Remove from user paths
    if (!found && config.userPaths) {
      const index = config.userPaths.findIndex((p) => p.id === id);
      if (index !== -1) {
        config.userPaths.splice(index, 1);
        found = true;
      }
    }
    
    if (!found) {
      return res.status(404).json({ error: "Path not found" });
    }
    
    // Write back to file
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf8");
    
    // Reload configuration
    await reloadPathsConfig();
    
    res.json({ success: true, message: `Path ${id} deleted successfully` });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// Initialize user DB then start server
userManager.initUserDB().then(async () => {
  // Initialize paths with existence check
  await initializePaths();
  
  app.listen(PORT, () => {
    console.log(`File API running on http://localhost:${PORT}`);
    console.log(`System paths: ${systemPaths.map((r) => `${r.name} (${r.path})${r.exists ? "" : " [NOT FOUND]"}`).join(", ") || "none"}`);
    console.log(`User paths: ${userPaths.map((r) => `${r.name} (${r.path})${r.exists ? "" : " [NOT FOUND]"}`).join(", ") || "none"}`);
    console.log(`User database: data/users.json (plain text passwords)`);
  });
}).catch(err => {
  console.error("Failed to initialize users DB:", err);
  process.exit(1);
});

