'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type {
  ApplicationStatus,
  ApplicationStatusHistoryItem,
} from '@/features/applications/types';
import {
  formatApplicationStatus,
  getStatusIcon,
  getHistoryAttribution,
  getTerminalOutcomeInfo,
  formatTransitionTitle,
} from '@/features/applications/utils/status-timeline';
import { isTerminalStatus } from '@/features/applications/utils/transitions';
import {
  getStudentApplicationHistoryAction,
  getRecruiterApplicationHistoryAction,
} from '@/features/applications/actions';

export interface ApplicationStatusHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  jobTitle?: string;
  companyName?: string;
  candidateName?: string;
  currentStatus: ApplicationStatus;
  history?: ApplicationStatusHistoryItem[];
  mode?: 'student' | 'recruiter';
}

export function ApplicationStatusHistoryModal({
  isOpen,
  onClose,
  applicationId,
  jobTitle,
  companyName,
  candidateName,
  currentStatus,
  history: initialHistory,
  mode = 'student',
}: ApplicationStatusHistoryModalProps) {
  const hasInitialHistory = Array.isArray(initialHistory);
  const [historyItems, setHistoryItems] = React.useState<ApplicationStatusHistoryItem[]>(
    initialHistory || []
  );
  const [isLoading, setIsLoading] = React.useState(!hasInitialHistory);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const closeBtnRef = React.useRef<HTMLButtonElement>(null);

  // Focus close button when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle Escape key
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch chronological history if not supplied via props
  React.useEffect(() => {
    if (!isOpen || !applicationId) return;

    if (Array.isArray(initialHistory)) {
      const sorted = [...initialHistory].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setHistoryItems(sorted);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setFetchError(null);

    async function loadHistory() {
      try {
        if (mode === 'recruiter') {
          const res = await getRecruiterApplicationHistoryAction(applicationId);
          if (!isMounted) return;
          if (res.success && res.data) {
            setHistoryItems(res.data.history || []);
          } else {
            setFetchError(res.error || 'Unable to load candidate audit history.');
          }
        } else {
          const res = await getStudentApplicationHistoryAction(applicationId);
          if (!isMounted) return;
          if (res.success && res.data) {
            setHistoryItems(res.data);
          } else {
            setFetchError(res.error || 'Unable to load application status history.');
          }
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Error fetching status history.';
        setFetchError(msg);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [isOpen, applicationId, initialHistory, mode]);

  if (!isOpen) return null;

  const currentMeta = formatApplicationStatus(currentStatus);
  const currentIcon = getStatusIcon(currentStatus);
  const terminalInfo = getTerminalOutcomeInfo(currentStatus);
  const isTerminal = isTerminalStatus(currentStatus);
  const displayRef = `APP-${applicationId.slice(0, 8).toUpperCase()}`;

  // Ensure chronological order (oldest to newest)
  const sortedHistory = [...historyItems].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div
      id="status-history-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-history-modal-title"
      aria-describedby="status-history-modal-description"
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="status-history-modal-content"
        className="max-w-2xl w-full max-h-[90vh] my-auto flex flex-col bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-border bg-surface-hover/30 flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                📜
              </span>
              <h2
                id="status-history-modal-title"
                className="text-lg sm:text-xl font-bold text-text-primary tracking-tight"
              >
                Application Status Audit Trail
              </h2>
              <Badge
                variant={currentMeta.badgeVariant}
                className="text-xs font-semibold uppercase px-2.5 py-0.5 flex items-center gap-1"
              >
                <span>{currentIcon}</span>
                <span>{currentMeta.label}</span>
              </Badge>
            </div>

            <p
              id="status-history-modal-description"
              className="text-xs text-text-muted leading-relaxed"
            >
              Chronological lifecycle transitions and verified audit log for{' '}
              <strong className="text-text-primary">{jobTitle || 'Placement Opportunity'}</strong>
              {companyName && (
                <>
                  {' '}
                  at <span className="text-text-secondary font-medium">{companyName}</span>
                </>
              )}
              {candidateName && (
                <>
                  {' '}
                  • Candidate:{' '}
                  <span className="text-text-primary font-semibold">{candidateName}</span>
                </>
              )}
              . <span className="font-mono text-text-muted">[{displayRef}]</span>
            </p>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            id="status-history-modal-close-btn"
            onClick={onClose}
            aria-label="Close status history dialog"
            className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-surface-hover transition-colors shrink-0 text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Terminal State Alert Card */}
          {isTerminal && (
            <div
              id="terminal-outcome-card"
              className={`p-4 rounded-xl border space-y-1.5 ${
                terminalInfo.badgeVariant === 'success'
                  ? 'bg-success-bg/40 border-success/30 text-text-primary'
                  : terminalInfo.badgeVariant === 'error'
                  ? 'bg-error-bg/40 border-error/30 text-text-primary'
                  : 'bg-surface-hover/80 border-border text-text-primary'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base font-bold" aria-hidden="true">
                  {terminalInfo.icon}
                </span>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                  {terminalInfo.title}
                </h3>
                <Badge
                  variant={terminalInfo.badgeVariant}
                  className="text-[10px] uppercase font-bold ml-auto"
                >
                  Terminal Stage
                </Badge>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed pl-6">
                {terminalInfo.description}
              </p>
            </div>
          )}

          {/* Error Message */}
          {fetchError && (
            <div className="p-3.5 rounded-xl bg-error-bg/50 border border-error/30 text-error text-xs">
              <p className="font-semibold">Failed to retrieve status history</p>
              <p className="mt-0.5 text-text-secondary">{fetchError}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="space-y-4 py-4" id="status-history-loading">
              <div className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-surface-hover" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 bg-surface-hover rounded w-1/3" />
                  <div className="h-3 bg-surface-hover rounded w-1/2" />
                </div>
              </div>
              <div className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-surface-hover" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 bg-surface-hover rounded w-1/4" />
                  <div className="h-3 bg-surface-hover rounded w-2/3" />
                </div>
              </div>
            </div>
          ) : sortedHistory.length === 0 ? (
            /* Empty State */
            <div
              id="empty-status-history"
              className="text-center py-10 px-4 rounded-xl border border-dashed border-border bg-surface-hover/20 space-y-2"
            >
              <span className="text-3xl block">📋</span>
              <p className="text-sm font-bold text-text-primary">No status transitions recorded yet</p>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                Transitions will be recorded chronologically as the recruitment pipeline evaluates this application.
              </p>
            </div>
          ) : (
            /* Chronological Timeline */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Chronological Transition Log
                </h3>
                <span className="text-[11px] font-mono text-text-muted">
                  {sortedHistory.length} event{sortedHistory.length === 1 ? '' : 's'} recorded
                </span>
              </div>

              <div
                id="status-history-timeline-list"
                className="relative pl-6 sm:pl-7 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-border"
              >
                {sortedHistory.map((item, index) => {
                  const toStatusMeta = formatApplicationStatus(item.toStatus as ApplicationStatus);
                  const fromStatusMeta = item.fromStatus
                    ? formatApplicationStatus(item.fromStatus as ApplicationStatus)
                    : null;
                  const attribution = getHistoryAttribution(item);
                  const icon = getStatusIcon(item.toStatus);
                  const isLastItem = index === sortedHistory.length - 1;

                  const formattedDate = new Date(item.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={item.id || index}
                      id={`history-entry-${index}`}
                      className="relative space-y-2"
                    >
                      {/* Timeline Node on Left Rail */}
                      <div
                        className={`absolute -left-6 sm:-left-7 top-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                          isLastItem
                            ? 'bg-primary text-primary-foreground border-primary ring-2 ring-primary/20'
                            : 'bg-surface border-border text-text-secondary'
                        }`}
                        aria-hidden="true"
                      >
                        {icon}
                      </div>

                      {/* Event Card Content */}
                      <div className="bg-surface-hover/40 border border-border rounded-xl p-3.5 sm:p-4 space-y-2.5 transition-colors">
                        {/* Header Row: Title, Attribution & Timestamp */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-text-primary">
                              {formatTransitionTitle(item.fromStatus, item.toStatus)}
                            </span>
                            <Badge
                              variant={attribution.badgeVariant}
                              className="text-[10px] py-0 font-medium"
                            >
                              {attribution.label}
                            </Badge>
                          </div>

                          <span className="text-[11px] font-mono text-text-muted shrink-0">
                            {formattedDate}
                          </span>
                        </div>

                        {/* Transition State Badges: Previous Status -> New Status */}
                        <div className="flex items-center gap-2 flex-wrap pt-0.5 text-xs">
                          {fromStatusMeta ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-text-muted">Previous:</span>
                              <Badge
                                variant={fromStatusMeta.badgeVariant}
                                className="text-[10px] font-semibold"
                              >
                                {fromStatusMeta.label}
                              </Badge>
                              <span className="text-text-muted font-bold" aria-hidden="true">
                                →
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-text-muted italic">
                              Initial submission
                            </span>
                          )}

                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-text-muted">New Status:</span>
                            <Badge
                              variant={toStatusMeta.badgeVariant}
                              className="text-[10px] font-bold"
                            >
                              {toStatusMeta.label}
                            </Badge>
                            {isLastItem && (
                              <span className="text-[10px] text-primary font-semibold">
                                (Current)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Recruiter / System Remarks */}
                        {item.remarks && (
                          <div
                            id={`history-remarks-${index}`}
                            className="mt-2 p-2.5 rounded-lg bg-surface border border-border/80 text-xs text-text-secondary leading-relaxed space-y-1"
                          >
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block">
                              Recruiter Remarks / Notes
                            </span>
                            <blockquote className="italic text-text-primary">
                              &ldquo;{item.remarks}&rdquo;
                            </blockquote>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Audit Integrity Notice */}
          <div className="p-3 rounded-lg bg-surface-hover/30 border border-border/60 flex items-center gap-2 text-[11px] text-text-muted">
            <span aria-hidden="true">🔒</span>
            <span>
              Immutable Audit Log: Status history records are tamper-proof and cryptographically logged for institutional compliance and transparency.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-surface-hover/30 flex items-center justify-between shrink-0 text-xs">
          <span className="text-text-muted font-mono text-[11px]">
            Application ID: {applicationId.slice(0, 13)}...
          </span>
          <Button
            id="status-history-close-btn"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs font-semibold px-4"
          >
            Close History
          </Button>
        </div>
      </div>
    </div>
  );
}
