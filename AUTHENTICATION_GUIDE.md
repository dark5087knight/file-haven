# Authentication Implementation Guide

## Overview
File-Haven now includes a complete authentication system with session management, cookies, and persistent user sessions. Users must log in with system credentials from `/etc/passwd` and `/etc/shadow` before accessing the file manager.

## Features Implemented

### 1. **Authentication Window (Login Page)**
- **Location**: `src/pages/Login.tsx`
- Beautiful, responsive login page with gradient background
- Username and password input fields
- Form validation (disabled submit button if fields are empty)
- Loading state during authentication
- Error notifications using toast messages
- Icons for better UX (user and lock icons)

### 2. **System User Authentication**
- **Backend**: `server.ts` - `verifyPassword()` function
- Authenticates against Linux system users from `/etc/passwd`
- Validates passwords against `/etc/shadow` using the `su` command
- Supports system users with uid >= 1000 and root (uid 0)
- Secure password verification with 5-second timeout
- Graceful fallback if shadow file is not accessible

### 3. **Session Management**
- **Session Storage**: In-memory sessions (can be replaced with database for production)
- **Session Duration**: 24 hours
- **Session ID**: Cryptographically secure random 32-byte hex strings
- **Session Validation**: Automatic expiration checking on each request

### 4. **Cookie Management**
- **Cookie Name**: `sessionId`
- **Cookie Settings**:
  - `httpOnly`: true (prevents JavaScript access)
  - `sameSite`: 'lax' (CSRF protection)
  - `maxAge`: 24 hours
  - `secure`: false (set to true in production with HTTPS)
- **Cookie Parser**: Middleware integrated using `cookie-parser` package

### 5. **Protected Routes & API Endpoints**
All file system operations are protected with `requireAuth` middleware:

**Protected Endpoints**:
- `GET /api/list` - List directory contents
- `GET /api/tree` - Build directory tree
- `GET /api/preview` - Preview file contents
- `GET /api/download` - Download files
- `DELETE /api/item` - Delete files/directories

**Public Endpoints** (no authentication required):
- `GET /api/roots` - Get available root directories
- `POST /api/auth/login` - User login
- `GET /api/auth/check` - Check authentication status
- `POST /api/auth/logout` - User logout

### 6. **Persistent User Sessions**
- **Technology**: localStorage API
- **Session Persistence**: User session persists across page reloads
- **Automatic Redirect**: On page reload, the authentication status is automatically checked
- **Stored Data**:
  - `fileExplorer_currentPath`: Last directory the user was viewing
  - `fileExplorer_currentRootId`: Last root directory selected

### 7. **Client-Side Authentication Flow**
- **App.tsx**: Central authentication check on app load
- **Protected Routes**: Routes wrapped with `ProtectedRoute` component
- **Auth Context**: (Optional) Prepared for sharing auth state across components
- **Loading State**: Shows spinner while checking authentication

### 8. **Logout Functionality**
- **Location**: File Manager header (top-right corner)
- **Button**: "Logout" button with LogOut icon
- **Action**: 
  - Clears server-side session
  - Clears sessionId cookie
  - Clears localStorage
  - Redirects to login page
  - Shows success toast notification

## API Endpoints

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}

Response:
{
  "success": true,
  "username": "string"
}
```

### Check Authentication
```
GET /api/auth/check
Credentials: include

Response:
{
  "authenticated": true,
  "username": "string"
}
```

### Logout
```
POST /api/auth/logout
Credentials: include

Response:
{
  "success": true
}
```

## Files Modified

### Backend Changes
- **server.ts**:
  - Added `cookie-parser` middleware
  - Added `spawn` from `child_process` for password verification
  - Added session storage and management
  - Added `verifyPassword()` function with `su` command verification
  - Added `createSession()` function
  - Added `validateSession()` function
  - Added `requireAuth` middleware
  - Added `/api/auth/login` endpoint
  - Added `/api/auth/logout` endpoint
  - Added `/api/auth/check` endpoint
  - Protected all file system endpoints with `requireAuth`

### Frontend Changes
- **src/App.tsx**:
  - Added authentication state management
  - Added auth check on app mount
  - Added loading state while checking auth
  - Added route protection with conditional rendering
  - Added login/redirect logic

- **src/pages/Login.tsx**:
  - Fully implemented login form
  - API integration with credentials: 'include'
  - Form validation
  - Loading and error states
  - Beautiful UI with icons and gradient background

- **src/lib/api.ts**:
  - Added `credentials: 'include'` to all fetch calls
  - Added `logout()` function

- **src/hooks/use-file-explorer.ts**:
  - Added localStorage persistence for current path
  - Added localStorage persistence for current root ID
  - Automatic restoration of last visited directory

- **src/components/file-explorer/FileExplorer.tsx**:
  - Added logout button to header
  - Added logout handler
  - Integrated logout with navigation to login page

- **package.json**:
  - `cookie-parser` already included in dependencies

## Security Considerations

### Current Implementation
1. **Password Verification**: Uses system `su` command with 5-second timeout
2. **Session IDs**: Cryptographically random 32-byte hex strings
3. **HTTP-Only Cookies**: Prevents XSS attacks from accessing session tokens
4. **SameSite Cookies**: Prevents CSRF attacks
5. **Session Expiration**: 24-hour expiration with automatic cleanup
6. **Path Validation**: Prevents directory traversal attacks

### Production Recommendations
1. Set `secure: true` in cookie settings when using HTTPS
2. Replace in-memory session storage with a database
3. Implement session rotation after login
4. Add rate limiting to login endpoint
5. Log authentication attempts
6. Use HTTPS exclusively
7. Implement session timeout warnings
8. Add two-factor authentication option
9. Set stricter CORS policies
10. Implement account lockout after failed attempts

## How to Use

### For Users
1. Navigate to the application
2. Enter your system username and password
3. Click "Login" button
4. After successful login, you'll be redirected to the file manager
5. You can navigate freely, and your current location will be saved
6. On page reload, you'll stay in the same directory
7. Click "Logout" button in the top-right to log out

### For Developers
1. All API calls now require authentication except `/api/auth/*` and `/api/roots`
2. Use `credentials: 'include'` in fetch calls to send cookies
3. Check authentication status with `GET /api/auth/check`
4. Implement logout with `POST /api/auth/logout`
5. Session data is available via `req.cookies.sessionId` in Express handlers

## Testing

### Test Credentials
Use any valid system user from your `/etc/passwd` file with their actual password:
```
username: root (or any other system user)
password: [actual password for that user]
```

### Manual Testing Steps
1. Open the application - should redirect to login
2. Try wrong password - should show error
3. Login with correct credentials - should redirect to file manager
4. Reload page - should stay logged in and remember last directory
5. Click logout - should redirect to login page
6. Try accessing `/api/list` directly - should return 401 Unauthorized

## Environment Variables

Optional configuration via environment variables:
```
PORT=3000              # Server port (default: 3000)
MAX_TREE_DEPTH=3       # Max directory tree depth (default: 3)
PREVIEW_MAX_BYTES=65536 # Max preview file size (default: 64KB)
SESSION_SECRET=...     # Session secret for signing (default: 'your-secret-key')
ROOT_DIR=.            # Default root directory (default: '.')
```

## Future Enhancements
- [ ] Database-backed sessions
- [ ] Remember me functionality
- [ ] Social media authentication
- [ ] Two-factor authentication
- [ ] Session timeout warnings
- [ ] User activity logging
- [ ] Admin dashboard
- [ ] Permission management per user
- [ ] Rate limiting
- [ ] Account lockout mechanism
