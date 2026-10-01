import { z } from 'zod';

const optionalHttpUrl = z
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

const optionalEmail = z
  .string()
  .trim()
  .refine(
    (val) => {
      if (!val) return true;
      return z.string().email().safeParse(val).success;
    },
    { message: 'Must be a valid email address' }
  )
  .or(z.literal(''))
  .nullable()
  .optional();

export const companyProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Company name must be at least 2 characters')
    .max(120, 'Company name cannot exceed 120 characters'),
  industry: z
    .string()
    .trim()
    .min(2, 'Industry is required (e.g., Information Technology, Financial Services)')
    .max(100, 'Industry cannot exceed 100 characters'),
  description: z
    .string()
    .trim()
    .max(2000, 'Description cannot exceed 2000 characters')
    .or(z.literal(''))
    .nullable()
    .optional(),
  website: optionalHttpUrl,
  companyEmail: optionalEmail,
  companyPhone: z
    .string()
    .trim()
    .regex(/^[+]?[0-9\s-]{10,15}$/, 'Please enter a valid phone number (10-15 digits)')
    .or(z.literal(''))
    .nullable()
    .optional(),
  location: z
    .string()
    .trim()
    .max(150, 'Location cannot exceed 150 characters')
    .or(z.literal(''))
    .nullable()
    .optional(),
  companySize: z
    .string()
    .trim()
    .max(50, 'Company size cannot exceed 50 characters')
    .or(z.literal(''))
    .nullable()
    .optional(),
  foundedYear: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return null;
      const num = Number(val);
      return isNaN(num) ? val : num;
    },
    z
      .number()
      .int('Founded year must be an integer')
      .min(1800, 'Founded year must be 1800 or later')
      .max(2100, 'Founded year must be realistic (up to 2100)')
      .nullable()
      .optional()
  ),
  linkedinUrl: optionalHttpUrl,
  companyType: z
    .string()
    .trim()
    .max(50, 'Company type cannot exceed 50 characters')
    .or(z.literal(''))
    .nullable()
    .optional(),
  logoUrl: optionalHttpUrl,
});

export type CompanyProfileSchemaInput = z.infer<typeof companyProfileSchema>;

export const ALLOWED_LOGO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export interface LogoValidationResult {
  valid: boolean;
  error?: string;
}

export function validateCompanyLogo(file: { size: number; type: string }): LogoValidationResult {
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP images are permitted.',
    };
  }

  if (file.size > MAX_LOGO_SIZE_BYTES) {
    return {
      valid: false,
      error: 'File size exceeds 2 MB limit.',
    };
  }

  return { valid: true };
}
