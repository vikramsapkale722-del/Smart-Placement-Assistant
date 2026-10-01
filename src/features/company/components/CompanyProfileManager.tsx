'use client';

import * as React from 'react';
import Link from 'next/link';
import type { CompanyProfile, CompanyProfileInput } from '@/features/company/types';
import { companyProfileSchema, validateCompanyLogo } from '@/features/company/schemas';
import { saveCompanyProfileAction, uploadCompanyLogoAction } from '@/features/company/actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { CompanyVerificationBanner } from '@/features/company/components/CompanyVerificationBanner';

interface CompanyProfileManagerProps {
  initialProfile: CompanyProfile | null;
  userEmail: string;
}

const INDUSTRY_SUGGESTIONS = [
  'Information Technology & Software',
  'Financial Services & Fintech',
  'E-Commerce & Retail',
  'Consulting & Professional Services',
  'Healthcare & Biotechnology',
  'Manufacturing & Automotive',
  'Telecommunications',
  'Artificial Intelligence & Data',
];

const COMPANY_SIZE_OPTIONS = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '501-1000 employees',
  '1000+ employees',
];

const COMPANY_TYPE_OPTIONS = ['Product', 'Service', 'Startup', 'Enterprise', 'Non-profit', 'Other'];

export function CompanyProfileManager({ initialProfile, userEmail }: CompanyProfileManagerProps) {
  const [profile, setProfile] = React.useState<CompanyProfile | null>(initialProfile);
  const [isEditing, setIsEditing] = React.useState<boolean>(initialProfile === null);
  const [formData, setFormData] = React.useState<CompanyProfileInput>({
    name: initialProfile?.name || '',
    industry: initialProfile?.industry || '',
    description: initialProfile?.description || '',
    website: initialProfile?.website || '',
    logoUrl: initialProfile?.logoUrl || '',
    companyEmail: initialProfile?.companyEmail || userEmail,
    companyPhone: initialProfile?.companyPhone || '',
    location: initialProfile?.location || '',
    companySize: initialProfile?.companySize || '51-200 employees',
    foundedYear: initialProfile?.foundedYear ?? null,
    linkedinUrl: initialProfile?.linkedinUrl || '',
    companyType: initialProfile?.companyType || 'Product',
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync form data if initialProfile updates
  React.useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
      setFormData({
        name: initialProfile.name || '',
        industry: initialProfile.industry || '',
        description: initialProfile.description || '',
        website: initialProfile.website || '',
        logoUrl: initialProfile.logoUrl || '',
        companyEmail: initialProfile.companyEmail || userEmail,
        companyPhone: initialProfile.companyPhone || '',
        location: initialProfile.location || '',
        companySize: initialProfile.companySize || '51-200 employees',
        foundedYear: initialProfile.foundedYear ?? null,
        linkedinUrl: initialProfile.linkedinUrl || '',
        companyType: initialProfile.companyType || 'Product',
      });
    }
  }, [initialProfile, userEmail]);

  // Handle Logo Upload
  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateCompanyLogo({ size: file.size, type: file.type });
    if (!validation.valid) {
      setFeedback({ type: 'error', message: validation.error || 'Invalid logo image' });
      return;
    }

    setIsUploadingLogo(true);
    setFeedback(null);

    const data = new FormData();
    data.append('logo', file);

    const res = await uploadCompanyLogoAction(data);
    setIsUploadingLogo(false);

    if (res.success && res.data) {
      setFormData((prev) => ({ ...prev, logoUrl: res.data }));
      if (profile) {
        setProfile((prev) => (prev ? { ...prev, logoUrl: res.data! } : null));
      }
      setFeedback({ type: 'success', message: 'Company logo uploaded successfully.' });
    } else {
      setFeedback({ type: 'error', message: res.error || 'Logo upload failed.' });
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setValidationErrors({});

    // Client-side Validation via Zod
    const result = companyProfileSchema.safeParse(formData);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (typeof field === 'string' && !errs[field]) {
          errs[field] = issue.message;
        }
      });
      setValidationErrors(errs);
      setFeedback({
        type: 'error',
        message: 'Please review and fix the validation errors before saving.',
      });
      return;
    }

    setIsSubmitting(true);
    const res = await saveCompanyProfileAction(formData);
    setIsSubmitting(false);

    if (res.success && res.data) {
      setProfile(res.data);
      setIsEditing(false);
      setFeedback({
        type: 'success',
        message: 'Company profile successfully saved.',
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Failed to save company profile. Please try again.',
      });
    }
  };

  // Cancel edit
  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name,
        industry: profile.industry,
        description: profile.description || '',
        website: profile.website || '',
        logoUrl: profile.logoUrl || '',
        companyEmail: profile.companyEmail || userEmail,
        companyPhone: profile.companyPhone || '',
        location: profile.location || '',
        companySize: profile.companySize || '51-200 employees',
        foundedYear: profile.foundedYear ?? null,
        linkedinUrl: profile.linkedinUrl || '',
        companyType: profile.companyType || 'Product',
      });
      setIsEditing(false);
      setValidationErrors({});
      setFeedback(null);
    } else {
      setFeedback({
        type: 'error',
        message: 'Profile setup is required to establish your recruiting workspace.',
      });
    }
  };

  // Render Empty State (No Profile Created Yet and not editing)
  if (!profile && !isEditing) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <Card className="border-border shadow-sm text-center py-12 px-6">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary mx-auto flex items-center justify-center">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary">
              Complete your company profile
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Establish your organization&apos;s verified recruitment presence to host campus placement
              drives, configure eligibility criteria, and evaluate candidate applications.
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto"
              >
                Create Company Profile
              </Button>
            </div>
            <div className="pt-4 border-t border-border/60 text-xs text-text-muted">
              Logged in as <span className="font-mono text-text-primary">{userEmail}</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Top Bar Navigation & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/company"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Recruiter Gateway
            </Link>
            <span className="text-text-muted text-xs">•</span>
            <span className="text-xs text-text-muted">Organization Profile</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            {isEditing ? (profile ? 'Edit Company Profile' : 'Create Company Profile') : profile?.name}
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {isEditing
              ? 'Maintain accurate organizational data for candidate recruitment and drive administration.'
              : `${profile?.industry} • ${profile?.location || 'Location Not Specified'}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {profile && !isEditing && (
            <>
              {profile.isVerified ? (
                <Badge variant="success" className="px-3 py-1">
                  ✓ Verified Employer
                </Badge>
              ) : (
                <Badge variant="warning" className="px-3 py-1">
                  ⏳ Verification Pending
                </Badge>
              )}
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsEditing(true)}
                className="shadow-sm"
              >
                Edit Profile
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="alert"
          className={`p-4 rounded-xl border text-sm flex items-start justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-success/10 border-success/30 text-success'
              : 'bg-destructive/10 border-destructive/30 text-destructive'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{feedback.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold opacity-70 hover:opacity-100"
            aria-label="Dismiss feedback"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* VIEW MODE */}
      {!isEditing && profile && (
        <div className="space-y-6">
          {/* Company Verification Status Banner (TASK-008) */}
          <CompanyVerificationBanner
            isVerified={profile.isVerified}
            verifiedAt={profile.verifiedAt}
          />

          {/* Header Card with Logo and Core Identity */}
          <Card className="border-border shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-surface-hover border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                {profile.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.logoUrl}
                    alt={`${profile.name} logo`}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl font-bold text-text-muted">
                    {profile.name.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-text-primary">{profile.name}</h2>
                  <Badge variant="default">{profile.companyType || 'Product'}</Badge>
                </div>
                <p className="text-sm text-text-secondary">{profile.industry}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted pt-1">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {profile.location}
                    </span>
                  )}
                  {profile.companySize && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {profile.companySize}
                    </span>
                  )}
                  {profile.foundedYear && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Founded {profile.foundedYear}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* About / Description */}
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-text-primary">
                  About the Organization
                </CardTitle>
                <CardDescription className="text-xs text-text-muted">
                  Overview presented to candidates during placement drives.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">
                  {profile.description || 'No description provided yet.'}
                </p>
              </CardContent>
            </Card>

            {/* Official Contact & Links */}
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-text-primary">
                  Contact & Online Presence
                </CardTitle>
                <CardDescription className="text-xs text-text-muted">
                  Official recruitment coordinates and corporate links.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                  <span className="text-text-muted text-xs">Official Email:</span>
                  <span className="font-medium text-text-primary text-xs">
                    {profile.companyEmail || userEmail}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                  <span className="text-text-muted text-xs">Phone:</span>
                  <span className="font-medium text-text-primary text-xs">
                    {profile.companyPhone || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                  <span className="text-text-muted text-xs">Website:</span>
                  {profile.website ? (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs font-medium truncate max-w-[200px]"
                    >
                      {profile.website} ↗
                    </a>
                  ) : (
                    <span className="text-text-muted text-xs">Not specified</span>
                  )}
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-text-muted text-xs">LinkedIn:</span>
                  {profile.linkedinUrl ? (
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs font-medium truncate max-w-[200px]"
                    >
                      View LinkedIn Profile ↗
                    </a>
                  ) : (
                    <span className="text-text-muted text-xs">Not specified</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Verification Status Notice */}
          <Card className="border-border/60 bg-surface/50">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="text-lg">ℹ️</div>
              <div className="text-xs text-text-secondary leading-relaxed">
                <span className="font-semibold text-text-primary">Corporate Placement Verification: </span>
                {profile.isVerified
                  ? 'Your organization is verified by university administrators. You have complete authorization to publish campus job postings and review student applicants.'
                  : 'Your organization profile is under review by portal placement administrators. You may update your profile details at any time.'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* EDIT MODE (Form) */}
      {isEditing && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Core Company Information */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-text-primary">
                1. Core Organization Identity
              </CardTitle>
              <CardDescription className="text-xs text-text-muted">
                Essential corporate details displayed across the recruitment portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="company-name" className="block text-xs font-semibold text-text-secondary mb-1">
                    Company Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="company-name"
                    type="text"
                    required
                    placeholder="e.g. Acme Technologies Inc."
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    error={validationErrors.name}
                    aria-required="true"
                  />
                </div>

                <div>
                  <label htmlFor="company-industry" className="block text-xs font-semibold text-text-secondary mb-1">
                    Industry Sector <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="company-industry"
                    type="text"
                    required
                    placeholder="e.g. Information Technology"
                    list="industry-suggestions"
                    value={formData.industry}
                    onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
                    error={validationErrors.industry}
                    aria-required="true"
                  />
                  <datalist id="industry-suggestions">
                    {INDUSTRY_SUGGESTIONS.map((ind) => (
                      <option key={ind} value={ind} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="company-type" className="block text-xs font-semibold text-text-secondary mb-1">
                    Company Type
                  </label>
                  <select
                    id="company-type"
                    value={formData.companyType || 'Product'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, companyType: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {COMPANY_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="company-size" className="block text-xs font-semibold text-text-secondary mb-1">
                    Company Size
                  </label>
                  <select
                    id="company-size"
                    value={formData.companySize || '51-200 employees'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, companySize: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {COMPANY_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="company-founded" className="block text-xs font-semibold text-text-secondary mb-1">
                    Founded Year
                  </label>
                  <Input
                    id="company-founded"
                    type="number"
                    min="1800"
                    max="2100"
                    placeholder="e.g. 2012"
                    value={formData.foundedYear !== null ? String(formData.foundedYear) : ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        foundedYear: e.target.value ? parseInt(e.target.value, 10) : null,
                      }))
                    }
                    error={validationErrors.foundedYear}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Company Logo */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-text-primary">
                2. Brand Logo
              </CardTitle>
              <CardDescription className="text-xs text-text-muted">
                Upload your official company emblem (JPEG, PNG, or WebP up to 2MB).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-surface-hover border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                  {formData.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={formData.logoUrl}
                      alt="Company Logo Preview"
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <span className="text-xs text-text-muted text-center px-1">No Logo</span>
                  )}
                </div>

                <div className="space-y-2 flex-1 w-full">
                  <label
                    htmlFor="logo-file-input"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface text-text-primary text-xs font-medium cursor-pointer hover:bg-surface-hover transition-colors"
                  >
                    <span>{isUploadingLogo ? 'Uploading Logo...' : 'Choose Logo File'}</span>
                    <input
                      id="logo-file-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleLogoSelect}
                      disabled={isUploadingLogo}
                    />
                  </label>
                  <p className="text-xs text-text-muted">
                    Square or horizontal logos on transparent background look best.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Contact & Location */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-text-primary">
                3. Contact Coordinates & Headquarters
              </CardTitle>
              <CardDescription className="text-xs text-text-muted">
                Coordinates for administrative verification and communication.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="company-email" className="block text-xs font-semibold text-text-secondary mb-1">
                    Official Recruitment Email
                  </label>
                  <Input
                    id="company-email"
                    type="email"
                    placeholder="recruiting@example.com"
                    value={formData.companyEmail || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, companyEmail: e.target.value }))}
                    error={validationErrors.companyEmail}
                  />
                </div>

                <div>
                  <label htmlFor="company-phone" className="block text-xs font-semibold text-text-secondary mb-1">
                    Contact Phone Number
                  </label>
                  <Input
                    id="company-phone"
                    type="tel"
                    placeholder="+1 555 123 4567"
                    value={formData.companyPhone || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, companyPhone: e.target.value }))}
                    error={validationErrors.companyPhone}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="company-location" className="block text-xs font-semibold text-text-secondary mb-1">
                  Headquarters / Office Location
                </label>
                <Input
                  id="company-location"
                  type="text"
                  placeholder="e.g. Bengaluru, India or San Francisco, CA"
                  value={formData.location || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  error={validationErrors.location}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Web & Social Links */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-text-primary">
                4. Web & Online Presence
              </CardTitle>
              <CardDescription className="text-xs text-text-muted">
                Official URLs verified by candidates and portal administrators.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="company-website" className="block text-xs font-semibold text-text-secondary mb-1">
                    Company Website
                  </label>
                  <Input
                    id="company-website"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.website || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                    error={validationErrors.website}
                  />
                </div>

                <div>
                  <label htmlFor="company-linkedin" className="block text-xs font-semibold text-text-secondary mb-1">
                    LinkedIn Organization Page
                  </label>
                  <Input
                    id="company-linkedin"
                    type="url"
                    placeholder="https://linkedin.com/company/example"
                    value={formData.linkedinUrl || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, linkedinUrl: e.target.value }))}
                    error={validationErrors.linkedinUrl}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 5: About / Description */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-text-primary">
                5. About the Organization
              </CardTitle>
              <CardDescription className="text-xs text-text-muted">
                Detailed overview of your company mission, culture, and campus opportunities.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <textarea
                id="company-description"
                rows={5}
                placeholder="Describe your organization, key technical products, market footprint, and what makes working at your company exciting for students..."
                value={formData.description || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                maxLength={2000}
                className="w-full p-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed"
                aria-label="Company Description"
              />
              <div className="flex justify-between items-center text-xs text-text-muted">
                <span>Maximum 2000 characters</span>
                <span>{(formData.description || '').length} / 2000</span>
              </div>
              {validationErrors.description && (
                <p className="text-xs text-destructive">{validationErrors.description}</p>
              )}
            </CardContent>
          </Card>

          {/* Form Actions Footer */}
          <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-3 pt-2">
            {profile && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              className="w-full sm:w-auto min-w-[140px]"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : profile ? (
                'Save Changes'
              ) : (
                'Create Profile'
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
