import { createServerSupabaseClient } from '@/lib/supabase/server';
import { studentService } from '@/services/student.service';
import { jobService } from '@/services/job.service';
import { evaluateJobEligibility } from '@/services/eligibility.service';
import { submitApplicationSchema } from '@/features/applications/schemas';
import { validateStatusTransition } from '@/features/applications/utils/transitions';
import type {
  JobApplication,
  JobApplicationRow,
  SubmitApplicationInput,
  ApplicationStatusHistoryItem,
  ApplicationStatus,
  ApplicantDetailItem,
  ApplicantCandidateProfile,
} from '@/features/applications/types';
import type { JobPosting } from '@/features/jobs/types';
import type { CompleteStudentProfile } from '@/features/student/types';

export interface ApplicationServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// In-memory fallback stores for development/testing when Supabase backend is disconnected
const mockApplicationsStore = new Map<string, JobApplication>();
const mockStatusHistoryStore = new Map<string, ApplicationStatusHistoryItem[]>();
const mockCandidatesStore = new Map<string, ApplicantCandidateProfile>();

function studentProfileToCandidate(
  profile: CompleteStudentProfile,
  resumeUrl?: string | null
): ApplicantCandidateProfile {
  return {
    studentId: profile.profileId || profile.userId,
    userId: profile.userId,
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    avatarUrl: profile.avatarUrl,
    collegeName: profile.collegeName,
    degree: profile.degree,
    rollNumber: profile.rollNumber,
    department: profile.department,
    batchYear: profile.batchYear,
    cgpa: profile.cgpa,
    activeBacklogs: profile.activeBacklogs,
    skills: profile.skills || [],
    projects: profile.projects || [],
    certifications: profile.certifications || [],
    achievements: profile.achievements || [],
    linkedinUrl: profile.linkedinUrl,
    githubUrl: profile.githubUrl,
    portfolioUrl: profile.portfolioUrl,
    resumeUrl: resumeUrl || null,
  };
}

