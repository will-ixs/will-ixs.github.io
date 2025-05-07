import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
	loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		featured: z.boolean(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string(),
		heroVideo: z.boolean(),
		category: z.string(),
	}),
});

export const collections = { projects };
