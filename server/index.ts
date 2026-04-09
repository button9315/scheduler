import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRouter from './auth';
import usersRouter from './routes/users';
import schedulesRouter from './routes/schedules';
import projectsRouter from './routes/projects';
import bookmarksRouter from './routes/bookmarks';
import memosRouter from './routes/memos';
import feedbacksRouter from './routes/feedbacks';
import filterFavoritesRouter from './routes/filterFavorites';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/bookmarks', bookmarksRouter);
app.use('/api/memos', memosRouter);
app.use('/api/feedbacks', feedbacksRouter);
app.use('/api/filter-favorites', filterFavoritesRouter);

// Serve frontend build files
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// All non-API routes serve the frontend (for React Router)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
