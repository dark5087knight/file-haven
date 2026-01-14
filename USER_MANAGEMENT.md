# Central User Management

## Overview

All user management is centralized in a single location. User data (username, password, role) is stored in **`data/users.json`** with **plain text passwords** (not hashed).

## User Database Location

**File**: `data/users.json`

This is the **ONLY** file where user information is stored.

## User Data Structure

Each user has the following structure:

```json
{
  "username": {
    "username": "string",
    "password": "string",  // Plain text (not hashed)
    "role": "string"
  }
}
```

### Example

```json
{
  "root": {
    "username": "root",
    "password": "writeline@333",
    "role": "root"
  },
  "admin": {
    "username": "admin",
    "password": "admin123",
    "role": "admin"
  },
  "user1": {
    "username": "user1",
    "password": "password123",
    "role": "user"
  }
}
```

## Central User Management Module

**File**: `src/server/users.ts`

This module provides all user management functions:

- `readUsers()` - Read all users from the database
- `writeUsers(users)` - Write users to the database
- `getUser(username)` - Get a single user
- `getUserRole(username)` - Get user's role
- `verifyPassword(username, password)` - Verify user password (plain text comparison)
- `addUser(username, password, role)` - Add a new user
- `updateUser(username, updates)` - Update an existing user
- `deleteUser(username)` - Delete a user
- `listUsers()` - List all users (without passwords)
- `initUserDB()` - Initialize database with default root user

## Adding a New User

### Method 1: Edit `data/users.json` directly

```json
{
  "root": {
    "username": "root",
    "password": "writeline@333",
    "role": "root"
  },
  "newuser": {
    "username": "newuser",
    "password": "mypassword",
    "role": "user"
  }
}
```

### Method 2: Use the user management module (programmatically)

```typescript
import * as userManager from "./src/server/users";

// Add a new user
await userManager.addUser("newuser", "mypassword", "user");
```

## Updating a User

### Edit `data/users.json` directly:

```json
{
  "root": {
    "username": "root",
    "password": "newpassword",  // Changed password
    "role": "root"
  }
}
```

Or programmatically:

```typescript
// Update password
await userManager.updateUser("root", { password: "newpassword" });

// Update role
await userManager.updateUser("root", { role: "admin" });
```

## Deleting a User

Remove the user entry from `data/users.json`:

```json
{
  "root": {
    "username": "root",
    "password": "writeline@333",
    "role": "root"
  }
  // "deleteduser" entry removed
}
```

Or programmatically:

```typescript
await userManager.deleteUser("deleteduser");
```

## Default User

The system automatically creates a default root user on first startup:

- **Username**: `root`
- **Password**: `writeline@333`
- **Role**: `root`

## Important Notes

⚠️ **Security Warning**: Passwords are stored as **plain text**. This is intentional for this implementation, but:
- Do NOT use this in production without additional security measures
- Keep `data/users.json` secure and restrict file permissions
- Consider using environment variables or a secure vault for production

## File Permissions

It's recommended to restrict access to `data/users.json`:

```bash
chmod 600 data/users.json  # Only owner can read/write
```

## Roles

Common roles:
- `root` - Full access, can access "/" path, can delete files
- `admin` - Administrative access
- `user` - Regular user access

Role-based access control is implemented in `server.ts` middleware.
