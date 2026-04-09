import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../auth';
import { v4 as uuid } from 'uuid';
import db from '../db';

const router = Router();
router.use(authMiddleware as any);

router.get('/', (req: AuthRequest, res: Response) => {
  const schedules = db.prepare(`
    SELECT s.* FROM schedules s
    ORDER BY s.schedule_date ASC
  `).all() as any[];

  // Filter private schedules
  const filtered = schedules.map(s => {
    if (s.is_private && s.user_id !== req.user!.id) return null;
    return { ...s, attendees: s.attendees ? JSON.parse(s.attendees) : [] };
  }).filter(Boolean);

  res.json(filtered);
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  const schedule = db.prepare(`
    SELECT s.* FROM schedules s WHERE s.id = ?
  `).get(req.params.id) as any;
  if (!schedule) return res.status(404).json({ error: '일정을 찾을 수 없습니다' });
  schedule.attendees = schedule.attendees ? JSON.parse(schedule.attendees) : [];
  res.json(schedule);
});

router.post('/', (req: AuthRequest, res: Response) => {
  const { project_id, category, title, notes, schedule_date, schedule_time, schedule_type, location, attendees, is_private } = req.body;
  const id = uuid();
  db.prepare(`INSERT INTO schedules (id, user_id, project_id, category, title, notes, schedule_date, schedule_time, schedule_type, location, attendees, is_private)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, req.user!.id, project_id || null, category || null, title, notes || null,
    schedule_date, schedule_time || null, schedule_type || null, location || null,
    attendees ? JSON.stringify(attendees) : null, is_private ? 1 : 0
  );
  res.json({ id, message: '등록되었습니다' });
});

router.put('/:id', (req: AuthRequest, res: Response) => {
  const { project_id, category, title, notes, schedule_date, schedule_time, schedule_type, location, attendees, is_private } = req.body;
  db.prepare(`UPDATE schedules SET project_id=?, category=?, title=?, notes=?, schedule_date=?, schedule_time=?, schedule_type=?, location=?, attendees=?, is_private=?, updated_by=?, updated_at=datetime('now')
    WHERE id=?`).run(
    project_id || null, category || null, title, notes || null,
    schedule_date, schedule_time || null, schedule_type || null, location || null,
    attendees ? JSON.stringify(attendees) : null, is_private ? 1 : 0,
    req.user!.id, req.params.id
  );
  res.json({ message: '수정되었습니다' });
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM schedules WHERE id = ?').run(req.params.id);
  res.json({ message: '삭제되었습니다' });
});

export default router;
