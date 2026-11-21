import { andromeda } from '../data/andromedaSettings';

// Every page loads the same URL, even when its HTML is cached from a previous build.
export function GET() {
  const photo = andromeda.avatar.trim();
  const css = photo
    ? `.profile-avatar-face { background: url(${JSON.stringify(photo)}) center / cover no-repeat; color: transparent; }`
    : '';
  return new Response(css, { headers: { 'Content-Type': 'text/css; charset=utf-8' } });
}
