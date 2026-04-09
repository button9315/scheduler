import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useIsMobile } from '../hooks/useIsMobile';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import {
  FolderKanban,
  Calendar,
  ClipboardList,
  Star,
  StickyNote,
  Users,
  UserCog,
  Settings,
  MessageSquarePlus,
  LogOut,
  Menu,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const menuItems = [
  { label: '부서 캘린더', icon: Calendar, path: '/' },
  { label: '카테고리별 일정', icon: ClipboardList, path: '/project-schedules' },
  { label: '찜한 일정', icon: Star, path: '/bookmarks' },
  { label: '메모장', icon: StickyNote, path: '/memos' },
  { label: '프로젝트 등록', icon: FolderKanban, path: '/projects' },
  { label: '부서원 관리', icon: Users, path: '/members' },
  { label: '내 정보 수정', icon: UserCog, path: '/my-profile' },
  { label: '설정', icon: Settings, path: '/settings' },
  { label: '개선의견', icon: MessageSquarePlus, path: '/feedback' },
];

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    await signOut();
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-white">
        {/* Mobile Header */}
        <header className="fixed top-0 left-0 right-0 h-11 bg-white border-b border-border flex items-center justify-between px-3 z-40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(280,70%,50%)] flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold text-foreground">여론7부</span>
              <span className="text-xs text-muted-foreground">업무 스케줄러</span>
            </div>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <button className="p-1 hover:bg-gray-100 rounded-lg">
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-0 flex flex-col">
              <nav className="flex-1 px-3 pt-4 pb-4 overflow-y-auto">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-border px-3 py-3 flex flex-col gap-2">
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-gray-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>로그아웃</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        {/* Mobile Main Content */}
        <main className="pt-11 p-2 pb-4">
          <Outlet />
        </main>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="flex h-screen bg-white">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-sidebar-background text-sidebar-foreground border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(280,70%,50%)] flex items-center justify-center flex-shrink-0">
              <FolderKanban className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">여론7부</span>
              <span className="text-xs text-muted-foreground">업무 스케줄러</span>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="flex flex-col gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 h-9 px-4 rounded-xl transition-all ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary font-semibold shadow-sm'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border flex flex-col gap-2">
          <p className="text-xs text-sidebar-foreground/70 truncate">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 h-9 px-4 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">로그아웃</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-background overflow-auto">
        <div className="p-6 pt-2">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
