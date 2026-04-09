import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">찾을 수 없는 페이지입니다</p>
        <Link
          to="/"
          className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
