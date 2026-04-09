import { Router, Request, Response, NextFunction } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import db from './db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'scheduler-secret-key-2026';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '인증이 필요합니다' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: '유효하지 않은 토큰입니다' });
  }
}

// Sign up
router.post('/signup', (req: Request, res: Response) => {
  const { name, email, password, position } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: '필수 항목을 입력해주세요' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(400).json({ error: '이미 사용 중인 이메일입니다' });

  const hash = bcryptjs.hashSync(password, 10);
  const id = uuid();
  db.prepare('INSERT INTO users (id, name, email, password, position, approved) VALUES (?, ?, ?, ?, ?, 0)').run(id, name, email, hash, position || null);

  // Create 6 default memos
  const colors = ['yellow', 'pink', 'blue', 'green', 'purple', 'orange'];
  const insertMemo = db.prepare('INSERT INTO memos (id, user_id, color, font) VALUES (?, ?, ?, ?)');
  colors.forEach(c => insertMemo.run(uuid(), id, c, 'pretendard-medium'));

  res.json({ message: '관리자 승인 후 로그인이 가능합니다' });
});

// Sign in
router.post('/signin', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user) return res.status(400).json({ error: '등록되지 않은 이메일입니다' });
  if (!user.approved) return res.status(400).json({ error: '관리자 승인 대기 중입니다' });
  if (!bcryptjs.compareSync(password, user.password)) return res.status(400).json({ error: '비밀번호가 일치하지 않습니다' });

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, position: user.position, role: user.role } });
});

// Get current user
router.get('/me', authMiddleware as any, (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT id, name, email, position, role, approved FROM users WHERE id = ?').get(req.user!.id) as any;
  if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
  res.json(user);
});

// Reset password (admin only)
router.post('/reset-password', authMiddleware as any, (req: AuthRequest, res: Response) => {
  const { email } = req.body;
  const admin = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user!.id) as any;
  if (admin?.role !== 'admin') return res.status(403).json({ error: '권한이 없습니다' });

  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as any;
  if (!user) return res.status(400).json({ error: '등록되지 않은 이메일입니다' });

  const newPassword = Math.random().toString(36).slice(-8);
  const hash = bcryptjs.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ?, updated_at = datetime("now") WHERE email = ?').run(hash, email);
  res.json({ password: newPassword });
});

// Change password
router.post('/change-password', authMiddleware as any, (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as any;
  if (!bcryptjs.compareSync(currentPassword, user.password)) return res.status(400).json({ error: '현재 비밀번호가 일치하지 않습니다' });

  const hash = bcryptjs.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ?, updated_at = datetime("now") WHERE id = ?').run(hash, req.user!.id);
  res.json({ message: '비밀번호가 변경되었습니다' });
});

export default router;
