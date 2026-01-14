# File-Haven Authentication - Quick Start Guide

## What's New?

Your File-Haven application now has complete authentication! Users must log in with their system credentials before accessing the file manager.

## 🎯 Quick Features

✅ **Login Page** - Beautiful, secure login form  
✅ **System User Auth** - Uses /etc/passwd and /etc/shadow  
✅ **Session Cookies** - HTTPOnly, secure, 24-hour expiration  
✅ **Persistent Sessions** - Stay logged in across page reloads  
✅ **Session Restore** - Return to your last visited directory  
✅ **Protected APIs** - All file operations require authentication  
✅ **Logout Button** - One-click logout in the file manager header  

## 🚀 Running the App

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Backend Server
```bash
npm run dev:server
```
The backend will run on `http://localhost:3000`

### 3. Start the Frontend (in another terminal)
```bash
npm run dev
```
The frontend will run on `http://localhost:8080` (or wherever Vite points)

### 4. Access the App
Open your browser to the frontend URL and you'll see the login page!

## 🔐 Test Login

Use any system user with a password:

```
Username: root  (or any system user)
Password: [your system password]
```

The app verifies credentials against your system's `/etc/shadow` file using the `su` command.

## 📍 Session Persistence

When you log in and navigate to a directory:
1. Your current path is saved to localStorage
2. Your selected root is saved to localStorage
3. When you reload the page, you stay logged in
4. You're automatically redirected to your last directory

Try it:
1. Log in
2. Navigate to a few directories
3. Press F5 to reload
4. You should still be logged in and in the same directory!

## 🚪 Logout

1. Look for the **"Logout"** button in the top-right corner
2. Click it to:
   - Clear your session on the server
   - Remove the sessionId cookie
   - Clear localStorage
   - Redirect to login page

## 🔒 How Authentication Works

### Flow Diagram
```
User visits app
    ↓
App checks /api/auth/check
    ↓
    ├─ If authenticated → Show file manager
    └─ If not → Redirect to login
    
User logs in
    ↓
POST /api/auth/login with username/password
    ↓
Server verifies using su command
    ↓
Server creates session and sets cookie
    ↓
Frontend redirects to file manager
    ↓
All file operations include sessionId cookie
```

### Session Storage
- **Server**: In-memory (can be replaced with database)
- **Client**: HTTPOnly cookie + localStorage
- **Duration**: 24 hours

## 🛡️ Security

- **Passwords**: Verified against system `/etc/shadow` file
- **Cookies**: HTTPOnly (JavaScript can't access)
- **CSRF**: SameSite='lax' protection enabled
- **Session IDs**: Cryptographically random 32-byte hex
- **Timeout**: 5-second maximum on password verification
- **Rate Limiting**: Ready to add (production enhancement)

## 🔧 Configuration

Environment variables in `server.ts`:

```typescript
PORT = 3000                      // Server port
MAX_TREE_DEPTH = 3              // Tree depth
PREVIEW_MAX_BYTES = 64 * 1024   // Max preview size
SESSION_SECRET = "your-key"     // Session signing key
```

## 📝 Protected Endpoints

These endpoints now require authentication (valid sessionId cookie):

```
GET  /api/list              - List directory
GET  /api/tree              - Get directory tree
GET  /api/preview           - Preview file
GET  /api/download          - Download file
DELETE /api/item            - Delete file/folder
```

Public endpoints (no auth required):

```
GET  /api/roots             - Get available roots
POST /api/auth/login        - Login
GET  /api/auth/check        - Check auth status
POST /api/auth/logout       - Logout
```

## 🧪 Testing Checklist

- [ ] **Login Page** - Can you see the login form?
- [ ] **Wrong Password** - Error shown for wrong password?
- [ ] **Valid Login** - Logs in with correct credentials?
- [ ] **Redirection** - Redirected to file manager after login?
- [ ] **Session Restore** - Page reload keeps you logged in?
- [ ] **Path Restore** - Last directory is restored on reload?
- [ ] **Logout** - Logout button works and redirects to login?
- [ ] **Protected APIs** - Unauthorized requests return 401?
- [ ] **Navigation** - Can you browse files while logged in?

## 🚨 Troubleshooting

### "Cannot read /etc/shadow"
- The app falls back gracefully
- Make sure the Node.js process has permission to read shadow file
- In production, use a dedicated auth service instead

### "Login not working"
- Check that username exists in `/etc/passwd`
- Verify password is correct (su command is strict)
- Check browser console for error messages
- Check server logs

### "Session not persisting"
- Make sure cookies are enabled in browser
- Check that sessionId cookie is being set (DevTools > Network > Cookies)
- Clear browser cache and try again

### "Cannot access file manager after login"
- Check browser console for errors
- Verify /api/list endpoint is protected (should return 401 without session)
- Confirm sessionId cookie is being sent

## 📚 Files Changed

### Backend
- `server.ts` - Added auth endpoints and middleware

### Frontend
- `src/App.tsx` - Added auth logic and route protection
- `src/pages/Login.tsx` - Login form implementation
- `src/lib/api.ts` - Added logout function
- `src/hooks/use-file-explorer.ts` - Added localStorage persistence
- `src/components/file-explorer/FileExplorer.tsx` - Added logout button

### Documentation
- `AUTHENTICATION_GUIDE.md` - Complete authentication guide
- `IMPLEMENTATION_SUMMARY.md` - Implementation details

## 🎓 Learning Resources

The authentication system is built with:
- **Express.js** - Backend server
- **Cookies & Sessions** - Browser session management
- **localStorage API** - Client-side state persistence
- **React Router** - Client-side routing & protection
- **fetch API** - HTTP requests with credentials

## 💡 Next Steps

### For Development
1. Test all auth scenarios
2. Check console for any warnings
3. Verify protected endpoints work
4. Try logout and re-login

### For Production
1. Set `secure: true` in cookie settings
2. Use HTTPS exclusively
3. Replace in-memory sessions with database
4. Add rate limiting to login
5. Implement account lockout
6. Add logging for security events
7. Set up session timeout warnings
8. Consider two-factor authentication

## 🆘 Need Help?

- Check `AUTHENTICATION_GUIDE.md` for detailed documentation
- Check `IMPLEMENTATION_SUMMARY.md` for technical details
- Review server logs for error messages
- Check browser DevTools for network/console errors

---

**Ready to test?** Start both servers and visit the app! 🚀
