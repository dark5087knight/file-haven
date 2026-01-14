/**
 * Central User Management Module
 * 
 * This is the ONLY place where user data is managed.
 * All user information (username, password, role) is stored in data/users.json
 * Passwords are stored as plain text (not hashed).
 */

import path from "path";
import fs from "fs/promises";

// Central user database file - this is the single source of truth
const USERS_DB = path.join(process.cwd(), "data", "users.json");

export type UserRecord = {
  username: string;
  password: string; // Plain text password
  role: string;
};

export type UsersDatabase = Record<string, UserRecord>;

/**
 * Read all users from the central user database
 */
export async function readUsers(): Promise<UsersDatabase> {
  try {
    const content = await fs.readFile(USERS_DB, "utf8");
    return JSON.parse(content) as UsersDatabase;
  } catch (err) {
    // If file doesn't exist, return empty object
    return {};
  }
}

/**
 * Write users to the central user database
 */
export async function writeUsers(users: UsersDatabase): Promise<void> {
  await fs.mkdir(path.dirname(USERS_DB), { recursive: true });
  await fs.writeFile(USERS_DB, JSON.stringify(users, null, 2), "utf8");
}

/**
 * Get a single user by username
 */
export async function getUser(username: string): Promise<UserRecord | null> {
  const users = await readUsers();
  return users[username] || null;
}

/**
 * Get user role by username
 */
export async function getUserRole(username: string): Promise<string | undefined> {
  const user = await getUser(username);
  return user?.role;
}

/**
 * Verify user password (plain text comparison)
 */
export async function verifyPassword(username: string, password: string): Promise<boolean> {
  const user = await getUser(username);
  if (!user) {
    return false;
  }
  // Plain text password comparison
  return user.password === password;
}

/**
 * Add a new user
 */
export async function addUser(username: string, password: string, role: string): Promise<void> {
  const users = await readUsers();
  if (users[username]) {
    throw new Error(`User ${username} already exists`);
  }
  users[username] = {
    username,
    password, // Plain text
    role,
  };
  await writeUsers(users);
}

/**
 * Update an existing user
 */
export async function updateUser(username: string, updates: Partial<Omit<UserRecord, "username">>): Promise<void> {
  const users = await readUsers();
  if (!users[username]) {
    throw new Error(`User ${username} does not exist`);
  }
  users[username] = {
    ...users[username],
    ...updates,
    username, // Ensure username cannot be changed
  };
  await writeUsers(users);
}

/**
 * Delete a user
 */
export async function deleteUser(username: string): Promise<void> {
  const users = await readUsers();
  if (!users[username]) {
    throw new Error(`User ${username} does not exist`);
  }
  delete users[username];
  await writeUsers(users);
}

/**
 * List all users (returns usernames only, without passwords)
 */
export async function listUsers(): Promise<Array<{ username: string; role: string }>> {
  const users = await readUsers();
  return Object.values(users).map(({ username, role }) => ({ username, role }));
}

/**
 * Initialize the user database with default root user if it doesn't exist
 */
export async function initUserDB(): Promise<void> {
  const users = await readUsers();
  const rootUser = "root";
  const rootPassword = "writeline@333";
  
  if (!users[rootUser]) {
    users[rootUser] = {
      username: rootUser,
      password: rootPassword, // Plain text
      role: "root",
    };
    await writeUsers(users);
    console.log(`[AUTH] Created initial user ${rootUser} in ${USERS_DB}`);
  }
}
