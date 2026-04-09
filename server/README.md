# Korean Department Scheduler - Backend Server

A Node.js/Express backend server for managing schedules, projects, and team coordination in Korean departments.

## Features

- **Authentication**: JWT-based authentication with bcryptjs password hashing
- **User Management**: Admin approval system, role-based access control
- **Schedules**: Create, read, update, delete schedules with private/public visibility
- **Projects**: Manage projects with assignments and project schedules
- **Memos**: Sticky notes with color customization
- **Feedback**: Collect user feedback
- **Bookmarks**: Bookmark important schedules
- **Filter Favorites**: Save favorite filter combinations

## Tech Stack

- **Framework**: Express.js
- **Database**: JSON-based (file: `scheduler.db.json`)
- **Authentication**: JWT
- **Password Hashing**: bcryptjs
- **TypeScript**: Full type safety

## Installation

Dependencies are already installed. If needed, install manually:

```bash
npm install express cors jsonwebtoken bcryptjs uuid
npm install -D @types/express @types/jsonwebtoken @types/bcryptjs @types/cors @types/uuid tsx
```

## Running the Server

### Development Mode
```bash
npm run server:dev
```
Runs with hot reload using `tsx watch`

### Build
```bash
npm run server:build
```
Compiles TypeScript to JavaScript in `server/dist/`

### Production Mode
```bash
npm run server:start
```
Runs the compiled JavaScript

## API Endpoints

### Authentication (`/api/auth`)
- `POST /signup` - Register new user
- `POST /signin` - Login user
- `GET /me` - Get current user profile
- `POST /change-password` - Change password
- `POST /reset-password` - Reset user password (admin only)

### Users (`/api/users`)
- `GET /` - Get all users
- `PUT /:id` - Update user profile
- `POST /:id/approve` - Approve user (admin only)
- `POST /:id/toggle-admin` - Toggle admin role (admin only)
- `DELETE /:id` - Delete user (admin only)

### Schedules (`/api/schedules`)
- `GET /` - Get all schedules (filters private schedules)
- `GET /:id` - Get schedule details
- `POST /` - Create schedule
- `PUT /:id` - Update schedule
- `DELETE /:id` - Delete schedule

### Projects (`/api/projects`)
- `GET /` - Get all projects with assignments and schedules
- `GET /:id` - Get project details
- `POST /` - Create project
- `PUT /:id` - Update project
- `DELETE /:id` - Delete project

### Memos (`/api/memos`)
- `GET /` - Get user's memos
- `POST /` - Create memo
- `PUT /:id` - Update memo
- `DELETE /:id` - Delete memo

### Bookmarks (`/api/bookmarks`)
- `GET /` - Get user's bookmarks
- `POST /` - Add bookmark
- `DELETE /:scheduleId` - Remove bookmark

### Feedbacks (`/api/feedbacks`)
- `GET /` - Get all feedback (admin)
- `POST /` - Create feedback
- `PUT /:id` - Update feedback
- `DELETE /:id` - Delete feedback

### Filter Favorites (`/api/filter-favorites`)
- `GET /` - Get user's favorite filters
- `POST /` - Add favorite filter
- `DELETE /` - Remove favorite filter

## Default Admin Account

- **Email**: admin@scheduler.com
- **Password**: admin123
- **Role**: admin

## Database

The database uses a JSON file (`scheduler.db.json`) in the root directory with the following tables:

- `users` - User accounts and profiles
- `projects` - Project information
- `projectAssignments` - User assignments to projects
- `projectPhases` - Project phases/milestones
- `projectSchedules` - Project-specific schedules
- `schedules` - User/project schedules and events
- `scheduleBookmarks` - Bookmarked schedules
- `scheduleFilterFavorites` - Saved filter preferences
- `feedbacks` - User feedback
- `memos` - Sticky notes

## Environment Variables

- `PORT` - Server port (default: 3001)
- `JWT_SECRET` - JWT signing secret (default: 'scheduler-secret-key-2026')

## File Structure

```
server/
├── index.ts           - Main Express app setup
├── auth.ts            - Authentication routes and middleware
├── db.ts              - Database layer with JSON backend
├── tsconfig.json      - TypeScript configuration
├── routes/
│   ├── users.ts       - User management routes
│   ├── schedules.ts   - Schedule routes
│   ├── projects.ts    - Project routes
│   ├── bookmarks.ts   - Bookmark routes
│   ├── memos.ts       - Memo routes
│   ├── feedbacks.ts   - Feedback routes
│   └── filterFavorites.ts - Filter favorites routes
└── README.md          - This file
```

## Notes

- All timestamps are in ISO 8601 format
- Passwords are hashed with bcryptjs (10 salt rounds)
- JWT tokens expire after 7 days
- Private schedules are only visible to their creator
- Admin users have access to all management endpoints
