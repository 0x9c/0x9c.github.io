import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string().nullish().transform((value) => value ?? ''),
    pubDate: z.coerce.date(),
    tags: z.array(z.string().trim().toLowerCase()).nullish().transform((value) => value ?? []),
    cover: z.string().optional().nullable(),
    andromedaCover: z.string().nullish(),
    coverAlt: z.string().optional().nullable(),
    gallery: z.array(z.string()).nullish().transform((value) => value ?? []),
    youtubeUrl: z.string().nullish(),
    audioUrl: z.string().nullish().transform((value) => value ?? ''),
    draft: z.boolean().default(false),
  }),
});

const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string().nullish().transform((value) => value ?? ''),
  }),
});

export const collections = { blog, pages };
