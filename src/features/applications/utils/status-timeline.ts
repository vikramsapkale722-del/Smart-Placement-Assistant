import type {
  ApplicationStatus,
  ApplicationStatusHistoryItem,
} from '@/features/applications/types';

export interface StatusMeta {
  label: string;
  badgeVariant: 'default' | 'info' | 'warning' | 'success' | 'error';
  description: string;
}

export const APPLICATION_STATUS_MAP: Record<ApplicationStatus, StatusMeta> = {
  applied: {
    label: 'Applied',
    badgeVariant: 'info',
    description: 'Application successfully received and logged in the placement pipeline.',
  },
  in_review: {
    label: 'In Review',
    badgeVariant: 'warning',
    description: 'Recruitment team is screening your profile and academic credentials.',
  },
  shortlisted: {
    label: 'Shortlisted',
    badgeVariant: 'default',
    description: 'Congratulations! You have been shortlisted for interviews/assessments.',
  },
  offered: {
    label: 'Offered',
    badgeVariant: 'success',
    description: 'Formal placement offer extended by the recruiting organization.',
  },
  rejected: {
    label: 'Rejected',
    badgeVariant: 'error',
    description: 'Application was not selected for further evaluation in this drive.',
  },
  withdrawn: {
    label: 'Withdrawn',
    badgeVariant: 'default',
    description: 'Application voluntarily withdrawn by candidate.',
  },
};

export function formatApplicationStatus(status: ApplicationStatus): StatusMeta {
  return (
    APPLICATION_STATUS_MAP[status] || {
      label: status,
      badgeVariant: 'default',
      description: 'Application status update on file.',
    }
  );
}

export type TimelineStageStatus =
  | 'completed'
  | 'current'
  | 'upcoming'
  | 'terminal_rejected'
  | 'terminal_withdrawn';

export interface TimelineStage {
  key: string;
  label: string;
  status: TimelineStageStatus;
  timestamp?: string | null;
  remarks?: string | null;
}

const STANDARD_PROGRESSION: { key: ApplicationStatus; label: string }[] = [
  { key: 'applied', label: 'Applied' },
  { key: 'in_review', label: 'In Review' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'offered', label: 'Offered' },
];

/**
 * Builds a clear, accurate recruitment progress timeline based on actual application status history.
 * Ensures future stages are never rendered as completed, and terminal statuses are clearly highlighted.
 */
export function getTimelineStages(
  currentStatus: ApplicationStatus,
  history: ApplicationStatusHistoryItem[] = []
): TimelineStage[] {
  const historyMap = new Map<string, ApplicationStatusHistoryItem>();
  for (const item of history) {
    historyMap.set(item.toStatus, item);
  }

  // Handle Terminal: Rejected
  if (currentStatus === 'rejected') {
    const rejectItem = historyMap.get('rejected');
    const stages: TimelineStage[] = [];

    // Find prior stage before rejection if available
    const fromStatus = rejectItem?.fromStatus;
    const priorIndex = STANDARD_PROGRESSION.findIndex((s) => s.key === fromStatus);
    const stopIndex = priorIndex >= 0 ? priorIndex : 0;

    for (let i = 0; i <= stopIndex; i++) {
      const step = STANDARD_PROGRESSION[i];
      const stepHist = historyMap.get(step.key);
      stages.push({
        key: step.key,
        label: step.label,
        status: 'completed',
        timestamp: stepHist?.createdAt || null,
        remarks: stepHist?.remarks || null,
      });
    }

    stages.push({
      key: 'rejected',
      label: 'Rejected',
      status: 'terminal_rejected',
      timestamp: rejectItem?.createdAt || null,
      remarks: rejectItem?.remarks || 'Not selected for further rounds',
    });

    return stages;
  }

  // Handle Terminal: Withdrawn
  if (currentStatus === 'withdrawn') {
    const withdrawItem = historyMap.get('withdrawn');
    const stages: TimelineStage[] = [];

    const fromStatus = withdrawItem?.fromStatus;
    const priorIndex = STANDARD_PROGRESSION.findIndex((s) => s.key === fromStatus);
    const stopIndex = priorIndex >= 0 ? priorIndex : 0;

    for (let i = 0; i <= stopIndex; i++) {
      const step = STANDARD_PROGRESSION[i];
      const stepHist = historyMap.get(step.key);
      stages.push({
        key: step.key,
        label: step.label,
        status: 'completed',
        timestamp: stepHist?.createdAt || null,
        remarks: stepHist?.remarks || null,
      });
    }

    stages.push({
      key: 'withdrawn',
      label: 'Withdrawn',
      status: 'terminal_withdrawn',
      timestamp: withdrawItem?.createdAt || null,
      remarks: withdrawItem?.remarks || 'Voluntarily withdrawn',
    });

    return stages;
  }

  // Active progression: applied -> in_review -> shortlisted -> offered
  const currentIndex = STANDARD_PROGRESSION.findIndex((s) => s.key === currentStatus);
  const effectiveCurrentIndex = currentIndex >= 0 ? currentIndex : 0;

  return STANDARD_PROGRESSION.map((step, idx) => {
    const stepHist = historyMap.get(step.key);
    let stageStatus: TimelineStageStatus = 'upcoming';

    if (idx < effectiveCurrentIndex) {
      stageStatus = 'completed';
    } else if (idx === effectiveCurrentIndex) {
      stageStatus = 'current';
    } else {
      stageStatus = 'upcoming';
    }

    return {
      key: step.key,
      label: step.label,
      status: stageStatus,
      timestamp: stepHist?.createdAt || null,
      remarks: stepHist?.remarks || null,
    };
  });
}

