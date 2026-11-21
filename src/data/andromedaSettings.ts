import site from './site.json';

// Pages CMS omits optional fields when the editor clears them.
interface SiteSettings {
  title: string;
  andromedaHandle?: string | null;
  andromedaAvatar?: string | null;
  andromedaBanner?: string | null;
  andromedaSidebarLinks?: { label?: string | null; href?: string | null; text?: string | null }[] | null;
  andromedaSidebarSide?: string | null;
  andromedaPostWidth?: string | number | null;
  andromedaFontSize?: number | null;
  andromedaFontFamily?: string | null;
  andromedaDetails?: { label?: string | null; value?: string | null; icon?: string | null }[] | null;
}

const settings: SiteSettings = site;
const sidebarLinks = (settings.andromedaSidebarLinks ?? []).flatMap((entry) => {
  const label = entry?.label?.trim();
  const address = entry?.href?.trim();
  if (!label || !address) return [];
  const href = /^[^\s:@/]+@[^\s:@/]+\.[^\s:@/]+$/u.test(address) ? `mailto:${address}` : address;
  const url = URL.parse(href);
  if (!url || !['https:', 'mailto:'].includes(url.protocol)) return [];
  return [{ label, href: url.href, text: entry.text?.trim() || href.replace(/^mailto:/i, '') }];
});
const width = Number(settings.andromedaPostWidth);
const fontFamily = settings.andromedaFontFamily ?? 'sans';
const fontStacks: Record<string, string> = {
  sans: 'Libre Franklin, Noto Sans KR, system-ui, sans-serif',
  serif: 'Georgia, serif',
  mono: 'monospace',
};

const detailIcons = ['user', 'balloon', 'planet', 'pin', 'heart', 'music'] as const;
const details = (settings.andromedaDetails ?? []).flatMap((entry) => {
  const value = entry?.value?.trim();
  if (!value) return [];
  const icon = detailIcons.find((name) => name === entry.icon);
  return [{ value, label: entry.label?.trim() || '프로필 정보', icon }];
});

export const andromeda = {
  handle: settings.andromedaHandle?.trim() || settings.title,
  avatar: settings.andromedaAvatar || '',
  banner: settings.andromedaBanner || '',
  sidebarLinks,
  sidebarRight: settings.andromedaSidebarSide === 'right',
  postWidth: [400, 450, 500, 540].includes(width) ? width : 540,
  fontSize: Math.min(24, Math.max(14, Number(settings.andromedaFontSize) || 16)),
  fontFamily: Object.hasOwn(fontStacks, fontFamily) ? fontStacks[fontFamily] : fontStacks.sans,
  details,
};
