import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../auth';
import { v4 as uuid } from 'uuid';
import db from '../db';

const router = Router();
router.use(authMiddleware as any);

router.get('/', (req: AuthRequest, res: Response) => {
  const bookmarks = db.prepare('SELECT schedule_id FROM schedule_bookmarks WHERE user_id = ?').all(req.user!.id);
  res.json(bookmarks);
});

router.post('/', (req: AuthRequest, res: Response) => {
  const { schedule_id } = req.body;
  try {
    db.prepare('INSERT INTO schedule_bookmarks (id, user_id, schedule_id) VALUES (?, ?, ?)').run(uuid(), req.user!.id, schedule_id);
    res.json({ message: '찜 되었습니다' });
  } catch {
    res.json({ message: '이미 찜한 일정입니다' });
  }
});

router.delete('/:scheduleId', (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM schedule_bookmarks WHERE user_id = ? AND schedule_id = ?').run(req.user!.id, req.params.scheduleId);
  res.json({ message: '찜 해제되었습니다' });
});

export default router;
