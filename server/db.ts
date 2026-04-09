import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcryptjs from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'scheduler.db.json');

interface Database {
  users: any[];
  projects: any[];
  projectAssignments: any[];
  projectPhases: any[];
  projectSchedules: any[];
  schedules: any[];
  scheduleBookmarks: any[];
  scheduleFilterFavorites: any[];
  feedbacks: any[];
  memos: any[];
}

let dbData: Database = {
  users: [],
  projects: [],
  projectAssignments: [],
  projectPhases: [],
  projectSchedules: [],
  schedules: [],
  scheduleBookmarks: [],
  scheduleFilterFavorites: [],
  feedbacks: [],
  memos: [],
};

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 9);
}

function getCurrentTime(): string {
  return new Date().toISOString();
}

function loadDb() {
  if (fs.existsSync(dbPath)) {
    const content = fs.readFileSync(dbPath, 'utf-8');
    dbData = JSON.parse(content);
  } else {
    initDb();
  }
}

function saveDb() {
  fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
}

function initDb() {
  // Create a default admin user (password: admin123)
  const hash = bcryptjs.hashSync('admin123', 10);
  dbData.users.push({
    id: 'admin-001',
    name: '관리자',
    email: 'admin@scheduler.com',
    password: hash,
    position: '부서장',
    approved: 1,
    role: 'admin',
    created_at: getCurrentTime(),
    updated_at: getCurrentTime(),
  });

  // Create 6 default memos for admin
  const colors = ['yellow', 'pink', 'blue', 'green', 'purple', 'orange'];
  colors.forEach(c => {
    dbData.memos.push({
      id: generateId(),
      user_id: 'admin-001',
      title: '',
      content: '',
      color: c,
      font: 'pretendard-medium',
      font_size: 'medium',
      font_color: 'black',
      created_at: getCurrentTime(),
      updated_at: getCurrentTime(),
    });
  });

  saveDb();
}

// Initialize on load
loadDb();

// API wrapper to mimic better-sqlite3
export const db = {
  prepare: (sql: string) => ({
    get: (...params: any[]) => queryOne(sql, params),
    all: (...params: any[]) => queryAll(sql, params),
    run: (...params: any[]) => queryRun(sql, params),
  }),
  exec: (sql: string) => {
    // For migrations, we ignore raw SQL
  },
};

function queryOne(sql: string, params: any[]): any {
  // Parse simple SELECT queries
  if (sql.includes('SELECT') && sql.includes('FROM users WHERE email')) {
    const email = params[0];
    return dbData.users.find(u => u.email === email) || null;
  }
  if (sql.includes('SELECT') && sql.includes('FROM users WHERE id')) {
    const id = params[0];
    return dbData.users.find(u => u.id === id) || null;
  }
  if (sql.includes('SELECT') && sql.includes('FROM schedules') && sql.includes('WHERE id')) {
    const id = params[0];
    const schedule = dbData.schedules.find(s => s.id === id);
    if (schedule) {
      const project = schedule.project_id ? dbData.projects.find(p => p.id === schedule.project_id) : null;
      return {
        ...schedule,
        project_name: project?.name || null,
        project_abbreviation: project?.abbreviation || null,
      };
    }
    return null;
  }
  if (sql.includes('SELECT role FROM users WHERE id')) {
    const id = params[0];
    const user = dbData.users.find(u => u.id === id);
    return user ? { role: user.role } : null;
  }
  return null;
}

function queryAll(sql: string, params: any[]): any[] {
  // Parse simple SELECT queries
  if (sql.includes('SELECT') && sql.includes('FROM users')) {
    return dbData.users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      position: u.position,
      role: u.role,
      approved: u.approved,
      created_at: u.created_at,
    }));
  }
  if (sql.includes('SELECT') && sql.includes('FROM projects')) {
    return dbData.projects;
  }
  if (sql.includes('SELECT') && sql.includes('FROM schedules')) {
    return dbData.schedules.map(s => {
      const project = s.project_id ? dbData.projects.find(p => p.id === s.project_id) : null;
      return {
        ...s,
        project_name: project?.name || null,
        project_abbreviation: project?.abbreviation || null,
        project_status: project?.status || null,
      };
    });
  }
  if (sql.includes('SELECT') && sql.includes('FROM project_assignments')) {
    const projectId = params[0];
    return dbData.projectAssignments
      .filter(pa => pa.project_id === projectId)
      .map(pa => {
        const user = dbData.users.find(u => u.id === pa.user_id);
        return { ...pa, user_name: user?.name || null };
      });
  }
  if (sql.includes('SELECT') && sql.includes('FROM schedule_bookmarks')) {
    const userId = params[0];
    return dbData.scheduleBookmarks
      .filter(sb => sb.user_id === userId)
      .map(sb => ({ schedule_id: sb.schedule_id }));
  }
  if (sql.includes('SELECT') && sql.includes('FROM memos')) {
    const userId = params[0];
    return dbData.memos.filter(m => m.user_id === userId);
  }
  if (sql.includes('SELECT') && sql.includes('FROM feedbacks')) {
    return dbData.feedbacks.map(f => {
      const user = dbData.users.find(u => u.id === f.user_id);
      return { ...f, user_name: user?.name || null, user_position: user?.position || null };
    });
  }
  if (sql.includes('SELECT') && sql.includes('FROM schedule_filter_favorites')) {
    const userId = params[0];
    return dbData.scheduleFilterFavorites.filter(sf => sf.user_id === userId);
  }
  return [];
}

