import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent } from '../components/ui/card';
import {
  FolderKanban,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Briefcase,
} from 'lucide-react';

const positions = [
  '인턴',
  '대리',
  '과장',
  '차장',
  '부장',
  '본부장',
];

const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
});

const signupSchema = z.object({
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  position: z.string().min(1, '직급을 선택해주세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['passwordConfirm'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export default function AuthPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      position: '',
      password: '',
      passwordConfirm: '',
    },
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      await signIn(data.email, data.password);
      navigate('/');
    } catch (error) {
      toast.error('로그인에 실패했습니다');
    }
  };

  const onSignupSubmit = async (data: SignupFormData) => {
    try {
      await signUp(data);
      toast.success('관리자 승인 후 로그인이 가능합니다');
      signupForm.reset();
      setTab('login');
    } catch (error) {
      toast.error('회원가입에 실패했습니다');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardContent className="pt-6">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(280,70%,50%)] flex items-center justify-center mb-4">
              <FolderKanban className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">여론7부</h1>
            <p className="text-sm text-muted-foreground">업무 스케줄러</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                tab === 'login'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              로그인
            </button>
            <button
              onClick={() => setTab('signup')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                tab === 'signup'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              회원가입
            </button>
          </div>

          {/* Login Form */}
          {tab === 'login' && (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="이메일"
                  {...loginForm.register('email')}
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              {loginForm.formState.errors.email && (
                <p className="text-sm text-red-500">{loginForm.formState.errors.email.message}</p>
              )}

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="비밀번호"
                  {...loginForm.register('password')}
                  className="w-full pl-10 pr-10 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
              )}

              <button
                type="submit"
                disabled={loginForm.formState.isSubmitting}
                className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loginForm.formState.isSubmitting ? '로그인 중...' : '로그인'}
              </button>
            </form>
          )}

          {/* Signup Form */}
          {tab === 'signup' && (
            <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="이름"
                  {...signupForm.register('name')}
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              {signupForm.formState.errors.name && (
                <p className="text-sm text-red-500">{signupForm.formState.errors.name.message}</p>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="이메일"
                  {...signupForm.register('email')}
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              {signupForm.formState.errors.email && (
                <p className="text-sm text-red-500">{signupForm.formState.errors.email.message}</p>
              )}

              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <select
                  {...signupForm.register('position')}
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none bg-white"
                >
                  <option value="">직급 선택</option>
                  {positions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>
              {signupForm.formState.errors.position && (
                <p className="text-sm text-red-500">{signupForm.formState.errors.position.message}</p>
              )}

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="비밀번호"
                  {...signupForm.register('password')}
                  className="w-full pl-10 pr-10 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {signupForm.formState.errors.password && (
                <p className="text-sm text-red-500">{signupForm.formState.errors.password.message}</p>
              )}

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPasswordConfirm ? 'text' : 'password'}
                  placeholder="비밀번호 확인"
                  {...signupForm.register('passwordConfirm')}
                  className="w-full pl-10 pr-10 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswordConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {signupForm.formState.errors.passwordConfirm && (
                <p className="text-sm text-red-500">{signupForm.formState.errors.passwordConfirm.message}</p>
              )}

              <button
                type="submit"
                disabled={signupForm.formState.isSubmitting}
                className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {signupForm.formState.isSubmitting ? '회원가입 중...' : '회원가입'}
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
