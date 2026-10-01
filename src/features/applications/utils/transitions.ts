import type { ApplicationStatus } from '@/features/applications/types';
import { formatApplicationStatus } from '@/features/applications/utils/status-timeline';

/**
 * Authoritative Recruiter Stage Transition Rules
 * Supported sequential lifecycle:
 * applied -> in_review -> shortlisted -> offered
 * Terminal outcomes: rejected, withdrawn, offered
 */
export const VALID_RECRUITER_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  applied: ['in_review', 'rejected'],
  in_review: ['shortlisted', 'rejected'],
  shortlisted: ['offered', 'rejected'],
  offered: [],
  rejected: [],
  withdrawn: [],
};

export const TERMINAL_STATUSES: readonly ApplicationStatus[] = [
  'offered',
  'rejected',
  'withdrawn',
] as const;

export interface TransitionValidationResult {
  isValid: boolean;
  isTerminal: boolean;
  currentStatus: ApplicationStatus;
  targetStatus: ApplicationStatus;
  allowedNextStatuses: ApplicationStatus[];
  error?: string;
}

/**
 * Checks if a status represents a final/terminal outcome in the recruitment pipeline.
 */
export function isTerminalStatus(status: ApplicationStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/**
 * Returns allowed next stage transitions for a given application status.
 */
export function getAllowedNextStatuses(currentStatus: ApplicationStatus): ApplicationStatus[] {
  return VALID_RECRUITER_TRANSITIONS[currentStatus] || [];
}

/**
 * Authoritatively validates if a stage transition is permitted according to pipeline lifecycle rules.
 */
export function validateStatusTransition(
  currentStatus: ApplicationStatus,
  targetStatus: ApplicationStatus
): TransitionValidationResult {
  const allowed = getAllowedNextStatuses(currentStatus);
  const isTerminal = isTerminalStatus(currentStatus);

  if (currentStatus === targetStatus) {
    return {
      isValid: false,
      isTerminal,
      currentStatus,
      targetStatus,
      allowedNextStatuses: allowed,
      error: `Application is already at stage "${formatApplicationStatus(currentStatus).label}".`,
    };
  }

  if (currentStatus === 'withdrawn') {
    return {
      isValid: false,
      isTerminal: true,
      currentStatus,
      targetStatus,
      allowedNextStatuses: [],
      error: 'Cannot modify an application that has been voluntarily withdrawn by the student candidate.',
    };
  }

  if (currentStatus === 'rejected') {
    return {
      isValid: false,
      isTerminal: true,
      currentStatus,
      targetStatus,
      allowedNextStatuses: [],
      error: 'Cannot transition an application that has reached the terminal Rejected stage.',
    };
  }

  if (currentStatus === 'offered') {
    return {
      isValid: false,
      isTerminal: true,
      currentStatus,
      targetStatus,
      allowedNextStatuses: [],
      error: 'Cannot transition an application that has reached the terminal Offered stage.',
    };
  }

  if (!allowed.includes(targetStatus)) {
    const allowedLabels = allowed.map((s) => `"${formatApplicationStatus(s).label}"`).join(' or ');
    return {
      isValid: false,
      isTerminal,
      currentStatus,
      targetStatus,
      allowedNextStatuses: allowed,
      error: `Invalid recruitment pipeline transition from "${formatApplicationStatus(currentStatus).label}" to "${formatApplicationStatus(targetStatus).label}". Permitted next stages: ${allowedLabels || 'None (Terminal)'}.`,
    };
  }

  return {
    isValid: true,
    isTerminal: isTerminalStatus(targetStatus),
    currentStatus,
    targetStatus,
    allowedNextStatuses: allowed,
  };
}
