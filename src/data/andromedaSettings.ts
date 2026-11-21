import site from './site.json';

// Pages CMS omits optional fields when the editor clears them.
interface SiteSettings {
  title: string;
  andromedaHandle?: string | null;
  andromedaAvatar?: string | null;
  andromedaBanner?: string | null;
  andromedaSidebarSide?: string | null;
  andromedaPostWidth?: string | number | null;
  andromedaFontSize?: number | null;
  andromedaFontFamily?: string | null;
  andromedaDetails?: { label?: string | null; value?: string | null; icon?: string | null }[] | null;
}

const settings: SiteSettings = site;
const width = Number(settings.andromedaPostWidth);
const fontFamily = settings.andromedaFontFamily ?? 'sans';
const fontStacks: Record<string, string> = {
  sans: 'Libre Franklin, Noto Sans KR, system-ui, sans-serif',
  serif: 'Georgia, serif',
  mono: 'monospace',
};

const detailIcons = [
  { label: '이름', name: 'user' },
  { label: '생일', name: 'balloon' },
  { label: '별자리', name: 'planet' },
  { label: '지역', name: 'pin' },
  { label: '대명사', name: 'heart' },
  { label: '관심사', name: 'music' },
] as const;
const details = (settings.andromedaDetails ?? []).flatMap((entry) => {
  const value = entry?.value?.trim();
  if (!value) return [];
  const label = entry.label?.trim() || '프로필 정보';
  const icon = detailIcons.find((item) => item.name === entry.icon)
    ?? detailIcons.find((item) => item.label === label);
  return [{ value, label, icon: icon?.name }];
});

export const andromeda = {
  handle: settings.andromedaHandle?.trim() || settings.title,
  avatar: settings.andromedaAvatar || '',
  banner: settings.andromedaBanner || '',
  sidebarRight: settings.andromedaSidebarSide === 'right',
  postWidth: [400, 450, 500, 540].includes(width) ? width : 540,
  fontSize: Math.min(24, Math.max(14, Number(settings.andromedaFontSize) || 16)),
  fontFamily: Object.hasOwn(fontStacks, fontFamily) ? fontStacks[fontFamily] : fontStacks.sans,
  details,
};
