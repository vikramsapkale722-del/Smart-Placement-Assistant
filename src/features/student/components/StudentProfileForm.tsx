'use client';

import * as React from 'react';
import type {
  CompleteStudentProfile,
  StudentSkillInput,
  StudentProjectInput,
  StudentCertificationInput,
  StudentAchievementInput,
} from '@/features/student/types';
import {
  studentProfileSchema,
  validateProfilePhoto,
} from '@/features/student/schemas';
import { saveStudentProfileAction, uploadProfilePhotoAction } from '@/features/student/actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

interface StudentProfileFormProps {
  initialProfile: CompleteStudentProfile;
}

export function StudentProfileForm({ initialProfile }: StudentProfileFormProps) {
  // Form State
  const [profile, setProfile] = React.useState<CompleteStudentProfile>(initialProfile);
  const [skills, setSkills] = React.useState<StudentSkillInput[]>(initialProfile.skills || []);
  const [projects, setProjects] = React.useState<StudentProjectInput[]>(initialProfile.projects || []);
  const [certifications, setCertifications] = React.useState<StudentCertificationInput[]>(
    initialProfile.certifications || []
  );
  const [achievements, setAchievements] = React.useState<StudentAchievementInput[]>(
    initialProfile.achievements || []
  );

  // Status and Validation states
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});

  // Skill Draft inputs
  const [newSkillName, setNewSkillName] = React.useState('');
  const [newSkillCategory, setNewSkillCategory] = React.useState<StudentSkillInput['category']>('technical');
  const [newSkillProficiency, setNewSkillProficiency] =
    React.useState<StudentSkillInput['proficiency']>('intermediate');

  // Handle Photo Upload
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateProfilePhoto({ size: file.size, type: file.type });
    if (!validation.valid) {
      setFeedback({ type: 'error', message: validation.error || 'Invalid photo' });
      return;
    }

    setIsUploadingPhoto(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append('photo', file);

    const res = await uploadProfilePhotoAction(formData);
    setIsUploadingPhoto(false);

    if (res.success && res.data) {
      setProfile((prev) => ({ ...prev, avatarUrl: res.data }));
      setFeedback({ type: 'success', message: 'Profile photo updated successfully' });
    } else {
      setFeedback({ type: 'error', message: res.error || 'Photo upload failed' });
    }
  };

  // Skill Add / Remove
  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    if (skills.some((s) => s.name.toLowerCase() === newSkillName.trim().toLowerCase())) {
      setFeedback({ type: 'error', message: 'Skill already exists in your profile' });
      return;
    }
    setSkills((prev) => [
      ...prev,
      {
        name: newSkillName.trim(),
        category: newSkillCategory,
        proficiency: newSkillProficiency,
      },
    ]);
    setNewSkillName('');
    setFeedback(null);
  };

  const handleRemoveSkill = (index: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  };

  // Project Add / Remove
  const handleAddProject = () => {
    setProjects((prev) => [
      ...prev,
      {
        title: '',
        description: '',
        technologies: [],
        projectUrl: '',
      },
    ]);
  };

  const handleRemoveProject = (index: number) => {
    setProjects((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateProject = (index: number, field: keyof StudentProjectInput, value: unknown) => {
    setProjects((prev) =>
      prev.map((proj, i) => (i === index ? { ...proj, [field]: value } : proj))
    );
  };

  // Certification Add / Remove
  const handleAddCertification = () => {
    setCertifications((prev) => [
      ...prev,
      {
        name: '',
        issuingOrganization: '',
        issueDate: '',
        credentialUrl: '',
      },
    ]);
  };

  const handleRemoveCertification = (index: number) => {
    setCertifications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCertification = (
    index: number,
    field: keyof StudentCertificationInput,
    value: string
  ) => {
    setCertifications((prev) =>
      prev.map((cert, i) => (i === index ? { ...cert, [field]: value } : cert))
    );
  };

  // Achievement Add / Remove
  const handleAddAchievement = () => {
    setAchievements((prev) => [
      ...prev,
      {
        title: '',
        description: '',
        date: '',
      },
    ]);
  };

  const handleRemoveAchievement = (index: number) => {
    setAchievements((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateAchievement = (
    index: number,
    field: keyof StudentAchievementInput,
    value: string
  ) => {
    setAchievements((prev) =>
      prev.map((ach, i) => (i === index ? { ...ach, [field]: value } : ach))
    );
  };

  // Submit Profile Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setValidationErrors({});

    const payload = {
      fullName: profile.fullName,
      phone: profile.phone || '',
      avatarUrl: profile.avatarUrl || '',
      collegeName: profile.collegeName,
      degree: profile.degree,
      rollNumber: profile.rollNumber,
      department: profile.department,
      batchYear: Number(profile.batchYear),
      cgpa: Number(profile.cgpa),
      tenthPercentage: profile.tenthPercentage ? Number(profile.tenthPercentage) : null,
      twelfthPercentage: profile.twelfthPercentage ? Number(profile.twelfthPercentage) : null,
      activeBacklogs: Number(profile.activeBacklogs || 0),
      totalBacklogsCleared: Number(profile.totalBacklogsCleared || 0),
      gender: profile.gender || null,
      linkedinUrl: profile.linkedinUrl || '',
      githubUrl: profile.githubUrl || '',
      portfolioUrl: profile.portfolioUrl || '',
      skills,
      projects: projects.filter((p) => p.title.trim().length > 0),
      certifications: certifications.filter((c) => c.name.trim().length > 0),
      achievements: achievements.filter((a) => a.title.trim().length > 0),
    };

    // Client-Side Zod Validation
    const validation = studentProfileSchema.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (typeof path === 'string' && !fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      });
      setValidationErrors(fieldErrors);
      setFeedback({
        type: 'error',
        message: validation.error.issues[0]?.message || 'Please fix the highlighted errors',
      });
      return;
    }

    setIsSubmitting(true);
    const result = await saveStudentProfileAction(payload);
    setIsSubmitting(false);

    if (result.success && result.data) {
      setProfile(result.data);
      setFeedback({ type: 'success', message: 'Student profile saved successfully!' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setFeedback({
        type: 'error',
        message: result.error || 'Failed to save profile. Please try again.',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Alert / Feedback Banner */}
      {feedback && (
        <div
          role="alert"
          aria-live="polite"
          className={`p-4 rounded-lg border text-sm flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-success-bg border-success/30 text-success'
              : 'bg-error-bg border-error/30 text-error'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold underline ml-4 hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Profile Header Overview Card */}
      <Card className="border-border shadow-sm">
        <CardContent className="pt-6 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-surface-hover border-2 border-border flex items-center justify-center text-text-muted">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName || 'Student Avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold font-mono">
                  {(profile.fullName || 'S').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground cursor-pointer shadow hover:opacity-90 transition-opacity"
              title="Upload Profile Photo"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              <input
                id="avatar-upload"
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="sr-only"
                onChange={handlePhotoSelect}
                disabled={isUploadingPhoto}
              />
            </label>
          </div>

          <div className="flex-1 text-center md:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h2 className="text-2xl font-bold text-text-primary">
                {profile.fullName || 'Candidate Profile'}
              </h2>
              <Badge variant={profile.isAcademicallyVerified ? 'success' : 'default'}>
                {profile.isAcademicallyVerified ? 'Verified Student' : 'Self-Reported'}
              </Badge>
              {profile.cgpa > 0 && (
                <Badge variant="info">CGPA: {Number(profile.cgpa).toFixed(2)}</Badge>
              )}
            </div>
            <p className="text-sm text-text-secondary font-mono">{profile.email}</p>
            <p className="text-xs text-text-muted">
              {profile.degree || 'Degree Pending'} • {profile.department || 'Department Pending'} • Batch of{' '}
              {profile.batchYear}
            </p>
          </div>

          <div className="pt-2 md:pt-0">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              className="w-full md:w-auto"
            >
              {isSubmitting ? 'Saving Profile...' : 'Save Profile Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. Personal Information */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">1. Personal Information</CardTitle>
          <CardDescription>
            Basic identity and contact details used by recruiters during active drives.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name *"
            value={profile.fullName}
            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
            placeholder="e.g. Alex Johnson"
            error={validationErrors.fullName}
            required
          />
          <Input
            label="College / Corporate Email"
            value={profile.email}
            disabled
            className="bg-surface-hover/70 cursor-not-allowed text-text-muted"
            title="Email is tied to your login account"
          />
          <Input
            label="Contact Phone"
            value={profile.phone || ''}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            placeholder="e.g. +91 9876543210"
            error={validationErrors.phone}
          />
          <div className="space-y-1.5">
            <label htmlFor="gender-select" className="block text-xs font-medium text-text-primary">
              Gender
            </label>
            <select
              id="gender-select"
              value={profile.gender || ''}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  gender: (e.target.value as CompleteStudentProfile['gender']) || null,
                })
              }
              className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* 3. Academic Information */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">2. Academic Information</CardTitle>
          <CardDescription>
            Institutional credentials used to calculate automatic eligibility for placement drives.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="College / University Name *"
              value={profile.collegeName}
              onChange={(e) => setProfile({ ...profile, collegeName: e.target.value })}
              placeholder="e.g. Institute of Engineering & Technology"
              error={validationErrors.collegeName}
              required
            />
            <Input
              label="Degree Program *"
              value={profile.degree}
              onChange={(e) => setProfile({ ...profile, degree: e.target.value })}
              placeholder="e.g. B.Tech, M.Tech, MCA"
              error={validationErrors.degree}
              required
            />
            <Input
              label="Department / Branch *"
              value={profile.department}
              onChange={(e) => setProfile({ ...profile, department: e.target.value })}
              placeholder="e.g. Computer Science and Engineering"
              error={validationErrors.department}
              required
            />
            <Input
              label="University Roll Number *"
              value={profile.rollNumber}
              onChange={(e) => setProfile({ ...profile, rollNumber: e.target.value })}
              placeholder="e.g. 2021CS104"
              error={validationErrors.rollNumber}
              required
            />
            <Input
              label="Graduation Year *"
              type="number"
              value={profile.batchYear || ''}
              onChange={(e) => setProfile({ ...profile, batchYear: Number(e.target.value) })}
              placeholder="2025"
              error={validationErrors.batchYear}
              required
            />
            <Input
              label="Cumulative CGPA (0.00 - 10.00) *"
              type="number"
              step="0.01"
              value={profile.cgpa || ''}
              onChange={(e) => setProfile({ ...profile, cgpa: Number(e.target.value) })}
              placeholder="e.g. 8.75"
              error={validationErrors.cgpa}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            <Input
              label="10th Percentage (%)"
              type="number"
              step="0.1"
              value={profile.tenthPercentage ?? ''}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  tenthPercentage: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder="e.g. 92.4"
              error={validationErrors.tenthPercentage}
            />
            <Input
              label="12th Percentage (%)"
              type="number"
              step="0.1"
              value={profile.twelfthPercentage ?? ''}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  twelfthPercentage: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder="e.g. 89.0"
              error={validationErrors.twelfthPercentage}
            />
            <Input
              label="Active Backlogs"
              type="number"
              value={profile.activeBacklogs}
              onChange={(e) => setProfile({ ...profile, activeBacklogs: Number(e.target.value) })}
              placeholder="0"
              error={validationErrors.activeBacklogs}
            />
            <Input
              label="Backlogs Cleared"
              type="number"
              value={profile.totalBacklogsCleared}
              onChange={(e) =>
                setProfile({ ...profile, totalBacklogsCleared: Number(e.target.value) })
              }
              placeholder="0"
              error={validationErrors.totalBacklogsCleared}
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. Skills & Competencies */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">3. Skills & Competencies</CardTitle>
          <CardDescription>
            Highlight technical proficiencies, frameworks, tools, and soft skills.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="Skill (e.g. TypeScript, React, SQL)"
              className="flex-1"
            />
            <select
              value={newSkillCategory}
              onChange={(e) =>
                setNewSkillCategory(e.target.value as StudentSkillInput['category'])
              }
              className="h-10 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
            >
              <option value="technical">Technical</option>
              <option value="tool">Tool / DevOps</option>
              <option value="soft">Soft Skill</option>
              <option value="language">Language</option>
              <option value="other">Other</option>
            </select>
            <select
              value={newSkillProficiency}
              onChange={(e) =>
                setNewSkillProficiency(e.target.value as StudentSkillInput['proficiency'])
              }
              className="h-10 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
            <Button type="button" variant="outline" size="md" onClick={handleAddSkill}>
              + Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {skills.length === 0 ? (
              <p className="text-xs text-text-muted italic">No skills added yet.</p>
            ) : (
              skills.map((skill, index) => (
                <Badge
                  key={index}
                  variant={skill.category === 'technical' ? 'default' : 'info'}
                  className="px-2.5 py-1 text-xs flex items-center gap-1.5"
                >
                  <span>{skill.name}</span>
                  <span className="opacity-60 text-[10px]">({skill.proficiency})</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(index)}
                    className="hover:text-error ml-1 font-bold"
                    aria-label={`Remove skill ${skill.name}`}
                  >
                    ×
                  </button>
                </Badge>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 5. Projects */}
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg font-semibold">4. Projects</CardTitle>
            <CardDescription>Notable academic, open-source, or personal projects.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAddProject}>
            + Add Project
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {projects.length === 0 ? (
            <p className="text-xs text-text-muted italic">No projects listed.</p>
          ) : (
            projects.map((proj, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border border-border bg-surface-hover/30 space-y-3 relative"
              >
                <div className="flex justify-between items-start gap-2">
                  <Input
                    label="Project Title"
                    value={proj.title}
                    onChange={(e) => handleUpdateProject(idx, 'title', e.target.value)}
                    placeholder="e.g. Distributed Task Scheduler"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveProject(idx)}
                    className="text-error hover:bg-error-bg/20 mt-6"
                  >
                    Remove
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-text-primary">Description</label>
                  <textarea
                    rows={2}
                    value={proj.description}
                    onChange={(e) => handleUpdateProject(idx, 'description', e.target.value)}
                    placeholder="Summary of architecture, features, and outcome..."
                    className="w-full rounded-md border border-border bg-surface p-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Technologies (comma-separated)"
                    value={proj.technologies.join(', ')}
                    onChange={(e) =>
                      handleUpdateProject(
                        idx,
                        'technologies',
                        e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                      )
                    }
                    placeholder="e.g. Go, Docker, Redis"
                  />
                  <Input
                    label="Project URL"
                    value={proj.projectUrl || ''}
                    onChange={(e) => handleUpdateProject(idx, 'projectUrl', e.target.value)}
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 6. Certifications */}
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg font-semibold">5. Certifications</CardTitle>
            <CardDescription>Industry or technical credential verifications.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAddCertification}>
            + Add Certification
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          {certifications.length === 0 ? (
            <p className="text-xs text-text-muted italic">No certifications listed.</p>
          ) : (
            certifications.map((cert, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-border bg-surface-hover/30 grid grid-cols-1 md:grid-cols-4 gap-2 items-center"
              >
                <Input
                  label="Certification Name"
                  value={cert.name}
                  onChange={(e) => handleUpdateCertification(idx, 'name', e.target.value)}
                  placeholder="e.g. AWS Solutions Architect"
                />
                <Input
                  label="Issuing Organization"
                  value={cert.issuingOrganization}
                  onChange={(e) =>
                    handleUpdateCertification(idx, 'issuingOrganization', e.target.value)
                  }
                  placeholder="e.g. Amazon Web Services"
                />
                <Input
                  label="Credential URL"
                  value={cert.credentialUrl || ''}
                  onChange={(e) =>
                    handleUpdateCertification(idx, 'credentialUrl', e.target.value)
                  }
                  placeholder="https://..."
                />
                <div className="flex items-end gap-2">
                  <Input
                    label="Issue Date"
                    type="date"
                    value={cert.issueDate || ''}
                    onChange={(e) => handleUpdateCertification(idx, 'issueDate', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCertification(idx)}
                    className="text-error mb-0.5"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 7. Achievements */}
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg font-semibold">6. Achievements</CardTitle>
            <CardDescription>Competitive programming, hackathons, and awards.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAddAchievement}>
            + Add Achievement
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          {achievements.length === 0 ? (
            <p className="text-xs text-text-muted italic">No achievements listed.</p>
          ) : (
            achievements.map((ach, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-border bg-surface-hover/30 grid grid-cols-1 md:grid-cols-3 gap-2 items-center"
              >
                <Input
                  label="Title"
                  value={ach.title}
                  onChange={(e) => handleUpdateAchievement(idx, 'title', e.target.value)}
                  placeholder="e.g. 1st Place - Smart India Hackathon"
                />
                <Input
                  label="Description"
                  value={ach.description}
                  onChange={(e) => handleUpdateAchievement(idx, 'description', e.target.value)}
                  placeholder="Brief summary..."
                />
                <div className="flex items-end gap-2">
                  <Input
                    label="Date"
                    type="date"
                    value={ach.date || ''}
                    onChange={(e) => handleUpdateAchievement(idx, 'date', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAchievement(idx)}
                    className="text-error mb-0.5"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 8. Professional & Social Links */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">7. Professional & Social Links</CardTitle>
          <CardDescription>
            Online portfolios, repositories, and verified profiles reviewed by recruiters.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="LinkedIn Profile"
            value={profile.linkedinUrl || ''}
            onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
            placeholder="https://linkedin.com/in/username"
            error={validationErrors.linkedinUrl}
          />
          <Input
            label="GitHub Profile"
            value={profile.githubUrl || ''}
            onChange={(e) => setProfile({ ...profile, githubUrl: e.target.value })}
            placeholder="https://github.com/username"
            error={validationErrors.githubUrl}
          />
          <Input
            label="Personal Portfolio"
            value={profile.portfolioUrl || ''}
            onChange={(e) => setProfile({ ...profile, portfolioUrl: e.target.value })}
            placeholder="https://yourportfolio.dev"
            error={validationErrors.portfolioUrl}
          />
        </CardContent>
      </Card>

      {/* Sticky Bottom Action Bar */}
      <div className="sticky bottom-4 z-10 p-4 rounded-lg bg-surface/90 backdrop-blur border border-border shadow-lg flex items-center justify-between">
        <p className="text-xs text-text-muted hidden sm:block">
          Changes are validated and stored securely in your institutional record.
        </p>
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? 'Saving Profile...' : 'Save Profile Changes'}
        </Button>
      </div>
    </form>
  );
}
