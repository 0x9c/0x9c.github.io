import { getCollection, type CollectionEntry } from 'astro:content';

export const postTopics = ['Computer', 'Sound', 'Photo'] as const;
export type PostTopic = (typeof postTopics)[number];

export function getPostCover(post: CollectionEntry<'blog'>, theme: string) {
  return post.data.cover || (theme === 'andromeda' ? post.data.andromedaCover : undefined);
}

export async function getPublishedPosts(topic?: PostTopic): Promise<CollectionEntry<'blog'>[]> {
  const tag = topic?.toLowerCase();
  const posts = await getCollection('blog', ({ data }) => !data.draft && (!tag || data.tags.includes(tag)));
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
