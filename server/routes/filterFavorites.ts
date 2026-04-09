import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../auth';
import { v4 as uuid } from 'uuid';
import db from '../db';

const router = Router();
router.use(authMiddleware as any);

router.get('/', (req: AuthRequest, res: Response) => {
  const favs = db.prepare('SELECT * FROM schedule_filter_favorites WHERE user_id = ?').all(req.user!.id);
  res.json(favs);
});

router.post('/', (req: AuthRequest, res: Response) => {
  const { filter_type, filter_id } = req.body;
  try {
    db.prepare('INSERT INTO schedule_filter_favorites (id, user_id, filter_type, filter_id) VALUES (?, ?, ?, ?)').run(uuid(), req.user!.id, filter_type, filter_id);
    res.json({ message: '즐겨찾기 추가' });
  } catch {
    res.json({ message: '이미 추가됨' });
  }
});

router.delete('/', (req: AuthRequest, res: Response) => {
  const { filter_type, filter_id } = req.body;
  db.prepare('DELETE FROM schedule_filter_favorites WHERE user_id=? AND filter_type=? AND filter_id=?').run(req.user!.id, filter_type, filter_id);
  res.json({ message: '즐겨찾기 제거' });
});

export default router;