function queryRun(sql: string, params: any[]): any {
  if (sql.includes('INSERT INTO users')) {
    const [id, name, email, password, position] = params;
    dbData.users.push({
      id,
      name,
      email,
      password,
      position: position || null,
      approved: 0,
      role: 'user',
      created_at: getCurrentTime(),
      updated_at: getCurrentTime(),
    });
    saveDb();
    return { changes: 1 };
  }
  if (sql.includes('INSERT INTO memos')) {
    const [id, userId, color, font] = params;
    dbData.memos.push({
      id,
      user_id: userId,
      title: '',
      content: '',
      color: color || 'yellow',
      font: font || 'pretendard-medium',
      font_size: 'medium',
      font_color: 'black',
      created_at: getCurrentTime(),
      updated_at: getCurrentTime(),
    });
    saveDb();
    return { changes: 1 };
  }
  if (sql.includes('UPDATE users SET password')) {
    const [hash, email] = params;
    const user = dbData.users.find(u => u.email === email);
    if (user) {
      user.password = hash;
      user.updated_at = getCurrentTime();
      saveDb();
    }
    return { changes: 1 };
  }
  if (sql.includes('UPDATE users SET') && !sql.includes('WHERE id')) {
    const user = dbData.users.find(u => u.id === params[params.length - 1]);
    if (user) {
      if (params[0]) user.name = params[0];
      if (params[1]) user.position = params[1];
      if (params[2]) user.email = params[2];
      user.updated_at = getCurrentTime();
      saveDb();
    }
    return { changes: 1 };
  }
  if (sql.includes('UPDATE users SET role')) {
    const [newRole, id] = params;
    const user = dbData.users.find(u => u.id === id);
    if (user) {
      user.role = newRole;
      user.updated_at = getCurrentTime();
      saveDb();
    }
    return { changes: 1 };
  }
  if (sql.includes('UPDATE users SET approved')) {
    const [id] = params;
    const user = dbData.users.find(u => u.id === id);
    if (user) {
      user.approved = 1;
      user.updated_at = getCurrentTime();
      saveDb();
    }
    return { changes: 1 };
  }
  if (sql.includes('INSERT INTO schedules')) {
    const [id, userId, projectId, category, title, notes, scheduleDate, scheduleTime, scheduleType, location, attendees, isPrivate] = params;
    dbData.schedules.push({
      id,
      user_id: userId,
      project_id: projectId,
      category,
      title,
      notes,
      schedule_date: scheduleDate,
      schedule_time: scheduleTime,
      schedule_type: scheduleType,
      location,
      attendees,
      is_private: isPrivate,
      updated_by: null,
      created_at: getCurrentTime(),
      updated_at: getCurrentTime(),
    });
    saveDb();
    return { changes: 1 };
  }
  if (sql.includes('UPDATE schedules SET')) {
    const schedule = dbData.schedules.find(s => s.id === params[params.length - 1]);
    if (schedule) {
      [schedule.project_id, schedule.category, schedule.title, schedule.notes, schedule.schedule_date, schedule.schedule_time, schedule.schedule_type, schedule.location, schedule.attendees, schedule.is_private, schedule.updated_by] = params.slice(0, -1);
      schedule.updated_at = getCurrentTime();
      saveDb();
    }
    return { changes: 1 };
  }
  if (sql.includes('DELETE FROM schedules')) {
    dbData.schedules = dbData.schedules.filter(s => s.id !== params[0]);
    saveDb();
    return { changes: 1 };
  }
  if (sql.includes('INSERT INTO projects')) {
    const [id, name, abbreviation, status, pofNumber, client, createdBy] = params;
    dbData.projects.push({
      id,
      pof_number: pofNumber,
      name,
      abbreviation,
      client,
      client_contact: null,
      contract_amount: 0,
      contract_date: null,
      deadline_date: null,
      description: null,
      status,
      created_by: createdBy,
      created_at: getCurrentTime(),
      updated_at: getCurrentTime(),
    });
    saveDb();
    return { changes: 1 };
  }
  if (sql.includes('INSERT INTO project_assignments')) {
    const [id, projectId, userId, role] = params;
    dbData.projectAssignments.push({ id, project_id: projectId, user_id: userId, role });
    saveDb();
    return { changes: 1 };
  }
  if (sql.includes('INSERT INTO project_schedules')) {
    const [id, projectId, name, dateType, startDate, endDate, order] = params;
    dbData.projectSchedules.push({
      id,
      project_id: projectId,
      name,
      date_type: dateType,
      start_date: startDate,
      end_date: endDate,
      schedule_order: order,
    });
    saveDb();
    return { changes: 1 };
  }
  if (sql.includes('DELETE FROM project_assignments')) {
    dbData.projectAssignments = dbData.projectAssignments.filter(pa => pa.project_id !== params[0]);
    saveDb();
    return { changes: 1 };
  }
  if (sql.includes('DELETE FROM project_schedules')) {
    dbData.projectSchedules = dbData.projectSchedules.filter(ps => ps.project_id !== params[0]);
    saveDb();
    return { changes: 1 };
  }
  if (sql.includes('UPDATE projects SET')) {
    const project = dbData.projects.find(p => p.id === params[params.length - 1]);
    if (project) {
      [project.name, project.abbreviation, project.status, project.pof_number, project.client] = params.slice(0, -1);
      project.updated_at = getCurrentTime();
      saveDb();
    }
    return { changes: 1 };
  }
  if (sql.includes('DELETE FROM projects')) {
    dbData.projects = dbData.projects.filter(p => p.id !== params[0]);
    dbData.projectAssignments = dbData.projectAssignments.filter(pa => pa.project_id !== params[0]);
    dbData.projectSchedules = dbData.projectSchedules.filter(ps => ps.project_id !== params[0]);
    saveDb();
    return { changes: 1 };
  }
  if (sql.includes('INSERT INTO schedule_bookmarks')) {
    const [id, userId, scheduleId] = params;
    const exists = dbData.scheduleBookmarks.some(sb => sb.user_id === userId && sb.schedule_id === scheduleId);
    if (!exists) {
      dbData.scheduleBookmarks.push({ id, user_id: userId, schedule_id: scheduleId, created_at: getCurrentTime() });
      saveDb();
    }
    return { changes: 1 };
  }
  if (sql.includes('DELETE FROM schedule_bookmarks')) {
    const [userId, scheduleId] = params;
    dbData.scheduleBookmarks = dbData.scheduleBookmarks.filter(sb => !(sb.user_id === userId && sb.schedule_id === scheduleId));
    saveDb();
    return { changes: 1 };
  }
  if (sql.includes('INSERT INTO memos') && params.length === 4) {
    // Already handled above
    return { changes: 1 };
  }
  if (sql.includes('UPDATE memos SET')) {
    const memo = dbData.memos.find(m => m.id === params[params.length - 2]);
    if (memo) {
      const updates = params.slice(0, -2);
      if (updates[0] !== null) memo.title = updates[0];
      if (updates[1] !== null) memo.content = updates[1];
      if (updates[2] !== null) memo.color = updates[2];
      if (updates[3] !== null) memo.font = updates[3];
      if (updates[4] !== null) memo.font_size = updates[4];
      if (updates[5] !== null) memo.font_color = updates[5];
      memo.updated_at = getCurrentTime();
      saveDb();
    }
    return { changes: 1 };
  }
  if (sql.includes('DELETE FROM memos')) {
    const [id, userId] = params;
    dbData.memos = dbData.memos.filter(m => !(m.id === id && m.user_id === userId));
    saveDb();
    return { changes: 1 };
  }
  if (sql.includes('INSERT INTO feedbacks')) {
    const [id, userId, content] = params;
    dbData.feedbacks.push({
      id,
      user_id: userId,
      title: '',
      content,
      created_at: getCurrentTime(),
      updated_at: getCurrentTime(),
    });
    saveDb();
    return { changes: 1 };
  }
  if (sql.includes('UPDATE feedbacks SET')) {
    const [content, id, userId] = params;
    const feedback = dbData.feedbacks.find(f => f.id === id && f.user_id === userId);
    if (feedback) {
      feedback.content = content;
      feedback.updated_at = getCurrentTime();
      saveDb();
    }
    return { changes: 1 };
  }
  if (sql.includes('DELETE FROM feedbacks')) {
    const [id, userId] = params;
    dbData.feedbacks = dbData.feedbacks.filter(f => !(f.id === id && f.user_id === userId));
    saveDb();
    return { changes: 1 };
  }
  if (sql.includes('INSERT INTO schedule_filter_favorites')) {
    const [id, userId, filterType, filterId] = params;
    const exists = dbData.scheduleFilterFavorites.some(sf => sf.user_id === userId && sf.filter_type === filterType && sf.filter_id === filterId);
    if (!exists) {
      dbData.scheduleFilterFavorites.push({ id, user_id: userId, filter_type: filterType, filter_id: filterId, created_at: getCurrentTime() });
      saveDb();
    }
    return { changes: 1 };
  }
  if (sql.includes('DELETE FROM schedule_filter_favorites')) {
    const [userId, filterType, filterId] = params;
    dbData.scheduleFilterFavorites = dbData.scheduleFilterFavorites.filter(sf => !(sf.user_id === userId && sf.filter_type === filterType && sf.filter_id === filterId));
    saveDb();
    return { changes: 1 };
  }
  if (sql.includes('DELETE FROM users')) {
    dbData.users = dbData.users.filter(u => u.id !== params[0]);
    saveDb();
    return { changes: 1 };
  }
  return { changes: 0 };
}

export default db;
