import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../auth';
import { v4 as uuid } from 'uuid';
import db from '../db';

const router = Router();
router.use(authMiddleware as any);

router.get('/', (req: AuthRequest, res: Response) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all() as any[];
  const assignments = db.prepare('SELECT pa.*, u.name as user_name FROM project_assignments pa LEFT JOIN users u ON pa.user_id = u.id').all() as any[];
  const schedules = db.prepare('SELECT * FROM project_schedules ORDER BY schedule_order ASC').all() as any[];

  const result = projects.map(p => ({
    ...p,
    assignments: assignments.filter(a => a.project_id === p.id),
    projectSchedules: schedules.filter(s => s.project_id === p.id),
  }));
  res.json(result);
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as any;
  if (!project) return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다' });
  project.assignments = db.prepare('SELECT pa.*, u.name as user_name FROM project_assignments pa LEFT JOIN users u ON pa.user_id = u.id WHERE pa.project_id = ?').all(req.params.id) as any[];
  project.projectSchedules = db.prepare('SELECT * FROM project_schedules WHERE project_id = ? ORDER BY schedule_order ASC').all(req.params.id) as any[];
  res.json(project);
});

router.post('/', (req: AuthRequest, res: Response) => {
  const { name, abbreviation, status, pof_number, client, assignments, projectSchedules } = req.body;
  const id = uuid();
  db.prepare('INSERT INTO projects (id, name, abbreviation, status, pof_number, client, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, name, abbreviation || null, status || 'waiting', pof_number || '', client || null, req.user!.id);

  if (assignments?.length) {
    const stmt = db.prepare('INSERT INTO project_assignments (id, project_id, user_id, role) VALUES (?, ?, ?, ?)');
    assignments.forEach((a: any) => stmt.run(uuid(), id, a.user_id, a.role));
  }
  if (projectSchedules?.length) {
    const stmt = db.prepare('INSERT INTO project_schedules (id, project_id, name, date_type, start_date, end_date, schedule_order) VALUES (?, ?, ?, ?, ?, ?, ?)');
    projectSchedules.forEach((s: any, i: number) => stmt.run(uuid(), id, s.name, s.date_type || 'period', s.start_date || null, s.end_date || null, i));
  }
  res.json({ id, message: '등록되었습니다' });
});

router.put('/:id', (req: AuthRequest, res: Response) => {
  const { name, abbreviation, status, pof_number, client, assignments, projectSchedules } = req.body;
  db.prepare('UPDATE projects SET name=?, abbreviation=?, status=?, pof_number=?, client=?, updated_at=datetime("now") WHERE id=?')
    .run(name, abbreviation || null, status, pof_number || '', client || null, req.params.id);

  // Replace assignments
  db.prepare('DELETE FROM project_assignments WHERE project_id = ?').run(req.params.id);
  if (assignments?.length) {
    const stmt = db.prepare('INSERT INTO project_assignments (id, project_id, user_id, role) VALUES (?, ?, ?, ?)');
    assignments.forEach((a: any) => stmt.run(uuid(), req.params.id, a.user_id, a.role));
  }
  // Replace schedules
  db.prepare('DELETE FROM project_schedules WHERE project_id = ?').run(req.params.id);
  if (projectSchedules?.length) {
    const stmt = db.prepare('INSERT INTO project_schedules (id, project_id, name, date_type, start_date, end_date, schedule_order) VALUES (?, ?, ?, ?, ?, ?, ?)');
    projectSchedules.forEach((s: any, i: number) => stmt.run(uuid(), req.params.id, s.name, s.date_type || 'period', s.start_date || null, s.end_date || null, i));
  }
  res.json({ message: '수정되었습니다' });
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ message: '삭제되었습니다' });
});

export default router;
