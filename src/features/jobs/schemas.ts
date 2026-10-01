import { z } from 'zod';

export const jobStatusSchema = z.enum(['draft', 'published', 'closed', 'archived']);
export const employmentTypeSchema = z.enum(['full_time', 'internship', 'internship_to_full_time']);
export const workplaceTypeSchema = z.enum(['on_site', 'remote', 'hybrid']);

export const STANDARD_DEPARTMENTS = [
  'Computer Science and Engineering',
  'Information Technology',
  'Electronics and Communication',
  'Electrical and Electronics',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Biotechnology',
  'Data Science',
  'Artificial Intelligence',
] as const;

export const baseJobSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Job title must be at least 3 characters')
    .max(100, 'Job title cannot exceed 100 characters'),
  description: z
    .string()
    .trim()
    .min(20, 'Job description must be at least 20 characters')
    .max(5000, 'Job description cannot exceed 5,000 characters'),
  employmentType: employmentTypeSchema,
  department: z.string().trim().max(100).nullable().optional(),
  location: z
    .string()
    .trim()
    .min(2, 'Job location is required (min 2 characters)')
    .max(100, 'Location cannot exceed 100 characters'),
  workplaceType: workplaceTypeSchema,
  ctcMin: z
    .number()
    .min(0, 'Minimum CTC cannot be negative')
    .nullable()
    .optional(),
  ctcMax: z
    .number()
    .min(0, 'Maximum CTC cannot be negative')
    .nullable()
    .optional(),
  ctcDisplayText: z.string().trim().max(100).nullable().optional(),
  stipendMonthly: z
    .number()
    .min(0, 'Stipend cannot be negative')
    .nullable()
    .optional(),
  isSalaryDisclosed: z.boolean().default(true),
  degree: z
    .string()
    .trim()
    .min(2, 'Degree qualification is required')
    .max(100)
    .default('B.Tech / M.Tech / MCA'),
  minCgpa: z
    .number()
    .min(0.0, 'CGPA cannot be negative')
    .max(10.0, 'CGPA cannot exceed 10.00')
    .default(0.0),
  allowedDepartments: z
    .array(z.string().trim().min(1, 'Department name cannot be blank'))
    .default([]),
  maxActiveBacklogs: z
    .number()
    .int('Backlogs must be an integer')
    .min(0, 'Backlogs cannot be negative')
    .default(0),
  eligibleBatchYears: z
    .array(z.number().int().min(2020).max(2035))
    .default([]),
  requiredSkills: z
    .array(z.string().trim().min(1, 'Skill name cannot be blank'))
    .default([]),
  numberOfOpenings: z
    .number()
    .int('Number of openings must be an integer')
    .min(1, 'Number of openings must be at least 1')
    .nullable()
    .optional(),
  selectionProcess: z
    .string()
    .trim()
    .max(2000, 'Selection process cannot exceed 2,000 characters')
    .nullable()
    .optional(),
  applicationDeadline: z
    .string()
    .trim()
    .min(1, 'Application deadline is required')
    .refine(
      (val) => !isNaN(Date.parse(val)),
      'Invalid deadline timestamp'
    ),
  status: jobStatusSchema.default('draft'),
});

export const createJobSchema = baseJobSchema
  .refine(
    (data) => {
      if (
        data.ctcMin !== null &&
        data.ctcMin !== undefined &&
        data.ctcMax !== null &&
        data.ctcMax !== undefined
      ) {
        return data.ctcMax >= data.ctcMin;
      }
      return true;
    },
    {
      message: 'Maximum CTC must be greater than or equal to minimum CTC',
      path: ['ctcMax'],
    }
  )
  .refine(
    (data) => {
      if (data.status === 'published') {
        const deadline = new Date(data.applicationDeadline);
        return deadline.getTime() > Date.now();
      }
      return true;
    },
    {
      message: 'Published job application deadline must be in the future',
      path: ['applicationDeadline'],
    }
  );

export const updateJobSchema = baseJobSchema.partial().refine(
  (data) => {
    if (
      data.ctcMin !== null &&
      data.ctcMin !== undefined &&
      data.ctcMax !== null &&
      data.ctcMax !== undefined
    ) {
      return data.ctcMax >= data.ctcMin;
    }
    return true;
  },
  {
    message: 'Maximum CTC must be greater than or equal to minimum CTC',
    path: ['ctcMax'],
  }
);

export const updateJobStatusSchema = z.object({
  status: jobStatusSchema,
});
