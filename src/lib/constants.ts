export const CATEGORY_COLORS: Record<string, string> = {
  project: 'hsl(210, 70%, 50%)',
  company: 'hsl(30, 75%, 50%)',
  division: 'hsl(15, 70%, 50%)',
  headquarters: 'hsl(45, 70%, 50%)',
  department: 'hsl(330, 65%, 55%)',
  personal: 'hsl(280, 60%, 55%)',
  other: 'hsl(45, 10%, 55%)',
};

export const PROJECT_STATUS_COLORS: Record<string, string> = {
  waiting: 'hsl(45, 80%, 50%)',
  in_progress: 'hsl(142, 60%, 45%)',
  completed: 'hsl(0, 0%, 60%)',
};

export const CATEGORY_LABELS: Record<string, string> = {
  company: '회사',
  division: '부문',
  headquarters: '본부',
  department: '부서',
  personal: '개인',
  other: '기타',
};

export const SCHEDULE_TYPE_LABELS: Record<string, string> = {
  todo: '할일',
  vacation: '휴가',
  remote: '재택',
  client_meeting: '고객회의',
  internal_meeting: '내부회의',
  training: '교육',
  club: '동호회',
  other_type: '기타',
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  waiting: '예정',
  in_progress: '진행중',
  completed: '마감',
};

export const POSITION_ORDER: Record<string, number> = {
  '본부장': 0,
  '부서장': 1,
  '수석': 2,
  '책임': 3,
  '선임': 4,
  '프로': 5,
  '인턴': 6,
};

export const POSITION_COLORS: Record<string, string> = {
  '본부장': 'hsl(270,70%,89%)',
  '부서장': 'hsl(330,80%,89%)',
  '수석': 'hsl(330,80%,89%)',
  '책임': 'hsl(25,80%,89%)',
  '선임': 'hsl(25,80%,89%)',
  '프로': 'hsl(50,80%,89%)',
  '인턴': 'hsl(0,0%,98%)',
};

export const MEMO_COLORS: Record<string, { bg: string; header: string; border: string }> = {
  yellow: { bg: 'bg-yellow-50', header: 'bg-yellow-100', border: 'border-yellow-200' },
  pink: { bg: 'bg-pink-50', header: 'bg-pink-100', border: 'border-pink-200' },
  blue: { bg: 'bg-blue-50', header: 'bg-blue-100', border: 'border-blue-200' },
  green: { bg: 'bg-green-50', header: 'bg-green-100', border: 'border-green-200' },
  purple: { bg: 'bg-purple-50', header: 'bg-purple-100', border: 'border-purple-200' },
  orange: { bg: 'bg-orange-50', header: 'bg-orange-100', border: 'border-orange-200' },
};

export const FONT_OPTIONS = [
  { value: 'pretendard-medium', label: '프리텐다드 미디엄', family: 'Pretendard', weight: 500 },
  { value: 'pretendard-black', label: '프리텐다드 블랙', family: 'Pretendard', weight: 900 },
  { value: 'nanum-square-neo-bold', label: '나눔스퀘어 네오 볼드', family: 'NanumSquareNeo', weight: 700 },
  { value: 'paperlogy-5-medium', label: '페이퍼로지 미디엄', family: 'Paperlogy', weight: 500 },
];

export const FONT_SIZE_OPTIONS = [
  { value: 'small', label: '소', class: 'text-base' },
  { value: 'medium', label: '중', class: 'text-lg' },
  { value: 'large', label: '대', class: 'text-xl' },
];

export const FONT_COLOR_OPTIONS = [
  { value: 'black', label: '검정', hex: '#1a1a1a' },
  { value: 'gray', label: '회색', hex: '#6b7280' },
  { value: 'red', label: '빨강', hex: '#dc2626' },
  { value: 'blue', label: '파랑', hex: '#2563eb' },
  { value: 'green', label: '초록', hex: '#16a34a' },
  { value: 'purple', label: '보라', hex: '#9333ea' },
  { value: 'orange', label: '주황', hex: '#ea580c' },
  { value: 'brown', label: '갈색', hex: '#92400e' },
];
