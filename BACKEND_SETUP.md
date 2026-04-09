# Backend Server Setup - Korean Department Scheduler

## Completed Setup

The complete backend Express.js server has been created and configured for the Korean Department Scheduler app.

### What Was Created

**Main Server Files:**
- `/server/index.ts` - Express app setup with all route mounting
- `/server/auth.ts` - JWT authentication and authorization middleware
- `/server/db.ts` - JSON-based database layer (no native binaries required)
- `/server/tsconfig.json` - TypeScript configuration for server compilation

**Route Modules:**
- `/server/routes/users.ts` - User profile, admin management, approval system
- `/server/routes/schedules.ts` - Schedule CRUD with privacy controls
- `/server/routes/projects.ts` - Project management with assignments
- `/server/routes/bookmarks.ts` - Schedule bookmarking system
- `/server/routes/memos.ts` - Sticky notes with color customization
- `/server/routes/feedbacks.ts` - User feedback collection
- `/server/routes/filterFavorites.ts` - Filter preference saving

**Documentation:**
- `/server/README.md` - Complete API documentation
- `/server/.env.example` - Environment variables reference
- Updated `/package.json` with server npm scripts

### Key Features

- **Authentication**: JWT with 7-day expiration
- **User Roles**: Admin and regular user roles with permission checks
- **Admin Approval**: New users require admin approval before login
- **Password Security**: bcryptjs with 10 salt rounds
- **Database**: JSON file-based (`scheduler.db.json`) - no native dependencies
- **Default Admin**: Email: admin@scheduler.com, Password: admin123

### Database Schema

The system creates these data tables automatically:
- users - Authentication and profiles
- projects - Project details and metadata
- projectAssignments - User-project relationships
- projectPhases - Project milestones
- projectSchedules - Project-specific schedules
- schedules - Events and schedules
- scheduleBookmarks - User bookmarks
- scheduleFilterFavorites - Saved filters
- feedbacks - User feedback
- memos - Sticky notes

### Running the Server

**Development (with hot reload):**
```bash
npm run server:dev
```

**Build for production:**
```bash
npm run server:build
```

**Run compiled version:**
```bash
npm run server:start
```

### API Endpoints Summary

All endpoints require JWT authentication (except `/api/auth/signup` and `/api/auth/signin`)

**Authentication:**
- POST `/api/auth/signup` - Register new user
- POST `/api/auth/signin` - Login
- GET `/api/auth/me` - Current user info

**Users (admin operations):**
- GET `/api/users` - All users
- PUT `/api/users/:id` - Update profile
- POST `/api/users/:id/approve` - Approve user
- POST `/api/users/:id/toggle-admin` - Change role
- DELETE `/api/users/:id` - Delete user

**Schedules:**
- GET/POST `/api/schedules` - List and create
- PUT/DELETE `/api/schedules/:id` - Update and delete

**Projects:**
- GET/POST `/api/projects` - List and create
- PUT/DELETE `/api/projects/:id` - Update and delete

**Other Endpoints:**
- `/api/bookmarks` - Bookmarking
- `/api/memos` - Notes
- `/api/feedbacks` - Feedback
- `/api/filter-favorites` - Filter preferences

### Environment Variables

See `/server/.env.example` for configuration options:
- `PORT` - Server port (default: 3001)
- `JWT_SECRET` - JWT signing secret (change in production)

### Technology Stack

- **Language**: TypeScript
- **Framework**: Express.js 5.x
- **Authentication**: jsonwebtoken (JWT)
- **Encryption**: bcryptjs
- **Database**: JSON file
- **CORS**: Enabled for frontend communication
- **Running**: tsx for development, Node.js for production

### File Locations

```
/sessions/youthful-upbeat-cray/scheduler/
├── server/
│   ├── index.ts
│   ├── auth.ts
│   ├── db.ts
│   ├── tsconfig.json
│   ├── README.md
│   ├── .env.example
│   └── routes/
│       ├── users.ts
│       ├── schedules.ts
│       ├── projects.ts
│       ├── bookmarks.ts
│       ├── memos.ts
│       ├── feedbacks.ts
│       └── filterFavorites.ts
└── scheduler.db.json (created on first run)
```

### Next Steps

1. Start the backend server: `npm run server:dev`
2. Server will run on `http://localhost:3001`
3. Frontend can connect to API endpoints with JWT tokens
4. Database file will auto-initialize on first run

### Notes

- The JSON database approach avoids native binary compilation issues
- All data persists in `scheduler.db.json`
- Private schedules are only visible to their creator
- Timestamps use ISO 8601 format
- All API responses include appropriate error messages in Korean
