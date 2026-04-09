import express from 'express';
import cors from 'cors';
import authRouter from './auth';
import usersRouter from './routes/users';
import schedulesRouter from './routes/schedules';
import projectsRouter from './routes/projects';
import bookmarksRouter from './routes/bookmarks';
import memosRouter from './routes/memos';
import feedbacksRouter from './routes/feedbacks';
import filterFavoritesRouter from './routes/filterFavorites';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/bookmarks', bookmarksRouter);
app.use('/api/memos', memosRouter);
app.use('/api/feedbacks', feedbacksRouter);
app.use('/api/filter-favorites', filterFavoritesRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
