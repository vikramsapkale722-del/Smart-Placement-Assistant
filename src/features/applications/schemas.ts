import { z } from 'zod';

export const applicationStatusSchema = z.enum([
  'applied',
  'withdrawn',
  'shortlisted',
  'in_review',
  'offered',
  'rejected',
]);

export const submitApplicationSchema = z.object({
  jobId: z
    .string()
    .trim()
    .min(1, 'Job ID is required'),
  coverNote: z
    .string()
    .trim()
    .max(2000, 'Cover note cannot exceed 2,000 characters')
    .nullable()
    .optional(),
});

export type SubmitApplicationSchema = z.infer<typeof submitApplicationSchema>;

export const updateApplicationStatusSchema = z.object({
  applicationId: z.string().trim().min(1, 'Application ID is required'),
  newStatus: applicationStatusSchema,
  remarks: z
    .string()
    .trim()
    .max(500, 'Remarks cannot exceed 500 characters')
    .optional()
    .nullable(),
});

export type UpdateApplicationStatusSchema = z.infer<typeof updateApplicationStatusSchema>;
