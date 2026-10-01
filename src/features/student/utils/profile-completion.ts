import type { CompleteStudentProfile } from '@/features/student/types';

export interface CompletionSection {
  id: string;
  label: string;
  completed: boolean;
  weight: number;
  description: string;
}

export interface ProfileCompletionResult {
  percentage: number;
  sections: CompletionSection[];
  completedCount: number;
  totalCount: number;
  incompleteSections: CompletionSection[];
  isReadyForPlacements: boolean;
}

/**
 * Calculates a student's profile completion percentage and section breakdown
 * based on actual, dynamic profile attributes.
 */
export function calculateProfileCompletion(
  profile: CompleteStudentProfile | null | undefined
): ProfileCompletionResult {
  if (!profile) {
    const emptySections: CompletionSection[] = [
      { id: 'personal', label: 'Personal Information', completed: false, weight: 15, description: 'Full name and contact details' },
      { id: 'academic', label: 'Academic Credentials', completed: false, weight: 30, description: 'College, branch, degree, roll number & CGPA' },
      { id: 'skills', label: 'Technical Skills', completed: false, weight: 20, description: 'Key skills and proficiencies' },
      { id: 'projects', label: 'Projects Portfolio', completed: false, weight: 15, description: 'Academic or personal technical projects' },
      { id: 'links', label: 'Professional Links', completed: false, weight: 10, description: 'GitHub, LinkedIn, or personal portfolio' },
      { id: 'photo', label: 'Profile Photo', completed: false, weight: 10, description: 'Professional avatar image' },
    ];
    return {
      percentage: 0,
      sections: emptySections,
      completedCount: 0,
      totalCount: emptySections.length,
      incompleteSections: emptySections,
      isReadyForPlacements: false,
    };
  }

  // 1. Personal & Contact (15%): Name and Phone
  const hasPersonal = Boolean(profile.fullName?.trim() && profile.phone?.trim());

  // 2. Academic Information (30%): Roll number, department, college, degree, batch, and valid CGPA > 0
  const hasAcademic = Boolean(
    profile.rollNumber?.trim() &&
    profile.department?.trim() &&
    profile.collegeName?.trim() &&
    profile.degree?.trim() &&
    profile.batchYear > 0 &&
    profile.cgpa > 0
  );

  // 3. Technical Skills (20%): At least 1 skill defined
  const hasSkills = Boolean(profile.skills && profile.skills.length > 0);

  // 4. Projects (15%): At least 1 project with title and description
  const hasProjects = Boolean(
    profile.projects &&
    profile.projects.some((p) => p.title?.trim().length > 0 && p.description?.trim().length > 0)
  );

  // 5. Professional Links (10%): At least one valid external link
  const hasLinks = Boolean(
    profile.linkedinUrl?.trim() ||
    profile.githubUrl?.trim() ||
    profile.portfolioUrl?.trim()
  );

  // 6. Profile Photo (10%): Avatar uploaded
  const hasPhoto = Boolean(profile.avatarUrl && profile.avatarUrl.trim().length > 0);

  const sections: CompletionSection[] = [
    {
      id: 'personal',
      label: 'Personal Information',
      completed: hasPersonal,
      weight: 15,
      description: hasPersonal ? 'Name and contact phone saved' : 'Add phone number and full name',
    },
    {
      id: 'academic',
      label: 'Academic Credentials',
      completed: hasAcademic,
      weight: 30,
      description: hasAcademic ? 'Degree, branch, roll number and CGPA recorded' : 'Fill college, branch, and CGPA',
    },
    {
      id: 'skills',
      label: 'Technical Skills',
      completed: hasSkills,
      weight: 20,
      description: hasSkills ? `${profile.skills.length} skills added` : 'Add your primary technical skills',
    },
    {
      id: 'projects',
      label: 'Projects Portfolio',
      completed: hasProjects,
      weight: 15,
      description: hasProjects ? `${profile.projects.length} project(s) showcase` : 'Add at least one technical project',
    },
    {
      id: 'links',
      label: 'Professional Links',
      completed: hasLinks,
      weight: 10,
      description: hasLinks ? 'Professional links attached' : 'Add LinkedIn, GitHub, or portfolio URL',
    },
    {
      id: 'photo',
      label: 'Profile Photo',
      completed: hasPhoto,
      weight: 10,
      description: hasPhoto ? 'Profile avatar uploaded' : 'Upload a profile photo',
    },
  ];

  const percentage = sections.reduce(
    (total, section) => (section.completed ? total + section.weight : total),
    0
  );

  const completedCount = sections.filter((s) => s.completed).length;
  const incompleteSections = sections.filter((s) => !s.completed);

  // Ready for placements when core academic + skills are present and percentage is at least 65%
  const isReadyForPlacements = hasAcademic && hasSkills && percentage >= 65;

  return {
    percentage,
    sections,
    completedCount,
    totalCount: sections.length,
    incompleteSections,
    isReadyForPlacements,
  };
}
