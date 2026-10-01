import { describe, it, expect } from 'vitest';
import { calculateProfileCompletion } from '@/features/student/utils/profile-completion';
import type { CompleteStudentProfile } from '@/features/student/types';

describe('Student Dashboard Foundation & Profile Completion Tests (TASK-006)', () => {
  const baseProfile: CompleteStudentProfile = {
    userId: 'student-uuid-1',
    fullName: 'David Miller',
    email: 'david@college.edu',
    phone: '+91 9123456780',
    avatarUrl: null,
    collegeName: 'National Institute of Technology',
    degree: 'B.Tech',
    rollNumber: '2021CS205',
    department: 'Computer Science and Engineering',
    batchYear: 2025,
    cgpa: 8.5,
    tenthPercentage: 90.0,
    twelfthPercentage: 88.0,
    activeBacklogs: 0,
    totalBacklogsCleared: 0,
    gender: 'male',
    linkedinUrl: null,
    githubUrl: null,
    portfolioUrl: null,
    isAcademicallyVerified: true,
    skills: [],
    projects: [],
    certifications: [],
    achievements: [],
  };

  describe('calculateProfileCompletion Calculation', () => {
    it('returns 0% and lists all sections incomplete for null or undefined profile', () => {
      const resNull = calculateProfileCompletion(null);
      expect(resNull.percentage).toBe(0);
      expect(resNull.completedCount).toBe(0);
      expect(resNull.incompleteSections).toHaveLength(6);
      expect(resNull.isReadyForPlacements).toBe(false);

      const resUndef = calculateProfileCompletion(undefined);
      expect(resUndef.percentage).toBe(0);
    });

    it('calculates partial completion with personal and academic fields only', () => {
      // Base profile has Personal (15%) + Academic (30%) = 45%
      const res = calculateProfileCompletion(baseProfile);
      expect(res.percentage).toBe(45);
      expect(res.completedCount).toBe(2);
      expect(res.isReadyForPlacements).toBe(false); // Skills are missing
    });

    it('calculates score with skills added', () => {
      const profileWithSkills: CompleteStudentProfile = {
        ...baseProfile,
        skills: [{ name: 'React', category: 'technical', proficiency: 'advanced' }],
      };

      // Personal (15%) + Academic (30%) + Skills (20%) = 65%
      const res = calculateProfileCompletion(profileWithSkills);
      expect(res.percentage).toBe(65);
      expect(res.completedCount).toBe(3);
      expect(res.isReadyForPlacements).toBe(true); // Has academic, skills, and >= 65%
    });

    it('calculates score with projects added', () => {
      const profileWithProjects: CompleteStudentProfile = {
        ...baseProfile,
        skills: [{ name: 'React', category: 'technical', proficiency: 'advanced' }],
        projects: [
          {
            title: 'Placement Portal',
            description: 'Automated campus recruitment portal.',
            technologies: ['Next.js', 'PostgreSQL'],
          },
        ],
      };

      // Personal (15%) + Academic (30%) + Skills (20%) + Projects (15%) = 80%
      const res = calculateProfileCompletion(profileWithProjects);
      expect(res.percentage).toBe(80);
      expect(res.completedCount).toBe(4);
    });

    it('calculates 100% when all profile sections are complete', () => {
      const fullProfile: CompleteStudentProfile = {
        ...baseProfile,
        avatarUrl: 'https://cdn.example.com/avatar.jpg',
        linkedinUrl: 'https://linkedin.com/in/davidmiller',
        githubUrl: 'https://github.com/davidmiller',
        skills: [{ name: 'React', category: 'technical', proficiency: 'advanced' }],
        projects: [
          {
            title: 'Placement Portal',
            description: 'Automated campus recruitment portal.',
            technologies: ['Next.js'],
          },
        ],
        certifications: [
          {
            name: 'AWS Cloud Practitioner',
            issuingOrganization: 'Amazon Web Services',
          },
        ],
        achievements: [
          {
            title: 'Hackathon Finalist',
            description: 'Top 10 finalist.',
          },
        ],
      };

      const res = calculateProfileCompletion(fullProfile);
      expect(res.percentage).toBe(100);
      expect(res.completedCount).toBe(6);
      expect(res.incompleteSections).toHaveLength(0);
      expect(res.isReadyForPlacements).toBe(true);
    });

    it('never hardcodes 100% for partially filled profile', () => {
      const emptyAcademics: CompleteStudentProfile = {
        ...baseProfile,
        rollNumber: '',
        cgpa: 0,
      };

      const res = calculateProfileCompletion(emptyAcademics);
      expect(res.percentage).toBe(15); // Only personal
      expect(res.isReadyForPlacements).toBe(false);
    });
  });
});
