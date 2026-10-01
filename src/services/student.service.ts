import { createServerSupabaseClient } from '@/lib/supabase/server';
import type {
  CompleteStudentProfile,
  StudentSkillInput,
  StudentProjectInput,
  StudentCertificationInput,
  StudentAchievementInput,
  StudentProfileRow,
} from '@/features/student/types';
import {
  studentProfileSchema,
  validateProfilePhoto,
} from '@/features/student/schemas';

// In-memory fallback cache for development/testing when Supabase backend is disconnected
const mockProfileStore = new Map<string, CompleteStudentProfile>();

export interface ProfileServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface UserRowRecord {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
}

/**
 * Student Profile Service
 * Authoritative data access layer for student personal, academic, and portfolio records.
 */
export const studentService = {
  /**
   * Retrieves the full profile record for a student by userId.
   */
  async getProfile(userId: string): Promise<CompleteStudentProfile | null> {
    if (!userId) return null;

    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return mockProfileStore.get(userId) || null;
    }

    try {
      // 1. Fetch User Record
      const userQuery = await (supabase as any)
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const userData = userQuery.data as UserRowRecord | null;

      if (userQuery.error || !userData) {
        return mockProfileStore.get(userId) || null;
      }

      // 2. Fetch Student Profile Record
      const profileQuery = await (supabase as any)
        .from('student_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const profileData = profileQuery.data as StudentProfileRow | null;

      if (profileQuery.error || !profileData) {
        // Return baseline profile from user table with default academic values
        return {
          userId: userData.id,
          fullName: userData.full_name,
          email: userData.email,
          phone: userData.phone,
          avatarUrl: userData.avatar_url,
          collegeName: 'Engineering & Technology College',
          degree: 'B.Tech',
          rollNumber: '',
          department: '',
          batchYear: new Date().getFullYear(),
          cgpa: 0,
          tenthPercentage: null,
          twelfthPercentage: null,
          activeBacklogs: 0,
          totalBacklogsCleared: 0,
          gender: null,
          linkedinUrl: null,
          githubUrl: null,
          portfolioUrl: null,
          isAcademicallyVerified: false,
          skills: [],
          projects: [],
          certifications: [],
          achievements: [],
        };
      }

      // 3. Fetch Relational Collections in parallel
      const [skillsRes, projectsRes, certsRes, achieveRes] = await Promise.all([
        (supabase as any).from('student_skills').select('*').eq('student_id', profileData.id),
        (supabase as any).from('student_projects').select('*').eq('student_id', profileData.id),
        (supabase as any).from('student_certifications').select('*').eq('student_id', profileData.id),
        (supabase as any).from('student_achievements').select('*').eq('student_id', profileData.id),
      ]);

      const skills: StudentSkillInput[] = (skillsRes.data || []).map((s: any) => ({
        name: s.name,
        category: (s.category as StudentSkillInput['category']) || 'technical',
        proficiency: (s.proficiency as StudentSkillInput['proficiency']) || 'intermediate',
      }));

      const projects: StudentProjectInput[] = (projectsRes.data || []).map((p: any) => ({
        title: p.title,
        description: p.description,
        technologies: p.technologies || [],
        projectUrl: p.project_url || null,
      }));

      const certifications: StudentCertificationInput[] = (certsRes.data || []).map((c: any) => ({
        name: c.name,
        issuingOrganization: c.issuing_organization,
        issueDate: c.issue_date || null,
        credentialUrl: c.credential_url || null,
      }));

      const achievements: StudentAchievementInput[] = (achieveRes.data || []).map((a: any) => ({
        title: a.title,
        description: a.description,
        date: a.date || null,
      }));

      const completeProfile: CompleteStudentProfile = {
        userId: userData.id,
        fullName: userData.full_name,
        email: userData.email,
        phone: userData.phone,
        avatarUrl: userData.avatar_url,
        profileId: profileData.id,
        collegeName: profileData.college_name,
        degree: profileData.degree,
        rollNumber: profileData.roll_number,
        department: profileData.department,
        batchYear: profileData.batch_year,
        cgpa: Number(profileData.cgpa),
        tenthPercentage: profileData.tenth_percentage ? Number(profileData.tenth_percentage) : null,
        twelfthPercentage: profileData.twelfth_percentage ? Number(profileData.twelfth_percentage) : null,
        activeBacklogs: profileData.active_backlogs,
        totalBacklogsCleared: profileData.total_backlogs_cleared,
        gender: profileData.gender,
        linkedinUrl: profileData.linkedin_url,
        githubUrl: profileData.github_url,
        portfolioUrl: profileData.portfolio_url,
        isAcademicallyVerified: profileData.is_academically_verified,
        skills,
        projects,
        certifications,
        achievements,
      };

      return completeProfile;
    } catch {
      return mockProfileStore.get(userId) || null;
    }
  },

  /**
   * Upserts the complete student profile (personal, academic, and sub-collections).
   */
  async upsertProfile(
    userId: string,
    email: string,
    rawInput: unknown
  ): Promise<ProfileServiceResult<CompleteStudentProfile>> {
    // 1. Strict Schema Validation
    const validation = studentProfileSchema.safeParse(rawInput);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Invalid profile information';
      return { success: false, error: firstError };
    }

    const input = validation.data;
    const supabase = createServerSupabaseClient();

    // In-memory fallback if backend is unconfigured
    if (!supabase) {
      const fallbackProfile: CompleteStudentProfile = {
        userId,
        email,
        fullName: input.fullName,
        phone: input.phone || null,
        avatarUrl: input.avatarUrl || null,
        profileId: `mock-profile-${userId}`,
        collegeName: input.collegeName,
        degree: input.degree,
        rollNumber: input.rollNumber,
        department: input.department,
        batchYear: input.batchYear,
        cgpa: input.cgpa,
        tenthPercentage: input.tenthPercentage ?? null,
        twelfthPercentage: input.twelfthPercentage ?? null,
        activeBacklogs: input.activeBacklogs,
        totalBacklogsCleared: input.totalBacklogsCleared,
        gender: input.gender ?? null,
        linkedinUrl: input.linkedinUrl ?? null,
        githubUrl: input.githubUrl ?? null,
        portfolioUrl: input.portfolioUrl ?? null,
        isAcademicallyVerified: false,
        skills: input.skills,
        projects: input.projects,
        certifications: input.certifications,
        achievements: input.achievements,
      };

      mockProfileStore.set(userId, fallbackProfile);
      return { success: true, data: fallbackProfile };
    }

    try {
      // 2. Update public.users table (Full Name & Phone)
      await (supabase as any)
        .from('users')
        .update({
          full_name: input.fullName,
          phone: input.phone || null,
          avatar_url: input.avatarUrl || null,
        })
        .eq('id', userId);

      // 3. Upsert student_profiles table
      const profileUpsert = await (supabase as any)
        .from('student_profiles')
        .upsert(
          {
            user_id: userId,
            college_name: input.collegeName,
            degree: input.degree,
            roll_number: input.rollNumber,
            department: input.department,
            batch_year: input.batchYear,
            cgpa: input.cgpa,
            tenth_percentage: input.tenthPercentage ?? null,
            twelfth_percentage: input.twelfthPercentage ?? null,
            active_backlogs: input.activeBacklogs,
            total_backlogs_cleared: input.totalBacklogsCleared,
            gender: input.gender ?? null,
            linkedin_url: input.linkedinUrl ?? null,
            github_url: input.githubUrl ?? null,
            portfolio_url: input.portfolioUrl ?? null,
          },
          { onConflict: 'user_id' }
        )
        .select('id')
        .single();

      if (profileUpsert.error || !profileUpsert.data) {
        return { success: false, error: profileUpsert.error?.message || 'Failed to save student profile' };
      }

      const profileId = profileUpsert.data.id;

      // 4. Synchronize Sub-collections (Skills, Projects, Certs, Achievements)
      await Promise.all([
        (supabase as any).from('student_skills').delete().eq('student_id', profileId),
        (supabase as any).from('student_projects').delete().eq('student_id', profileId),
        (supabase as any).from('student_certifications').delete().eq('student_id', profileId),
        (supabase as any).from('student_achievements').delete().eq('student_id', profileId),
      ]);

      if (input.skills.length > 0) {
        await (supabase as any).from('student_skills').insert(
          input.skills.map((s) => ({
            student_id: profileId,
            name: s.name,
            category: s.category || 'technical',
            proficiency: s.proficiency || 'intermediate',
          }))
        );
      }

      if (input.projects.length > 0) {
        await (supabase as any).from('student_projects').insert(
          input.projects.map((p) => ({
            student_id: profileId,
            title: p.title,
            description: p.description,
            technologies: p.technologies,
            project_url: p.projectUrl || null,
          }))
        );
      }

      if (input.certifications.length > 0) {
        await (supabase as any).from('student_certifications').insert(
          input.certifications.map((c) => ({
            student_id: profileId,
            name: c.name,
            issuing_organization: c.issuingOrganization,
            issue_date: c.issueDate || null,
            credential_url: c.credentialUrl || null,
          }))
        );
      }

      if (input.achievements.length > 0) {
        await (supabase as any).from('student_achievements').insert(
          input.achievements.map((a) => ({
            student_id: profileId,
            title: a.title,
            description: a.description,
            date: a.date || null,
          }))
        );
      }

      const updatedProfile = await this.getProfile(userId);
      return { success: true, data: updatedProfile || undefined };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected database error occurred';
      return { success: false, error: message };
    }
  },

  /**
   * Uploads and links a profile photo for the authenticated student.
   */
  async uploadProfilePhoto(
    userId: string,
    file: { size: number; type: string; buffer: ArrayBuffer; name: string }
  ): Promise<ProfileServiceResult<string>> {
    const validation = validateProfilePhoto({ size: file.size, type: file.type });
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const supabase = createServerSupabaseClient();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${userId}/avatar-${Date.now()}.${ext}`;

    if (!supabase) {
      // Mock photo URL for dev/test environments
      const mockUrl = `/uploads/mock-avatar-${userId}.${ext}`;
      const existing = mockProfileStore.get(userId);
      if (existing) {
        mockProfileStore.set(userId, { ...existing, avatarUrl: mockUrl });
      }
      return { success: true, data: mockUrl };
    }

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file.buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        return { success: false, error: uploadError.message };
      }

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = publicUrlData.publicUrl;

      // Update user record with new avatar URL
      await (supabase as any).from('users').update({ avatar_url: avatarUrl }).eq('id', userId);

      return { success: true, data: avatarUrl };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Photo upload failed';
      return { success: false, error: msg };
    }
  },
};
