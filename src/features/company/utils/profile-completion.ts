import type { CompanyProfile } from '@/features/company/types';

export interface CompanyCompletionSection {
  id: string;
  label: string;
  completed: boolean;
  weight: number;
  description: string;
}

export interface CompanyProfileCompletionResult {
  percentage: number;
  sections: CompanyCompletionSection[];
  completedCount: number;
  totalCount: number;
  incompleteSections: CompanyCompletionSection[];
  isReadyForHiring: boolean;
}

/**
 * Calculates a company's profile completion percentage and section breakdown
 * based on actual, dynamic profile attributes.
 */
export function calculateCompanyProfileCompletion(
  profile: CompanyProfile | null | undefined
): CompanyProfileCompletionResult {
  if (!profile) {
    const emptySections: CompanyCompletionSection[] = [
      { id: 'identity', label: 'Company Identity', completed: false, weight: 20, description: 'Organization name and industry sector' },
      { id: 'description', label: 'Company Description', completed: false, weight: 20, description: 'Overview and mission statement' },
      { id: 'contact', label: 'Recruitment Contact', completed: false, weight: 15, description: 'Official email and phone number' },
      { id: 'location', label: 'Headquarters Location', completed: false, weight: 15, description: 'Operating office or campus city' },
      { id: 'logo', label: 'Corporate Logo', completed: false, weight: 10, description: 'High-resolution logo image' },
      { id: 'website', label: 'Official Website', completed: false, weight: 10, description: 'Company web address' },
      { id: 'details', label: 'Structure & Links', completed: false, weight: 10, description: 'Company size, founded year, or LinkedIn' },
    ];
    return {
      percentage: 0,
      sections: emptySections,
      completedCount: 0,
      totalCount: emptySections.length,
      incompleteSections: emptySections,
      isReadyForHiring: false,
    };
  }

  // 1. Company Identity (20%): Name and Industry
  const hasIdentity = Boolean(profile.name?.trim() && profile.industry?.trim());

  // 2. Company Description (20%): Substantive description
  const hasDescription = Boolean(profile.description && profile.description.trim().length >= 20);

  // 3. Recruitment Contact (15%): Email and/or phone
  const hasContact = Boolean(profile.companyEmail?.trim() || profile.companyPhone?.trim());

  // 4. Headquarters Location (15%): Operating location
  const hasLocation = Boolean(profile.location && profile.location.trim().length > 0);

  // 5. Corporate Logo (10%): Uploaded logo URL
  const hasLogo = Boolean(profile.logoUrl && profile.logoUrl.trim().length > 0);

  // 6. Official Website (10%): Valid website URL
  const hasWebsite = Boolean(profile.website && profile.website.trim().length > 0);

  // 7. Structure & Links (10%): Size, Founded Year, or LinkedIn
  const hasDetails = Boolean(
    profile.companySize?.trim() ||
    (profile.foundedYear && profile.foundedYear > 1800) ||
    profile.linkedinUrl?.trim()
  );

  const sections: CompanyCompletionSection[] = [
    {
      id: 'identity',
      label: 'Company Identity',
      completed: hasIdentity,
      weight: 20,
      description: hasIdentity ? 'Name and industry recorded' : 'Provide company name and industry',
    },
    {
      id: 'description',
      label: 'Company Description',
      completed: hasDescription,
      weight: 20,
      description: hasDescription ? 'Organization overview recorded' : 'Add an overview of your organization (min 20 chars)',
    },
    {
      id: 'contact',
      label: 'Recruitment Contact',
      completed: hasContact,
      weight: 15,
      description: hasContact ? 'Recruiter contact channels established' : 'Add official email or contact phone',
    },
    {
      id: 'location',
      label: 'Headquarters Location',
      completed: hasLocation,
      weight: 15,
      description: hasLocation ? 'Operating headquarters registered' : 'Specify office location or headquarters',
    },
    {
      id: 'logo',
      label: 'Corporate Logo',
      completed: hasLogo,
      weight: 10,
      description: hasLogo ? 'Corporate logo on file' : 'Upload company branding/logo',
    },
    {
      id: 'website',
      label: 'Official Website',
      completed: hasWebsite,
      weight: 10,
      description: hasWebsite ? 'Official website linked' : 'Provide your official corporate website',
    },
    {
      id: 'details',
      label: 'Structure & Links',
      completed: hasDetails,
      weight: 10,
      description: hasDetails ? 'Organizational metadata recorded' : 'Add team size, founding year, or LinkedIn URL',
    },
  ];

  const percentage = sections.reduce(
    (total, section) => (section.completed ? total + section.weight : total),
    0
  );

  const completedCount = sections.filter((s) => s.completed).length;
  const incompleteSections = sections.filter((s) => !s.completed);

  // Ready for hiring when core identity, contact, location, description are present and score >= 60%
  const isReadyForHiring = hasIdentity && hasContact && hasLocation && hasDescription && percentage >= 60;

  return {
    percentage,
    sections,
    completedCount,
    totalCount: sections.length,
    incompleteSections,
    isReadyForHiring,
  };
}
