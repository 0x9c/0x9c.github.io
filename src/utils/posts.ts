import { getCollection, type CollectionEntry } from 'astro:content';

export function getPostCover(post: CollectionEntry<'blog'>, theme: string) {
  return post.data.cover || (theme === 'andromeda' ? post.data.andromedaCover : undefined);
}

export async function getPublishedPosts(): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
