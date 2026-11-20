export const themes = [
  {
    id: 'garden',
    name: '그린 저널',
    description: '부드러운 초록색과 원형 그래픽이 어우러진 기본 디자인입니다.',
    color: '#f8faf9',
  },
  {
    id: 'paper',
    name: '클래식 페이퍼',
    description: '여백과 활자를 강조한 밝고 단정한 디자인입니다.',
    color: '#ffffff',
  },
  {
    id: 'night',
    name: '미드나이트',
    description: '짙은 남색 배경과 선명한 청록색이 어우러진 디자인입니다.',
    color: '#101923',
  },
  {
    id: 'astro-blog',
    name: 'Astro 공식 블로그',
    description: 'Astro 공식 블로그 스타터를 현재 글과 메뉴에 맞춰 적용한 테마입니다.',
    color: '#ffffff',
  },
  {
    id: 'astro-paper',
    name: 'AstroPaper',
    description: '글의 가독성에 집중한 간결한 Astro 블로그 테마입니다.',
    color: '#fdfdfd',
  },
  {
    id: 'andromeda',
    name: '안드로메다',
    description: '어두운 피드와 프로필 카드, 슬라이드 메뉴가 있는 테마입니다.',
    color: '#121317',
  },
] as const;

export type ThemeId = (typeof themes)[number]['id'];

export function findTheme(id: unknown) {
  return themes.find((theme) => theme.id === id) ?? themes[0];
}
