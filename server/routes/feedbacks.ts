import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../auth';
import { v4 as uuid } from 'uuid';
import db from '../db';

const router = Router();
router.use(authMiddleware as any);

router.get('/', (req: AuthRequest, res: Response) => {
  const feedbacks = db.prepare(`SELECT f.*, u.name as user_name, u.position as user_position FROM feedbacks f LEFT JOIN users u ON f.user_id = u.id ORDER BY f.updated_at DESC`).all();
  res.json(feedbacks);
});

router.post('/', (req: AuthRequest, res: Response) => {
  const { content } = req.body;
  const id = uuid();
  db.prepare('INSERT INTO feedbacks (id, user_id, content) VALUES (?, ?, ?)').run(id, req.user!.id, content);
  res.json({ id, message: '등록되었습니다' });
});

router.put('/:id', (req: AuthRequest, res: Response) => {
  const { content } = req.body;
  db.prepare('UPDATE feedbacks SET content=?, updated_at=datetime("now") WHERE id=? AND user_id=?').run(content, req.params.id, req.user!.id);
  res.json({ message: '수정되었습니다' });
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM feedbacks WHERE id=? AND user_id=?').run(req.params.id, req.user!.id);
  res.json({ message: '삭제되었습니다' });
});

export default router;
