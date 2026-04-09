import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../auth';
import { v4 as uuid } from 'uuid';
import db from '../db';

const router = Router();
router.use(authMiddleware as any);

router.get('/', (req: AuthRequest, res: Response) => {
  const memos = db.prepare('SELECT * FROM memos WHERE user_id = ? ORDER BY created_at ASC').all(req.user!.id);
  res.json(memos);
});

router.post('/', (req: AuthRequest, res: Response) => {
  const { color } = req.body;
  const id = uuid();
  db.prepare('INSERT INTO memos (id, user_id, color, font) VALUES (?, ?, ?, ?)').run(id, req.user!.id, color || 'yellow', 'pretendard-medium');
  const memo = db.prepare('SELECT * FROM memos WHERE id = ?').get(id);
  res.json(memo);
});

router.put('/:id', (req: AuthRequest, res: Response) => {
  const { title, content, color, font, font_size, font_color } = req.body;
  db.prepare(`UPDATE memos SET title=COALESCE(?,title), content=COALESCE(?,content), color=COALESCE(?,color), font=COALESCE(?,font), font_size=COALESCE(?,font_size), font_color=COALESCE(?,font_color), updated_at=datetime('now') WHERE id=? AND user_id=?`)
    .run(title ?? null, content ?? null, color ?? null, font ?? null, font_size ?? null, font_color ?? null, req.params.id, req.user!.id);
  res.json({ message: '저장되었습니다' });
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM memos WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  res.json({ message: '삭제되었습니다' });
});

export default router;