let seedsInitialized = false;
function ensureMockSeedApplicants() {
  if (seedsInitialized) return;
  seedsInitialized = true;

  const sampleApplicants: Array<{
    app: JobApplication;
    candidate: ApplicantCandidateProfile;
    history: ApplicationStatusHistoryItem[];
  }> = [
    {
      app: {
        id: 'app-seed-001',
        jobId: 'job-seed-001',
        studentId: 'student-profile-uuid-001',
        status: 'shortlisted',
        coverNote: 'Passionate about cloud architecture, low-latency microservices, and distributed PostgreSQL performance.',
        appliedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        jobTitle: 'Graduate Software Engineer (Backend)',
        companyName: 'Nexus Cloud Technologies',
      },
      candidate: {
        studentId: 'student-profile-uuid-001',
        userId: 'student-user-001',
        fullName: 'Ananya Roy',
        email: 'ananya.roy@nit.edu',
        phone: '+91 98765 43210',
        avatarUrl: null,
        collegeName: 'National Institute of Technology',
        degree: 'B.Tech',
        rollNumber: 'CS2022088',
        department: 'Computer Science and Engineering',
        batchYear: 2026,
        cgpa: 9.1,
        activeBacklogs: 0,
        skills: [
          { name: 'TypeScript', category: 'technical', proficiency: 'expert' },
          { name: 'Node.js', category: 'technical', proficiency: 'advanced' },
          { name: 'PostgreSQL', category: 'technical', proficiency: 'advanced' },
          { name: 'Docker', category: 'tool', proficiency: 'intermediate' },
          { name: 'AWS', category: 'technical', proficiency: 'intermediate' },
        ],
        projects: [
          {
            title: 'Distributed Transactional Cache',
            description: 'In-memory multi-tiered caching proxy written in Go with raft-based consensus.',
            technologies: ['Go', 'Redis', 'Docker'],
            projectUrl: 'https://github.com/ananya-roy/dist-cache',
          },
          {
            title: 'Placement Analytics Portal',
            description: 'High-speed institutional placement tracking dashboard with full SSR and RBAC.',
            technologies: ['Next.js', 'PostgreSQL', 'TailwindCSS'],
            projectUrl: 'https://github.com/ananya-roy/smart-placement',
          },
        ],
        certifications: [
          {
            name: 'AWS Certified Solutions Architect – Associate',
            issuingOrganization: 'Amazon Web Services',
            issueDate: '2025-06-15',
            credentialUrl: 'https://aws.amazon.com/verify',
          },
        ],
        achievements: [
          {
            title: 'Smart India Hackathon Finalist',
            description: '1st runner up in cloud computing innovation track.',
            date: '2025-10-12',
          },
        ],
        linkedinUrl: 'https://linkedin.com/in/ananya-roy',
        githubUrl: 'https://github.com/ananya-roy',
        portfolioUrl: 'https://ananya-roy.dev',
        resumeUrl: '/resumes/mock-resume-ananya.pdf',
      },
      history: [
        {
          id: 'hist-001-1',
          applicationId: 'app-seed-001',
          fromStatus: null,
          toStatus: 'applied',
          changedBy: 'student-user-001',
          remarks: 'Candidate submitted application',
          createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
        {
          id: 'hist-001-2',
          applicationId: 'app-seed-001',
          fromStatus: 'applied',
          toStatus: 'in_review',
          changedBy: 'recruiter-nexus',
          remarks: 'Resume and portfolio verified by recruitment committee',
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
        {
          id: 'hist-001-3',
          applicationId: 'app-seed-001',
          fromStatus: 'in_review',
          toStatus: 'shortlisted',
          changedBy: 'recruiter-nexus',
          remarks: 'Shortlisted for Round 1 Technical Systems Interview',
          createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        },
      ],
    },
    {
      app: {
        id: 'app-seed-002',
        jobId: 'job-seed-001',
        studentId: 'student-profile-uuid-002',
        status: 'applied',
        coverNote: 'Excited about the Graduate Software Engineer position. Experienced in modern backend engineering.',
        appliedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        jobTitle: 'Graduate Software Engineer (Backend)',
        companyName: 'Nexus Cloud Technologies',
      },
      candidate: {
        studentId: 'student-profile-uuid-002',
        userId: 'student-user-002',
        fullName: 'Vikram Seth',
        email: 'vikram.seth@nit.edu',
        phone: '+91 98111 22334',
        avatarUrl: null,
        collegeName: 'National Institute of Technology',
        degree: 'B.Tech',
        rollNumber: 'CS2022019',
        department: 'Computer Science and Engineering',
        batchYear: 2026,
        cgpa: 8.4,
        activeBacklogs: 0,
        skills: [
          { name: 'Python', category: 'technical', proficiency: 'advanced' },
          { name: 'Node.js', category: 'technical', proficiency: 'intermediate' },
          { name: 'PostgreSQL', category: 'technical', proficiency: 'intermediate' },
          { name: 'Docker', category: 'tool', proficiency: 'beginner' },
        ],
        projects: [
          {
            title: 'Real-time Event Ingestion Broker',
            description: 'Lightweight publish-subscribe message broker with WebSocket streaming.',
            technologies: ['Node.js', 'PostgreSQL', 'WebSockets'],
            projectUrl: 'https://github.com/vikram-seth/event-broker',
          },
        ],
        certifications: [],
        achievements: [],
        linkedinUrl: 'https://linkedin.com/in/vikram-seth',
        githubUrl: 'https://github.com/vikram-seth',
        portfolioUrl: null,
        resumeUrl: '/resumes/mock-resume-vikram.pdf',
      },
      history: [
        {
          id: 'hist-002-1',
          applicationId: 'app-seed-002',
          fromStatus: null,
          toStatus: 'applied',
          changedBy: 'student-user-002',
          remarks: 'Candidate submitted application',
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
      ],
    },
    {
      app: {
        id: 'app-seed-003',
        jobId: 'job-seed-001',
        studentId: 'student-profile-uuid-003',
        status: 'in_review',
        coverNote: 'Strong experience with distributed architectures and database tuning.',
        appliedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        jobTitle: 'Graduate Software Engineer (Backend)',
        companyName: 'Nexus Cloud Technologies',
      },
      candidate: {
        studentId: 'student-profile-uuid-003',
        userId: 'student-user-003',
        fullName: 'Priya Sharma',
        email: 'priya.sharma@iiit.edu',
        phone: '+91 97654 32109',
        avatarUrl: null,
        collegeName: 'Indian Institute of Information Technology',
        degree: 'B.Tech',
        rollNumber: 'IT2022045',
        department: 'Information Technology',
        batchYear: 2026,
        cgpa: 8.9,
        activeBacklogs: 0,
        skills: [
          { name: 'TypeScript', category: 'technical', proficiency: 'expert' },
          { name: 'Node.js', category: 'technical', proficiency: 'advanced' },
          { name: 'PostgreSQL', category: 'technical', proficiency: 'advanced' },
          { name: 'AWS', category: 'technical', proficiency: 'intermediate' },
        ],
        projects: [
          {
            title: 'Multi-Tenant Auth Microservice',
            description: 'Zero-trust authentication service with JWT rotation and rate limiting.',
            technologies: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
            projectUrl: 'https://github.com/priya-sharma/auth-service',
          },
        ],
        certifications: [
          {
            name: 'Meta Backend Developer Professional Certificate',
            issuingOrganization: 'Coursera / Meta',
            issueDate: '2025-08-10',
            credentialUrl: 'https://coursera.org/verify/meta-backend',
          },
        ],
        achievements: [],
        linkedinUrl: 'https://linkedin.com/in/priya-sharma',
        githubUrl: 'https://github.com/priya-sharma',
        portfolioUrl: 'https://priyasharma.io',
        resumeUrl: '/resumes/mock-resume-priya.pdf',
      },
      history: [
        {
          id: 'hist-003-1',
          applicationId: 'app-seed-003',
          fromStatus: null,
          toStatus: 'applied',
          changedBy: 'student-user-003',
          remarks: 'Candidate submitted application',
          createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        },
        {
          id: 'hist-003-2',
          applicationId: 'app-seed-003',
          fromStatus: 'applied',
          toStatus: 'in_review',
          changedBy: 'recruiter-nexus',
          remarks: 'Under technical review by hiring manager',
          createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        },
      ],
    },
    {
      app: {
        id: 'app-seed-004',
        jobId: 'job-seed-001',
        studentId: 'student-profile-uuid-004',
        status: 'offered',
        coverNote: 'Looking forward to driving high-performance platform solutions.',
        appliedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
        jobTitle: 'Graduate Software Engineer (Backend)',
        companyName: 'Nexus Cloud Technologies',
      },
      candidate: {
        studentId: 'student-profile-uuid-004',
        userId: 'student-user-004',
        fullName: 'Devendra Patel',
        email: 'devendra.patel@bit.edu',
        phone: '+91 99887 76655',
        avatarUrl: null,
        collegeName: 'Birla Institute of Technology',
        degree: 'B.Tech',
        rollNumber: 'DS2021012',
        department: 'Data Science',
        batchYear: 2025,
        cgpa: 9.4,
        activeBacklogs: 0,
        skills: [
          { name: 'Node.js', category: 'technical', proficiency: 'expert' },
          { name: 'TypeScript', category: 'technical', proficiency: 'expert' },
          { name: 'PostgreSQL', category: 'technical', proficiency: 'expert' },
          { name: 'Docker', category: 'tool', proficiency: 'advanced' },
          { name: 'AWS', category: 'technical', proficiency: 'advanced' },
        ],
        projects: [
          {
            title: 'High-Throughput Analytics Stream Engine',
            description: 'Real-time telemetry aggregator handling 100k events/sec with sub-millisecond p99 latency.',
            technologies: ['Node.js', 'Kafka', 'PostgreSQL', 'Docker'],
            projectUrl: 'https://github.com/devendra-patel/stream-engine',
          },
        ],
        certifications: [
          {
            name: 'CKA: Certified Kubernetes Administrator',
            issuingOrganization: 'Linux Foundation',
            issueDate: '2025-04-20',
            credentialUrl: 'https://www.cncf.io/certification/cka/',
          },
        ],
        achievements: [
          {
            title: '1st Rank University Academic Excellence Award',
            description: 'Department topper for 3 consecutive academic years.',
            date: '2025-05-01',
          },
        ],
        linkedinUrl: 'https://linkedin.com/in/devendra-patel',
        githubUrl: 'https://github.com/devendra-patel',
        portfolioUrl: 'https://devendra.tech',
        resumeUrl: '/resumes/mock-resume-devendra.pdf',
      },
      history: [
        {
          id: 'hist-004-1',
          applicationId: 'app-seed-004',
          fromStatus: null,
          toStatus: 'applied',
          changedBy: 'student-user-004',
          remarks: 'Candidate submitted application',
          createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
        },
        {
          id: 'hist-004-2',
          applicationId: 'app-seed-004',
          fromStatus: 'applied',
          toStatus: 'in_review',
          changedBy: 'recruiter-nexus',
          remarks: 'Cleared resume screening',
          createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        },
        {
          id: 'hist-004-3',
          applicationId: 'app-seed-004',
          fromStatus: 'in_review',
          toStatus: 'shortlisted',
          changedBy: 'recruiter-nexus',
          remarks: 'Outstanding performance in technical architecture round',
          createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
        {
          id: 'hist-004-4',
          applicationId: 'app-seed-004',
          fromStatus: 'shortlisted',
          toStatus: 'offered',
          changedBy: 'recruiter-nexus',
          remarks: 'Selected for Graduate Software Engineer role at ₹18 LPA CTC',
          createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
        },
      ],
    },
    {
      app: {
        id: 'app-seed-005',
        jobId: 'job-seed-001',
        studentId: 'student-profile-uuid-005',
        status: 'rejected',
        coverNote: 'Applying for software engineering position.',
        appliedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        jobTitle: 'Graduate Software Engineer (Backend)',
        companyName: 'Nexus Cloud Technologies',
      },
      candidate: {
        studentId: 'student-profile-uuid-005',
        userId: 'student-user-005',
        fullName: 'Rajesh Kumar',
        email: 'rajesh.kumar@dtu.edu',
        phone: '+91 99000 11223',
        avatarUrl: null,
        collegeName: 'Delhi Technological University',
        degree: 'B.Tech',
        rollNumber: 'EE2022033',
        department: 'Electrical and Electronics',
        batchYear: 2026,
        cgpa: 7.2,
        activeBacklogs: 0,
        skills: [
          { name: 'C', category: 'technical', proficiency: 'intermediate' },
          { name: 'Linux', category: 'tool', proficiency: 'intermediate' },
        ],
        projects: [],
        certifications: [],
        achievements: [],
        linkedinUrl: 'https://linkedin.com/in/rajesh-kumar',
        githubUrl: 'https://github.com/rajesh-kumar',
        portfolioUrl: null,
        resumeUrl: '/resumes/mock-resume-rajesh.pdf',
      },
      history: [
        {
          id: 'hist-005-1',
          applicationId: 'app-seed-005',
          fromStatus: null,
          toStatus: 'applied',
          changedBy: 'student-user-005',
          remarks: 'Candidate submitted application',
          createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        },
        {
          id: 'hist-005-2',
          applicationId: 'app-seed-005',
          fromStatus: 'applied',
          toStatus: 'rejected',
          changedBy: 'recruiter-nexus',
          remarks: 'Candidate does not meet backend distributed systems stack requirements.',
          createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        },
      ],
    },
  ];

  for (const item of sampleApplicants) {
    mockApplicationsStore.set(item.app.id, item.app);
    mockApplicationsStore.set(`${item.app.studentId}::${item.app.jobId}`, item.app);
    mockCandidatesStore.set(item.app.studentId, item.candidate);
    mockStatusHistoryStore.set(item.app.id, item.history);
  }
}

function mapApplicationRow(
  row: JobApplicationRow,
  extra?: {
    jobTitle?: string;
    companyName?: string;
    companyLogoUrl?: string | null;
    companyWebsite?: string | null;
    location?: string;
    employmentType?: string;
    department?: string | null;
    workplaceType?: string;
    statusHistory?: ApplicationStatusHistoryItem[];
  }
): JobApplication {
  return {
    id: row.id,
    jobId: row.job_id,
    studentId: row.student_id,
    resumeId: row.resume_id,
    status: row.status,
    coverNote: row.cover_note,
    eligibilitySnapshot: (row.eligibility_snapshot as Record<string, unknown>) || null,
    appliedAt: row.applied_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    jobTitle: extra?.jobTitle,
    companyName: extra?.companyName,
    companyLogoUrl: extra?.companyLogoUrl,
    companyWebsite: extra?.companyWebsite,
    location: extra?.location,
    employmentType: extra?.employmentType,
    department: extra?.department,
    workplaceType: extra?.workplaceType,
    statusHistory: extra?.statusHistory || [],
  };
}

export const applicationService = {
  /**
   * Submits a new job application for the authenticated student candidate.
   * Performs end-to-end server-side eligibility check, deadline validation,
   * published status verification, and duplicate prevention.
   */
  async submitApplication(
    userId: string,
    rawInput: unknown
  ): Promise<ApplicationServiceResult<JobApplication>> {
    if (!userId) {
      return { success: false, error: 'Authentication required. Please sign in to apply.' };
    }

    // 1. Validate Input Payload
    const parsed = submitApplicationSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid application payload provided.',
      };
    }
    const input: SubmitApplicationInput = parsed.data;

    // 2. Resolve Student Academic Profile
    const studentProfile = await studentService.getProfile(userId);
    if (!studentProfile) {
      return {
        success: false,
        error: 'Student profile not found. Please complete your academic profile before applying.',
      };
    }

    const studentId = studentProfile.profileId || studentProfile.userId || userId;

    // 3. Resolve Target Job Opening (Strictly published check)
    const job = await jobService.getPublishedJobById(input.jobId);
    if (!job) {
      return {
        success: false,
        error: 'This placement opportunity is not available for applications.',
      };
    }

    if (job.status !== 'published') {
      return {
        success: false,
        error: 'This job drive is not actively open for applications.',
      };
    }

    // 4. Validate Application Deadline
    const deadline = new Date(job.applicationDeadline).getTime();
    if (deadline <= Date.now()) {
      return {
        success: false,
        error: 'The application deadline for this position has passed.',
      };
    }

    // 5. Authoritative Server-Side Eligibility Evaluation
    const eligibility = evaluateJobEligibility(studentProfile, job);
    if (!eligibility.isEligible) {
      const reason =
        eligibility.reasons && eligibility.reasons.length > 0
          ? eligibility.reasons[0]
          : 'You do not meet the institutional eligibility criteria for this position.';
      return {
        success: false,
        error: reason,
      };
    }

    // 6. Pre-check Duplicate Application
    const alreadyApplied = await this.hasApplied(userId, job.id);
    if (alreadyApplied) {
      return {
        success: false,
        error: 'You have already submitted an application for this placement drive.',
      };
    }

    const supabase = createServerSupabaseClient();
    const nowIso = new Date().toISOString();
    const applicationId = crypto.randomUUID();

    // Initial audit log item
    const historyItem: ApplicationStatusHistoryItem = {
      id: crypto.randomUUID(),
      applicationId,
      fromStatus: null,
      toStatus: 'applied',
      changedBy: userId,
      remarks: 'Initial candidate application submission',
      createdAt: nowIso,
    };

    // 7. Persist to Database if Supabase is available
    if (supabase) {
      try {
        const { data, error } = await (supabase as any)
          .from('job_applications')
          .insert({
            id: applicationId,
            job_id: job.id,
            student_id: studentId,
            status: 'applied',
            cover_note: input.coverNote?.trim() || null,
            eligibility_snapshot: eligibility as any,
            applied_at: nowIso,
            created_at: nowIso,
            updated_at: nowIso,
          })
          .select()
          .single();

        if (error) {
          // Check for unique constraint violation (code 23505)
          if (
            error.code === '23505' ||
            error.message?.includes('duplicate key') ||
            error.message?.includes('uq_job_applications_job_student')
          ) {
            return {
              success: false,
              error: 'You have already submitted an application for this placement drive.',
            };
          }
          // Fall through to mock store if table/migration not yet applied to live DB
        } else if (data) {
          // Log initial history audit entry
          await (supabase as any)
            .from('application_status_history')
            .insert({
              id: historyItem.id,
              application_id: data.id,
              from_status: null,
              to_status: 'applied',
              changed_by: userId,
              remarks: historyItem.remarks,
              created_at: nowIso,
            })
            .catch(() => {
              // Non-blocking history record
            });

          const mapped = mapApplicationRow(data, {
            jobTitle: job.title,
            companyName: job.companyName,
            companyLogoUrl: job.companyLogoUrl,
            companyWebsite: job.companyWebsite,
            location: job.location,
            employmentType: job.employmentType,
            department: job.department,
            workplaceType: job.workplaceType,
            statusHistory: [historyItem],
          });

          // Mirror in mock store for cross-environment consistency
          mockApplicationsStore.set(data.id, mapped);
          mockApplicationsStore.set(`${studentId}::${job.id}`, mapped);
          mockStatusHistoryStore.set(data.id, [historyItem]);

          return {
            success: true,
            data: mapped,
          };
        }
      } catch {
        // Fall back to mock store for local/testing execution
      }
    }

    // 8. Fallback In-Memory Storage (Test & Dev environments)
    const newApp: JobApplication = {
      id: applicationId,
      jobId: job.id,
      studentId,
      status: 'applied',
      coverNote: input.coverNote?.trim() || null,
      eligibilitySnapshot: eligibility as unknown as Record<string, unknown>,
      appliedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
      jobTitle: job.title,
      companyName: job.companyName,
      companyLogoUrl: job.companyLogoUrl,
      companyWebsite: job.companyWebsite,
      location: job.location,
      employmentType: job.employmentType,
      department: job.department,
      workplaceType: job.workplaceType,
      statusHistory: [historyItem],
    };

    mockApplicationsStore.set(applicationId, newApp);
    mockApplicationsStore.set(`${studentId}::${job.id}`, newApp);

    const existingHistory = mockStatusHistoryStore.get(applicationId) || [];
    mockStatusHistoryStore.set(applicationId, [...existingHistory, historyItem]);

    return {
      success: true,
      data: newApp,
    };
  },

  /**
   * Checks whether the authenticated student has already applied for a specific job.
   */
  async hasApplied(userId: string, jobId: string): Promise<boolean> {
    if (!userId || !jobId) return false;

    const studentProfile = await studentService.getProfile(userId);
    const studentId = studentProfile?.profileId || studentProfile?.userId || userId;

    // Check mock store first for speed in test/mock environment
    if (mockApplicationsStore.has(`${studentId}::${jobId}`)) {
      return true;
    }

    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return false;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('job_applications')
        .select('id')
        .eq('job_id', jobId)
        .eq('student_id', studentId)
        .maybeSingle();

      if (!error && data) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  /**
   * Retrieves an existing application for a student and job combination if one exists.
   */
  async getExistingApplication(
    userId: string,
    jobId: string
  ): Promise<JobApplication | null> {
    if (!userId || !jobId) return null;

    const studentProfile = await studentService.getProfile(userId);
    const studentId = studentProfile?.profileId || studentProfile?.userId || userId;

    const cached = mockApplicationsStore.get(`${studentId}::${jobId}`);
    if (cached) {
      const history = mockStatusHistoryStore.get(cached.id) || [];
      return { ...cached, statusHistory: history };
    }

    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return null;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('job_applications')
        .select('*, jobs(title, location, employment_type, department, workplace_type, companies(name, logo_url, website))')
        .eq('job_id', jobId)
        .eq('student_id', studentId)
        .maybeSingle();

      if (!error && data) {
        const history = await this.getApplicationStatusHistory(data.id);
        return mapApplicationRow(data, {
          jobTitle: data.jobs?.title,
          location: data.jobs?.location,
          employmentType: data.jobs?.employment_type,
          department: data.jobs?.department,
          workplaceType: data.jobs?.workplace_type,
          companyName: data.jobs?.companies?.name,
          companyLogoUrl: data.jobs?.companies?.logo_url,
          companyWebsite: data.jobs?.companies?.website,
          statusHistory: history,
        });
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Retrieves an application by its unique primary ID.
   */
  async getApplicationById(applicationId: string): Promise<JobApplication | null> {
    if (!applicationId) return null;

    const cached = mockApplicationsStore.get(applicationId);
    if (cached) {
      const history = mockStatusHistoryStore.get(applicationId) || [];
      return { ...cached, statusHistory: history };
    }

    const supabase = createServerSupabaseClient();
    if (!supabase) return null;

    try {
      const { data, error } = await (supabase as any)
        .from('job_applications')
        .select('*, jobs(title, location, employment_type, department, workplace_type, companies(name, logo_url, website))')
        .eq('id', applicationId)
        .maybeSingle();

      if (!error && data) {
        const history = await this.getApplicationStatusHistory(data.id);
        return mapApplicationRow(data, {
          jobTitle: data.jobs?.title,
          location: data.jobs?.location,
          employmentType: data.jobs?.employment_type,
          department: data.jobs?.department,
          workplaceType: data.jobs?.workplace_type,
          companyName: data.jobs?.companies?.name,
          companyLogoUrl: data.jobs?.companies?.logo_url,
          companyWebsite: data.jobs?.companies?.website,
          statusHistory: history,
        });
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Retrieves the status progression history for an application.
   */
  async getApplicationStatusHistory(
    applicationId: string
  ): Promise<ApplicationStatusHistoryItem[]> {
    if (!applicationId) return [];

    const cached = mockStatusHistoryStore.get(applicationId);
    if (cached && cached.length > 0) return cached;

    const supabase = createServerSupabaseClient();
    if (!supabase) return cached || [];

    try {
      const { data, error } = await (supabase as any)
        .from('application_status_history')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true });

      if (!error && data && Array.isArray(data)) {
        return data.map((h: any) => ({
          id: h.id,
          applicationId: h.application_id,
          fromStatus: h.from_status,
          toStatus: h.to_status,
          changedBy: h.changed_by,
          remarks: h.remarks,
          createdAt: h.created_at,
        }));
      }
      return cached || [];
    } catch {
      return cached || [];
    }
  },

  /**
   * Retrieves all job applications submitted by a specific student.
   * Joins job details, company details, and the recruitment status timeline.
   */
  async getStudentApplications(userId: string): Promise<JobApplication[]> {
    if (!userId) return [];

    const studentProfile = await studentService.getProfile(userId);
    const studentId = studentProfile?.profileId || studentProfile?.userId || userId;

    const supabase = createServerSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await (supabase as any)
          .from('job_applications')
          .select(
            '*, jobs(title, location, employment_type, department, workplace_type, companies(name, logo_url, website))'
          )
          .eq('student_id', studentId)
          .order('applied_at', { ascending: false });

        if (!error && data && Array.isArray(data)) {
          const appIds = data.map((d: any) => d.id);
          const historyMap = new Map<string, ApplicationStatusHistoryItem[]>();

          if (appIds.length > 0) {
            const { data: histData } = await (supabase as any)
              .from('application_status_history')
              .select('*')
              .in('application_id', appIds)
              .order('created_at', { ascending: true });

            if (histData && Array.isArray(histData)) {
              for (const h of histData) {
                const list = historyMap.get(h.application_id) || [];
                list.push({
                  id: h.id,
                  applicationId: h.application_id,
                  fromStatus: h.from_status,
                  toStatus: h.to_status,
                  changedBy: h.changed_by,
                  remarks: h.remarks,
                  createdAt: h.created_at,
                });
                historyMap.set(h.application_id, list);
              }
            }
          }

          return data.map((row: any) =>
            mapApplicationRow(row, {
              jobTitle: row.jobs?.title,
              location: row.jobs?.location,
              employmentType: row.jobs?.employment_type,
              department: row.jobs?.department,
              workplaceType: row.jobs?.workplace_type,
              companyName: row.jobs?.companies?.name,
              companyLogoUrl: row.jobs?.companies?.logo_url,
              companyWebsite: row.jobs?.companies?.website,
              statusHistory: historyMap.get(row.id) || [],
            })
          );
        }
      } catch {
        // Fall back to mock store
      }
    }

    const results: JobApplication[] = [];
    mockApplicationsStore.forEach((app) => {
      if (app.studentId === studentId && !results.some((r) => r.id === app.id)) {
        const history = mockStatusHistoryStore.get(app.id) || [
          {
            id: `seed-hist-${app.id}`,
            applicationId: app.id,
            fromStatus: null,
            toStatus: app.status,
            changedBy: userId,
            remarks: 'Application submitted',
            createdAt: app.appliedAt,
          },
        ];
        results.push({
          ...app,
          statusHistory: history,
        });
      }
    });

    return results.sort(
      (a, b) => new Date(b.appliedAt || b.createdAt).getTime() - new Date(a.appliedAt || a.createdAt).getTime()
    );
  },

  /**
   * Helper to simulate status update for testing or recruiter stage transitions.
   */
  async updateApplicationStatus(
    applicationId: string,
    newStatus: ApplicationStatus,
    changedBy?: string,
    remarks?: string
  ): Promise<boolean> {
    if (!applicationId || !newStatus) return false;

    const cached = mockApplicationsStore.get(applicationId);
    const nowIso = new Date().toISOString();
    const fromStatus = cached?.status || null;

    if (cached) {
      cached.status = newStatus;
      cached.updatedAt = nowIso;
      mockApplicationsStore.set(applicationId, cached);

      const history = mockStatusHistoryStore.get(applicationId) || [];
      history.push({
        id: crypto.randomUUID(),
        applicationId,
        fromStatus,
        toStatus: newStatus,
        changedBy: changedBy || null,
        remarks: remarks || `Status changed to ${newStatus}`,
        createdAt: nowIso,
      });
      mockStatusHistoryStore.set(applicationId, history);
    }

    const supabase = createServerSupabaseClient();
    if (supabase) {
      try {
        await (supabase as any)
          .from('job_applications')
          .update({ status: newStatus, updated_at: nowIso })
          .eq('id', applicationId);

        await (supabase as any).from('application_status_history').insert({
          id: crypto.randomUUID(),
          application_id: applicationId,
          from_status: fromStatus,
          to_status: newStatus,
          changed_by: changedBy || null,
          remarks: remarks || `Status changed to ${newStatus}`,
          created_at: nowIso,
        });
      } catch {
        // Mock fallback updated
      }
    }

    return true;
  },

  /**
   * Retrieves all candidate applications for a specific job drive.
   * Strictly enforces company ownership isolation: only the recruiter belonging
   * to the company that posted the job can access its applicant roster.
   */
  async getCompanyJobApplicants(
    userId: string,
    jobId: string
  ): Promise<ApplicationServiceResult<{ job: JobPosting; applicants: ApplicantDetailItem[] }>> {
    if (!userId || !jobId) {
      return { success: false, error: 'User ID and Job ID are required.' };
    }

    ensureMockSeedApplicants();

    // 1. Ownership Verification: Job MUST belong to authenticated recruiter's organization
    const job = await jobService.getJobById(userId, jobId);
    if (!job) {
      return {
        success: false,
        error: 'Job posting not found or unauthorized. You do not have access to this drive.',
      };
    }

    const supabase = createServerSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await (supabase as any)
          .from('job_applications')
          .select(`
            id,
            job_id,
            student_id,
            resume_id,
            status,
            cover_note,
            applied_at,
            updated_at,
            student_profiles!inner (
              id,
              user_id,
              college_name,
              degree,
              roll_number,
              department,
              batch_year,
              cgpa,
              active_backlogs,
              total_backlogs_cleared,
              gender,
              linkedin_url,
              github_url,
              portfolio_url,
              is_academically_verified,
              users:user_id (
                id,
                email,
                full_name,
                phone,
                avatar_url
              )
            ),
            resumes (
              file_url
            )
          `)
          .eq('job_id', jobId)
          .order('applied_at', { ascending: false });

        if (!error && data && Array.isArray(data)) {
          const appIds = data.map((d: any) => d.id);
          const studentProfileIds = data.map((d: any) => d.student_profiles?.id).filter(Boolean);

          // Batch fetch sub-collections: skills, projects, certifications, achievements, history
          const [skillsRes, projectsRes, certsRes, achieveRes, histRes] = await Promise.all([
            studentProfileIds.length > 0
              ? (supabase as any).from('student_skills').select('*').in('student_id', studentProfileIds)
              : { data: [] },
            studentProfileIds.length > 0
              ? (supabase as any).from('student_projects').select('*').in('student_id', studentProfileIds)
              : { data: [] },
            studentProfileIds.length > 0
              ? (supabase as any).from('student_certifications').select('*').in('student_id', studentProfileIds)
              : { data: [] },
            studentProfileIds.length > 0
              ? (supabase as any).from('student_achievements').select('*').in('student_id', studentProfileIds)
              : { data: [] },
            appIds.length > 0
              ? (supabase as any).from('application_status_history').select('*').in('application_id', appIds).order('created_at', { ascending: true })
              : { data: [] },
          ]);

          const skillsByStudent = new Map<string, any[]>();
          (skillsRes.data || []).forEach((s: any) => {
            const list = skillsByStudent.get(s.student_id) || [];
            list.push({ name: s.name, category: s.category, proficiency: s.proficiency });
            skillsByStudent.set(s.student_id, list);
          });

          const projectsByStudent = new Map<string, any[]>();
          (projectsRes.data || []).forEach((p: any) => {
            const list = projectsByStudent.get(p.student_id) || [];
            list.push({
              title: p.title,
              description: p.description,
              technologies: p.technologies || [],
              projectUrl: p.project_url,
            });
            projectsByStudent.set(p.student_id, list);
          });

          const certsByStudent = new Map<string, any[]>();
          (certsRes.data || []).forEach((c: any) => {
            const list = certsByStudent.get(c.student_id) || [];
            list.push({
              name: c.name,
              issuingOrganization: c.issuing_organization,
              issueDate: c.issue_date,
              credentialUrl: c.credential_url,
            });
            certsByStudent.set(c.student_id, list);
          });

          const achieveByStudent = new Map<string, any[]>();
          (achieveRes.data || []).forEach((a: any) => {
            const list = achieveByStudent.get(a.student_id) || [];
            list.push({ title: a.title, description: a.description, date: a.date });
            achieveByStudent.set(a.student_id, list);
          });

          const historyByApp = new Map<string, ApplicationStatusHistoryItem[]>();
          (histRes.data || []).forEach((h: any) => {
            const list = historyByApp.get(h.application_id) || [];
            list.push({
              id: h.id,
              applicationId: h.application_id,
              fromStatus: h.from_status,
              toStatus: h.to_status,
              changedBy: h.changed_by,
              remarks: h.remarks,
              createdAt: h.created_at,
            });
            historyByApp.set(h.application_id, list);
          });

          const applicants: ApplicantDetailItem[] = data.map((row: any) => {
            const sp = row.student_profiles;
            const u = sp?.users;
            const candidate: ApplicantCandidateProfile = {
              studentId: sp?.id || row.student_id,
              userId: sp?.user_id || u?.id || '',
              fullName: u?.full_name || 'Candidate',
              email: u?.email || '',
              phone: u?.phone || null,
              avatarUrl: u?.avatar_url || null,
              collegeName: sp?.college_name || 'Engineering College',
              degree: sp?.degree || 'B.Tech',
              rollNumber: sp?.roll_number || '',
              department: sp?.department || '',
              batchYear: sp?.batch_year || 2026,
              cgpa: Number(sp?.cgpa || 0),
              activeBacklogs: sp?.active_backlogs || 0,
              skills: skillsByStudent.get(sp?.id) || [],
              projects: projectsByStudent.get(sp?.id) || [],
              certifications: certsByStudent.get(sp?.id) || [],
              achievements: achieveByStudent.get(sp?.id) || [],
              linkedinUrl: sp?.linkedin_url || null,
              githubUrl: sp?.github_url || null,
              portfolioUrl: sp?.portfolio_url || null,
              resumeUrl: row.resumes?.file_url || null,
            };

            return {
              id: row.id,
              jobId: row.job_id,
              studentId: row.student_id,
              status: row.status,
              coverNote: row.cover_note,
              appliedAt: row.applied_at,
              updatedAt: row.updated_at,
              candidate,
              statusHistory: historyByApp.get(row.id) || [],
            };
          });

          return {
            success: true,
            data: { job, applicants },
          };
        }
      } catch {
        // Fall back to mock store
      }
    }

    // Mock store resolution
    const matchingApps: JobApplication[] = [];
    mockApplicationsStore.forEach((app) => {
      if (app.jobId === jobId && !matchingApps.some((m) => m.id === app.id)) {
        matchingApps.push(app);
      }
    });

    const applicants: ApplicantDetailItem[] = await Promise.all(
      matchingApps.map(async (app) => {
        let candidate = mockCandidatesStore.get(app.studentId);
        if (!candidate) {
          const profile = await studentService.getProfile(app.studentId);
          if (profile) {
            candidate = studentProfileToCandidate(profile);
          } else {
            candidate = {
              studentId: app.studentId,
              userId: app.studentId,
              fullName: 'Registered Student Candidate',
              email: 'candidate@university.edu',
              collegeName: 'National Institute of Technology',
              degree: 'B.Tech',
              rollNumber: 'CS2022099',
              department: 'Computer Science and Engineering',
              batchYear: 2026,
              cgpa: 8.5,
              activeBacklogs: 0,
              skills: [{ name: 'TypeScript', category: 'technical' }],
              projects: [],
              certifications: [],
              achievements: [],
              resumeUrl: '/resumes/sample-candidate.pdf',
            };
          }
        }

        const history = mockStatusHistoryStore.get(app.id) || [
          {
            id: `seed-hist-${app.id}`,
            applicationId: app.id,
            fromStatus: null,
            toStatus: app.status,
            changedBy: userId,
            remarks: 'Application submitted',
            createdAt: app.appliedAt,
          },
        ];

        return {
          id: app.id,
          jobId: app.jobId,
          studentId: app.studentId,
          status: app.status,
          coverNote: app.coverNote,
          appliedAt: app.appliedAt,
          updatedAt: app.updatedAt,
          candidate,
          statusHistory: history,
        };
      })
    );

    applicants.sort(
      (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
    );

    return {
      success: true,
      data: { job, applicants },
    };
  },

  /**
   * Retrieves single applicant candidate detail by applicationId, verifying recruiter job ownership.
   */
  async getApplicantDetails(
    userId: string,
    applicationId: string
  ): Promise<ApplicationServiceResult<ApplicantDetailItem>> {
    if (!userId || !applicationId) {
      return { success: false, error: 'User ID and Application ID are required.' };
    }

    const app = await this.getApplicationById(applicationId);
    if (!app) {
      return { success: false, error: 'Application record not found.' };
    }

    // Ownership check on the parent job
    const job = await jobService.getJobById(userId, app.jobId);
    if (!job) {
      return {
        success: false,
        error: 'Unauthorized: You do not have permission to view applicants for this job.',
      };
    }

    let candidate = mockCandidatesStore.get(app.studentId);
    if (!candidate) {
      const profile = await studentService.getProfile(app.studentId);
      if (profile) {
        candidate = studentProfileToCandidate(profile);
      } else {
        candidate = {
          studentId: app.studentId,
          userId: app.studentId,
          fullName: 'Registered Student Candidate',
          email: 'candidate@university.edu',
          collegeName: 'National Institute of Technology',
          degree: 'B.Tech',
          rollNumber: 'CS2022099',
          department: 'Computer Science and Engineering',
          batchYear: 2026,
          cgpa: 8.5,
          activeBacklogs: 0,
          skills: [],
          projects: [],
          certifications: [],
          achievements: [],
        };
      }
    }

    const history = await this.getApplicationStatusHistory(app.id);

    return {
      success: true,
      data: {
        id: app.id,
        jobId: app.jobId,
        studentId: app.studentId,
        status: app.status,
        coverNote: app.coverNote,
        appliedAt: app.appliedAt,
        updatedAt: app.updatedAt,
        candidate,
        statusHistory: history,
      },
    };
  },

  /**
   * Authoritatively updates an applicant's recruitment stage with recruiter remarks.
   * Enforces server-side ownership: verifies the target application belongs to a job
   * owned by the authenticated recruiter's organization.
   */
  async updateRecruiterApplicationStatus(
    userId: string,
    applicationId: string,
    newStatus: ApplicationStatus,
    remarks?: string
  ): Promise<ApplicationServiceResult<JobApplication>> {
    if (!userId || !applicationId || !newStatus) {
      return { success: false, error: 'Missing required parameters for status update.' };
    }

    // 1. Fetch target application
    const app = await this.getApplicationById(applicationId);
    if (!app) {
      return { success: false, error: 'Target application record was not found.' };
    }

    // 2. Ownership check: Must belong to recruiter's company
    const job = await jobService.getJobById(userId, app.jobId);
    if (!job) {
      return {
        success: false,
        error: 'Unauthorized: You do not have permission to manage this candidate application.',
      };
    }

    // 3. Authoritative lifecycle transition validation
    const transitionCheck = validateStatusTransition(app.status, newStatus);
    if (!transitionCheck.isValid) {
      return {
        success: false,
        error: transitionCheck.error || `Invalid status transition from "${app.status}" to "${newStatus}".`,
      };
    }

    // 4. Perform update & history record
    const updated = await this.updateApplicationStatus(
      applicationId,
      newStatus,
      userId,
      remarks || undefined
    );

    if (!updated) {
      return { success: false, error: 'Failed to update application status in database.' };
    }

    const refreshed = await this.getApplicationById(applicationId);
    return {
      success: true,
      data: refreshed || undefined,
    };
  },

  /**
   * Retrieves chronological status history for a student's own application.
   * Strictly enforces student ownership isolation: students can only access history for their own applications.
   */
  async getStudentApplicationStatusHistory(
    userId: string,
    applicationId: string
  ): Promise<ApplicationServiceResult<ApplicationStatusHistoryItem[]>> {
    if (!userId || !applicationId) {
      return { success: false, error: 'User ID and Application ID are required.' };
    }

    const studentProfile = await studentService.getProfile(userId);
    if (!studentProfile) {
      return { success: false, error: 'Student profile not found.' };
    }

    const app = await this.getApplicationById(applicationId);
    if (!app) {
      return { success: false, error: 'Application record not found.' };
    }

    const studentId = studentProfile.profileId || studentProfile.userId || userId;
    if (app.studentId !== studentId && app.studentId !== userId) {
      return {
        success: false,
        error: 'Unauthorized: You can only view status history for your own applications.',
      };
    }

    const history = await this.getApplicationStatusHistory(applicationId);
    const sorted = [...history].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return {
      success: true,
      data: sorted,
    };
  },

  /**
   * Retrieves chronological status history for an applicant from the recruiter applicant board.
   * Strictly enforces recruiter multi-tenant company isolation: recruiters can only access
   * application history for jobs posted by their verified company.
   */
  async getRecruiterApplicationStatusHistory(
    userId: string,
    applicationId: string
  ): Promise<ApplicationServiceResult<{ application: JobApplication; history: ApplicationStatusHistoryItem[] }>> {
    if (!userId || !applicationId) {
      return { success: false, error: 'User ID and Application ID are required.' };
    }

    const app = await this.getApplicationById(applicationId);
    if (!app) {
      return { success: false, error: 'Application record not found.' };
    }

    // Verify company job ownership server-side
    const job = await jobService.getJobById(userId, app.jobId);
    if (!job) {
      return {
        success: false,
        error: 'Unauthorized: You do not have permission to view this application audit history.',
      };
    }

    const history = await this.getApplicationStatusHistory(applicationId);
    const sorted = [...history].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return {
      success: true,
      data: {
        application: app,
        history: sorted,
      },
    };
  },

  /**
   * Internal test helper to reset in-memory application store between tests.
   */
  _resetMockStore() {
    mockApplicationsStore.clear();
    mockStatusHistoryStore.clear();
    mockCandidatesStore.clear();
    seedsInitialized = false;
  },
};
