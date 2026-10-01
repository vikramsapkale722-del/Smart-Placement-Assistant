import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ApplicationStatusHistoryModal } from '@/features/applications/components/ApplicationStatusHistoryModal';
import type { ApplicationStatusHistoryItem } from '@/features/applications/types';

describe('ApplicationStatusHistoryModal Component Tests (TASK-016)', () => {
  const sampleHistory: ApplicationStatusHistoryItem[] = [
    {
      id: 'hist-1',
      applicationId: 'app-seed-001',
      fromStatus: null,
      toStatus: 'applied',
      changedBy: 'student-user-001',
      remarks: 'Initial candidate application submission',
      createdAt: '2026-09-20T10:00:00Z',
    },
    {
      id: 'hist-2',
      applicationId: 'app-seed-001',
      fromStatus: 'applied',
      toStatus: 'in_review',
      changedBy: 'recruiter-user-001',
      remarks: 'Candidate credentials screened by recruitment team',
      createdAt: '2026-09-22T14:30:00Z',
    },
    {
      id: 'hist-3',
      applicationId: 'app-seed-001',
      fromStatus: 'in_review',
      toStatus: 'shortlisted',
      changedBy: 'recruiter-user-001',
      remarks: 'Shortlisted for Round 1 Technical Systems Interview',
      createdAt: '2026-09-25T16:00:00Z',
    },
  ];

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ApplicationStatusHistoryModal
        isOpen={false}
        onClose={vi.fn()}
        applicationId="app-seed-001"
        jobTitle="Full Stack Engineer"
        companyName="Stark Corp"
        currentStatus="shortlisted"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders with proper ARIA dialog semantics and accessible title when open', () => {
    render(
      <ApplicationStatusHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        applicationId="app-seed-001"
        jobTitle="Full Stack Engineer"
        companyName="Stark Corp"
        currentStatus="shortlisted"
        history={sampleHistory}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('status-history-modal-title');
    expect(dialog.getAttribute('aria-describedby')).toBe('status-history-modal-description');

    expect(screen.getByText('Application Status Audit Trail')).toBeDefined();
    expect(screen.getByText(/Full Stack Engineer/)).toBeDefined();
    expect(screen.getByText(/Stark Corp/)).toBeDefined();
  });

  it('renders complete chronological status progression with attribution and remarks', () => {
    render(
      <ApplicationStatusHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        applicationId="app-seed-001"
        jobTitle="Full Stack Engineer"
        companyName="Stark Corp"
        currentStatus="shortlisted"
        history={sampleHistory}
      />
    );

    // Initial submission
    expect(screen.getByText('Application Submitted & Recorded')).toBeDefined();
    expect(screen.getByText('Candidate Submission')).toBeDefined();
    expect(screen.getByText('“Initial candidate application submission”')).toBeDefined();

    // In Review transition
    expect(screen.getByText('Stage Transition: Applied → In Review')).toBeDefined();
    expect(screen.getByText('“Candidate credentials screened by recruitment team”')).toBeDefined();

    // Shortlisted transition
    expect(screen.getByText('Stage Transition: In Review → Shortlisted')).toBeDefined();
    expect(screen.getByText('“Shortlisted for Round 1 Technical Systems Interview”')).toBeDefined();
  });

  it('renders prominent terminal state alert card when status is offered', () => {
    const offeredHistory: ApplicationStatusHistoryItem[] = [
      ...sampleHistory,
      {
        id: 'hist-4',
        applicationId: 'app-seed-001',
        fromStatus: 'shortlisted',
        toStatus: 'offered',
        changedBy: 'recruiter-user-001',
        remarks: 'Official offer letter generated.',
        createdAt: '2026-09-28T11:00:00Z',
      },
    ];

    render(
      <ApplicationStatusHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        applicationId="app-seed-001"
        jobTitle="Full Stack Engineer"
        companyName="Stark Corp"
        currentStatus="offered"
        history={offeredHistory}
      />
    );

    expect(screen.getByText('Official Placement Offer Extended')).toBeDefined();
    expect(screen.getByText(/Terminal Stage/i)).toBeDefined();
  });

  it('renders prominent terminal state alert card when status is rejected', () => {
    const rejectedHistory: ApplicationStatusHistoryItem[] = [
      ...sampleHistory,
      {
        id: 'hist-4',
        applicationId: 'app-seed-001',
        fromStatus: 'shortlisted',
        toStatus: 'rejected',
        changedBy: 'recruiter-user-001',
        remarks: 'Candidate not selected for final offer.',
        createdAt: '2026-09-28T11:00:00Z',
      },
    ];

    render(
      <ApplicationStatusHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        applicationId="app-seed-001"
        jobTitle="Full Stack Engineer"
        companyName="Stark Corp"
        currentStatus="rejected"
        history={rejectedHistory}
      />
    );

    expect(screen.getByText('Application Concluded — Not Selected')).toBeDefined();
  });

  it('renders prominent terminal state alert card when status is withdrawn', () => {
    const withdrawnHistory: ApplicationStatusHistoryItem[] = [
      sampleHistory[0],
      {
        id: 'hist-w',
        applicationId: 'app-seed-001',
        fromStatus: 'applied',
        toStatus: 'withdrawn',
        changedBy: 'student-user-001',
        remarks: 'Candidate accepted competing offer.',
        createdAt: '2026-09-21T09:00:00Z',
      },
    ];

    render(
      <ApplicationStatusHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        applicationId="app-seed-001"
        jobTitle="Full Stack Engineer"
        companyName="Stark Corp"
        currentStatus="withdrawn"
        history={withdrawnHistory}
      />
    );

    expect(screen.getByText('Application Voluntarily Withdrawn')).toBeDefined();
    expect(screen.getByText('Candidate Withdrawal')).toBeDefined();
  });

  it('renders empty history placeholder when no history records exist', () => {
    render(
      <ApplicationStatusHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        applicationId="app-empty-001"
        jobTitle="Junior Developer"
        companyName="Stark Corp"
        currentStatus="applied"
        history={[]}
      />
    );

    expect(screen.getByText('No status transitions recorded yet')).toBeDefined();
  });

  it('calls onClose callback when header close button or footer close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <ApplicationStatusHistoryModal
        isOpen={true}
        onClose={handleClose}
        applicationId="app-seed-001"
        jobTitle="Full Stack Engineer"
        companyName="Stark Corp"
        currentStatus="shortlisted"
        history={sampleHistory}
      />
    );

    const closeBtn = screen.getByLabelText('Close status history dialog');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    const footerCloseBtn = screen.getByRole('button', { name: 'Close History' });
    fireEvent.click(footerCloseBtn);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('calls onClose callback when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(
      <ApplicationStatusHistoryModal
        isOpen={true}
        onClose={handleClose}
        applicationId="app-seed-001"
        jobTitle="Full Stack Engineer"
        companyName="Stark Corp"
        currentStatus="shortlisted"
        history={sampleHistory}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not rely solely on color for status presentation (renders glyphs and text labels)', () => {
    render(
      <ApplicationStatusHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        applicationId="app-seed-001"
        jobTitle="Full Stack Engineer"
        companyName="Stark Corp"
        currentStatus="shortlisted"
        history={sampleHistory}
      />
    );

    // Glyphs and explicit text labels are present
    expect(screen.getAllByText('★').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('📋').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('🔍').length).toBeGreaterThanOrEqual(1);
  });
});
