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
] as const;

export type ThemeId = (typeof themes)[number]['id'];

export function findTheme(id: unknown) {
  return themes.find((theme) => theme.id === id) ?? themes[0];
}