/**
 * Returns an accessible icon/glyph for a given application status so UI doesn't rely solely on color.
 */
export function getStatusIcon(status: ApplicationStatus | string): string {
  switch (status) {
    case 'applied':
      return '📋';
    case 'in_review':
      return '🔍';
    case 'shortlisted':
      return '★';
    case 'offered':
      return '✓';
    case 'rejected':
      return '✕';
    case 'withdrawn':
      return '⊘';
    default:
      return '•';
  }
}

export interface HistoryAttribution {
  actor: 'candidate' | 'recruiter' | 'system';
  label: string;
  badgeVariant: 'default' | 'success' | 'warning' | 'error' | 'info';
}

/**
 * Resolves the actor attribution for an audit history entry based on status transitions and author.
 */
export function getHistoryAttribution(item: ApplicationStatusHistoryItem): HistoryAttribution {
  if (item.fromStatus === null && item.toStatus === 'applied') {
    return {
      actor: 'candidate',
      label: 'Candidate Submission',
      badgeVariant: 'info',
    };
  }

  if (item.toStatus === 'withdrawn') {
    return {
      actor: 'candidate',
      label: 'Candidate Withdrawal',
      badgeVariant: 'default',
    };
  }

  if (['in_review', 'shortlisted', 'offered', 'rejected'].includes(item.toStatus)) {
    return {
      actor: 'recruiter',
      label: 'Recruiter / Hiring Team',
      badgeVariant: 'warning',
    };
  }

  return {
    actor: 'system',
    label: 'Placement System Automated',
    badgeVariant: 'default',
  };
}

export interface TerminalOutcomeInfo {
  isTerminal: boolean;
  title: string;
  description: string;
  badgeVariant: 'default' | 'success' | 'error';
  icon: string;
}

/**
 * Provides metadata for clear terminal outcome card presentation in the audit modal.
 */
export function getTerminalOutcomeInfo(status: ApplicationStatus | string): TerminalOutcomeInfo {
  if (status === 'offered') {
    return {
      isTerminal: true,
      title: 'Official Placement Offer Extended',
      description:
        'Congratulations! This candidate application has reached the terminal offer stage. An official placement offer has been confirmed by the hiring organization.',
      badgeVariant: 'success',
      icon: '✓',
    };
  }

  if (status === 'rejected') {
    return {
      isTerminal: true,
      title: 'Application Concluded — Not Selected',
      description:
        'The recruitment committee has completed evaluation for this stage. This application has reached its terminal outcome and will not advance to subsequent rounds.',
      badgeVariant: 'error',
      icon: '✕',
    };
  }

  if (status === 'withdrawn') {
    return {
      isTerminal: true,
      title: 'Application Voluntarily Withdrawn',
      description:
        'This application was voluntarily withdrawn by the candidate. No further review or stage transitions are scheduled.',
      badgeVariant: 'default',
      icon: '⊘',
    };
  }

  return {
    isTerminal: false,
    title: 'Active Recruitment Process',
    description: 'This application is actively progressing through the recruitment pipeline.',
    badgeVariant: 'default',
    icon: '⏳',
  };
}

/**
 * Formats a user-friendly headline for a status transition.
 */
export function formatTransitionTitle(fromStatus: string | null, toStatus: string): string {
  if (!fromStatus) {
    return 'Application Submitted & Recorded';
  }

  const fromMeta = formatApplicationStatus(fromStatus as ApplicationStatus);
  const toMeta = formatApplicationStatus(toStatus as ApplicationStatus);

  if (toStatus === 'offered') {
    return `Final Offer Extended (from ${fromMeta.label})`;
  }

  if (toStatus === 'rejected') {
    return `Application Concluded (from ${fromMeta.label})`;
  }

  if (toStatus === 'withdrawn') {
    return `Application Withdrawn (from ${fromMeta.label})`;
  }

  return `Stage Transition: ${fromMeta.label} → ${toMeta.label}`;
}
