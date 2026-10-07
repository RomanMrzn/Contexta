import { z } from 'zod';

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(1, 'Name is required'),
  avatar_path: z.string().nullable().optional(),
  storage_quota_bytes: z.number().nonnegative(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const FileNodeSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid(),
  folder_id: z.string().uuid().nullable(),
  original_name: z.string().min(1),
  storage_path: z.string().min(1),
  mime_type: z.string(),
  extension: z.string(),
  size_bytes: z.number().nonnegative(),
  checksum_sha256: z.string().nullable().optional(),
  starred: z.boolean().default(false),
  status: z.enum(['pending', 'ready']),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable(),
  last_opened_at: z.string().datetime().nullable(),
});

export const FolderNodeSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid(),
  parent_id: z.string().uuid().nullable(),
  name: z.string().min(1).refine(val => !val.includes('/'), {
    message: 'Folder name cannot contain slashes',
  }),
  color: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type FileNode = z.infer<typeof FileNodeSchema>;
export type FolderNode = z.infer<typeof FolderNodeSchema>;
