import { z } from 'zod';

const optionalUrl = z
  .string()
  .trim()
  .refine(
    (val) => {
      if (!val) return true;
      try {
        const parsed = new URL(val);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'Must be a valid HTTP or HTTPS URL (e.g., https://example.com)' }
  )
  .or(z.literal(''))
  .nullable()
  .optional();

export const studentSkillSchema = z.object({
  name: z.string().trim().min(1, 'Skill name is required').max(50, 'Skill name too long'),
  category: z
    .enum(['technical', 'soft', 'tool', 'language', 'other'])
    .default('technical'),
  proficiency: z
    .enum(['beginner', 'intermediate', 'advanced', 'expert'])
    .default('intermediate'),
});

export const studentProjectSchema = z.object({
  title: z.string().trim().min(2, 'Project title is required').max(100, 'Title too long'),
  description: z.string().trim().min(5, 'Please provide a brief description').max(1000, 'Description too long'),
  technologies: z.array(z.string().trim().min(1)).default([]),
  projectUrl: optionalUrl,
});

export const studentCertificationSchema = z.object({
  name: z.string().trim().min(2, 'Certification name is required').max(100, 'Name too long'),
  issuingOrganization: z.string().trim().min(2, 'Issuing organization is required').max(100, 'Organization too long'),
  issueDate: z.string().trim().or(z.literal('')).nullable().optional(),
  credentialUrl: optionalUrl,
});

export const studentAchievementSchema = z.object({
  title: z.string().trim().min(2, 'Achievement title is required').max(150, 'Title too long'),
  description: z.string().trim().min(5, 'Please provide a brief description').max(1000, 'Description too long'),
  date: z.string().trim().or(z.literal('')).nullable().optional(),
});

export const studentProfileSchema = z.object({
  // Personal Info
  fullName: z
    .string()
    .trim()
    .min(2, 'Full Name must be at least 2 characters')
    .max(100, 'Full Name cannot exceed 100 characters'),
  phone: z
    .string()
    .trim()
    .regex(/^[+]?[0-9\s-]{10,15}$/, 'Please enter a valid phone number (10-15 digits)')
    .or(z.literal(''))
    .nullable()
    .optional(),
  avatarUrl: optionalUrl,

  // Academic Info
  collegeName: z
    .string()
    .trim()
    .min(2, 'College Name is required')
    .max(150, 'College Name cannot exceed 150 characters'),
  degree: z
    .string()
    .trim()
    .min(2, 'Degree is required (e.g. B.Tech, MCA)')
    .max(50, 'Degree name cannot exceed 50 characters'),
  rollNumber: z
    .string()
    .trim()
    .min(2, 'University / College Roll Number is required')
    .max(50, 'Roll Number cannot exceed 50 characters'),
  department: z
    .string()
    .trim()
    .min(2, 'Department / Branch is required')
    .max(100, 'Department cannot exceed 100 characters'),
  batchYear: z.coerce
    .number()
    .int('Graduation year must be an integer')
    .min(2000, 'Graduation year must be 2000 or later')
    .max(2100, 'Graduation year must be valid'),
  cgpa: z.coerce
    .number()
    .min(0.0, 'CGPA cannot be negative')
    .max(10.0, 'CGPA cannot exceed 10.0'),
  tenthPercentage: z.coerce
    .number()
    .min(0.0, '10th percentage cannot be negative')
    .max(100.0, '10th percentage cannot exceed 100.0')
    .nullable()
    .optional(),
  twelfthPercentage: z.coerce
    .number()
    .min(0.0, '12th percentage cannot be negative')
    .max(100.0, '12th percentage cannot exceed 100.0')
    .nullable()
    .optional(),
  activeBacklogs: z.coerce
    .number()
    .int('Active backlogs must be a whole number')
    .min(0, 'Active backlogs cannot be negative')
    .default(0),
  totalBacklogsCleared: z.coerce
    .number()
    .int('Backlogs cleared must be a whole number')
    .min(0, 'Cleared backlogs cannot be negative')
    .default(0),
  gender: z
    .enum(['male', 'female', 'other', 'prefer_not_to_say'])
    .nullable()
    .optional(),

  // Professional Links
  linkedinUrl: optionalUrl,
  githubUrl: optionalUrl,
  portfolioUrl: optionalUrl,

  // Collections
  skills: z.array(studentSkillSchema).default([]),
  projects: z.array(studentProjectSchema).default([]),
  certifications: z.array(studentCertificationSchema).default([]),
  achievements: z.array(studentAchievementSchema).default([]),
});

export type StudentProfileInput = z.infer<typeof studentProfileSchema>;

// Profile Photo Security Constraints
export const MAX_PROFILE_PHOTO_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
export const ALLOWED_PHOTO_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function validateProfilePhoto(file: { size: number; type: string }): { valid: boolean; error?: string } {
  if (file.size > MAX_PROFILE_PHOTO_SIZE_BYTES) {
    return { valid: false, error: 'Photo size exceeds maximum allowed limit of 2MB' };
  }
  if (!ALLOWED_PHOTO_MIME_TYPES.includes(file.type.toLowerCase())) {
    return { valid: false, error: 'Invalid file type. Allowed formats: JPEG, PNG, WEBP' };
  }
  return { valid: true };
}
