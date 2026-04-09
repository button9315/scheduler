import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../auth';
import bcryptjs from 'bcryptjs';
import db from '../db';

const router = Router();
router.use(authMiddleware as any);

// Get all users (profiles)
router.get('/', (req: AuthRequest, res: Response) => {
  const users = db.prepare('SELECT id, name, email, position, role, approved, created_at FROM users').all();
  res.json(users);
});

// Update user profile
router.put('/:id', (req: AuthRequest, res: Response) => {
  const { name, position, email } = req.body;
  const isAdmin = (db.prepare('SELECT role FROM users WHERE id = ?').get(req.user!.id) as any)?.role === 'admin';
  const isSelf = req.params.id === req.user!.id;
  if (!isAdmin && !isSelf) return res.status(403).json({ error: '권한이 없습니다' });

  db.prepare('UPDATE users SET name = COALESCE(?, name), position = COALESCE(?, position), email = COALESCE(?, email), updated_at = datetime("now") WHERE id = ?')
    .run(name || null, position || null, email || null, req.params.id);
  res.json({ message: '수정되었습니다' });
});

// Toggle admin role
router.post('/:id/toggle-admin', (req: AuthRequest, res: Response) => {
  const admin = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user!.id) as any;
  if (admin?.role !== 'admin') return res.status(403).json({ error: '권한이 없습니다' });

  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.params.id) as any;
  const newRole = user?.role === 'admin' ? 'user' : 'admin';
  db.prepare('UPDATE users SET role = ?, updated_at = datetime("now") WHERE id = ?').run(newRole, req.params.id);
  res.json({ role: newRole });
});

// Approve user
router.post('/:id/approve', (req: AuthRequest, res: Response) => {
  const admin = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user!.id) as any;
  if (admin?.role !== 'admin') return res.status(403).json({ error: '권한이 없습니다' });

  db.prepare('UPDATE users SET approved = 1, updated_at = datetime("now") WHERE id = ?').run(req.params.id);
  res.json({ message: '승인되었습니다' });
});

// Delete user
router.delete('/:id', (req: AuthRequest, res: Response) => {
  const admin = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user!.id) as any;
  if (admin?.role !== 'admin') return res.status(403).json({ error: '권한이 없습니다' });

  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: '삭제되었습니다' });
});

export default router;
