import { describe, it, expect } from 'vitest';
import {
  studentProfileSchema,
  studentSkillSchema,
  studentProjectSchema,
  studentCertificationSchema,
  studentAchievementSchema,
  validateProfilePhoto,
} from '@/features/student/schemas';
import { studentService } from '@/services/student.service';

describe('Student Profile Validation & Service Tests (TASK-005)', () => {
  const validProfileData = {
    fullName: 'Jane Doe',
    phone: '+91 9876543210',
    avatarUrl: 'https://example.com/avatar.jpg',
    collegeName: 'National Institute of Technology',
    degree: 'B.Tech',
    rollNumber: '2021CS101',
    department: 'Computer Science and Engineering',
    batchYear: 2025,
    cgpa: 8.92,
    tenthPercentage: 94.5,
    twelfthPercentage: 91.2,
    activeBacklogs: 0,
    totalBacklogsCleared: 0,
    gender: 'female' as const,
    linkedinUrl: 'https://linkedin.com/in/janedoe',
    githubUrl: 'https://github.com/janedoe',
    portfolioUrl: 'https://janedoe.dev',
    skills: [
      { name: 'TypeScript', category: 'technical' as const, proficiency: 'advanced' as const },
      { name: 'PostgreSQL', category: 'technical' as const, proficiency: 'intermediate' as const },
    ],
    projects: [
      {
        title: 'Smart Placement Assistant',
        description: 'Next.js App Router campus hiring portal.',
        technologies: ['Next.js', 'TypeScript', 'Supabase'],
        projectUrl: 'https://github.com/janedoe/portal',
      },
    ],
    certifications: [
      {
        name: 'AWS Solutions Architect Associate',
        issuingOrganization: 'Amazon Web Services',
        issueDate: '2024-05-15',
        credentialUrl: 'https://aws.amazon.com/verify/12345',
      },
    ],
    achievements: [
      {
        title: '1st Place University Hackathon',
        description: 'Developed an automated code assessment pipeline.',
        date: '2023-11-20',
      },
    ],
  };

  describe('studentProfileSchema Validation', () => {
    it('accepts a fully compliant student profile input', () => {
      const res = studentProfileSchema.safeParse(validProfileData);
      expect(res.success).toBe(true);
    });

    it('SCENARIO 10: rejects CGPA out of bounds (< 0.0 or > 10.0)', () => {
      const underflow = studentProfileSchema.safeParse({ ...validProfileData, cgpa: -1.0 });
      expect(underflow.success).toBe(false);

      const overflow = studentProfileSchema.safeParse({ ...validProfileData, cgpa: 10.5 });
      expect(overflow.success).toBe(false);
      if (!overflow.success) {
        expect(overflow.error.issues.some((i) => i.message.includes('CGPA cannot exceed 10.0'))).toBe(
          true
        );
      }
    });

    it('SCENARIO 9: rejects invalid URLs for professional links', () => {
      const invalidLinkedin = studentProfileSchema.safeParse({
        ...validProfileData,
        linkedinUrl: 'not-a-url',
      });
      expect(invalidLinkedin.success).toBe(false);

      const invalidGithub = studentProfileSchema.safeParse({
        ...validProfileData,
        githubUrl: 'invalid-link',
      });
      expect(invalidGithub.success).toBe(false);

      const invalidPortfolio = studentProfileSchema.safeParse({
        ...validProfileData,
        portfolioUrl: 'htp:/broken',
      });
      expect(invalidPortfolio.success).toBe(false);
    });

    it('SCENARIO 8: rejects missing required academic fields', () => {
      const missingRoll = studentProfileSchema.safeParse({
        ...validProfileData,
        rollNumber: '',
      });
      expect(missingRoll.success).toBe(false);

      const missingDept = studentProfileSchema.safeParse({
        ...validProfileData,
        department: '',
      });
      expect(missingDept.success).toBe(false);

      const missingCollege = studentProfileSchema.safeParse({
        ...validProfileData,
        collegeName: '',
      });
      expect(missingCollege.success).toBe(false);
    });

    it('rejects invalid phone number formats', () => {
      const invalidPhone = studentProfileSchema.safeParse({
        ...validProfileData,
        phone: '123',
      });
      expect(invalidPhone.success).toBe(false);
      if (!invalidPhone.success) {
        expect(invalidPhone.error.issues.some((i) => i.message.includes('valid phone number'))).toBe(
          true
        );
      }
    });
  });

  describe('Sub-collection Schemas', () => {
    it('validates student skill schema', () => {
      expect(
        studentSkillSchema.safeParse({
          name: 'React',
          category: 'technical',
          proficiency: 'expert',
        }).success
      ).toBe(true);

      expect(
        studentSkillSchema.safeParse({
          name: '',
        }).success
      ).toBe(false);
    });

    it('validates student project schema', () => {
      expect(
        studentProjectSchema.safeParse({
          title: 'Algorithmic Trading Bot',
          description: 'Python backtesting engine using statistical arbitrage.',
          technologies: ['Python', 'Pandas'],
          projectUrl: 'https://github.com/example/bot',
        }).success
      ).toBe(true);

      expect(
        studentProjectSchema.safeParse({
          title: 'A',
          description: 'Too short',
        }).success
      ).toBe(false);
    });

    it('validates student certification schema', () => {
      expect(
        studentCertificationSchema.safeParse({
          name: 'Certified Kubernetes Administrator',
          issuingOrganization: 'Linux Foundation',
          issueDate: '2024-01-10',
          credentialUrl: 'https://cncf.io/verify',
        }).success
      ).toBe(true);
    });

    it('validates student achievement schema', () => {
      expect(
        studentAchievementSchema.safeParse({
          title: 'ACM ICPC Regionalist',
          description: 'Ranked top 15 in Amritapuri regional contest.',
          date: '2023-12-15',
        }).success
      ).toBe(true);
    });
  });

  describe('SCENARIO 11: validateProfilePhoto', () => {
    it('accepts valid JPEG, PNG, or WEBP under 2MB', () => {
      expect(validateProfilePhoto({ size: 1024 * 500, type: 'image/jpeg' }).valid).toBe(true);
      expect(validateProfilePhoto({ size: 1024 * 1024, type: 'image/png' }).valid).toBe(true);
      expect(validateProfilePhoto({ size: 1024 * 1500, type: 'image/webp' }).valid).toBe(true);
    });

    it('rejects files exceeding 2MB limit', () => {
      const res = validateProfilePhoto({ size: 3 * 1024 * 1024, type: 'image/jpeg' });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('exceeds maximum allowed limit of 2MB');
    });

    it('rejects non-image file types', () => {
      const pdfRes = validateProfilePhoto({ size: 50000, type: 'application/pdf' });
      expect(pdfRes.valid).toBe(false);
      expect(pdfRes.error).toContain('Invalid file type');

      const exeRes = validateProfilePhoto({ size: 50000, type: 'application/octet-stream' });
      expect(exeRes.valid).toBe(false);
    });
  });

  describe('studentService Data Operations', () => {
    const testUserId = 'test-student-uuid-42';
    const testEmail = 'candidate@university.edu';

    it('SCENARIO 1 & 3: student can create and update profile', async () => {
      const result = await studentService.upsertProfile(testUserId, testEmail, validProfileData);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.fullName).toBe('Jane Doe');
      expect(result.data?.collegeName).toBe('National Institute of Technology');
      expect(result.data?.cgpa).toBe(8.92);
      expect(result.data?.skills).toHaveLength(2);
      expect(result.data?.projects).toHaveLength(1);
    });

    it('SCENARIO 2: student can retrieve own profile', async () => {
      const profile = await studentService.getProfile(testUserId);
      expect(profile).toBeDefined();
      expect(profile?.userId).toBe(testUserId);
      expect(profile?.rollNumber).toBe('2021CS101');
      expect(profile?.department).toBe('Computer Science and Engineering');
    });

    it('SCENARIO 8: service rejects invalid profile payload with useful error', async () => {
      const invalidData = { ...validProfileData, cgpa: 99.9 };
      const result = await studentService.upsertProfile(testUserId, testEmail, invalidData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('CGPA cannot exceed 10.0');
    });

    it('SCENARIO 11: uploadProfilePhoto processes and updates student photo', async () => {
      const mockBuffer = new ArrayBuffer(1024);
      const photoResult = await studentService.uploadProfilePhoto(testUserId, {
        name: 'avatar.png',
        size: 1024,
        type: 'image/png',
        buffer: mockBuffer,
      });

      expect(photoResult.success).toBe(true);
      expect(photoResult.data).toBeDefined();

      const profile = await studentService.getProfile(testUserId);
      expect(profile?.avatarUrl).toBe(photoResult.data);
    });
  });
});
