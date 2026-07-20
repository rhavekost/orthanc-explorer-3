import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModalitiesTab from './ModalitiesTab';
import { useModalities } from '@/features/settings/hooks/use-modalities';
import { useDeleteModality } from '@/features/settings/hooks/use-delete-modality';
import { toast } from 'sonner';

const mutateMock = vi.fn();
const deleteMutateMock = vi.fn();

vi.mock('@/features/settings/hooks/use-modalities', () => ({
  useModalities: vi.fn(() => ({ data: ['PACS1', 'PACS2'] })),
}));

vi.mock('@/features/settings/hooks/use-modality-config', () => ({
  useModalityConfig: vi.fn(() => ({ data: undefined })),
}));

vi.mock('@/features/settings/hooks/use-echo-modality', () => ({
  useEchoModality: vi.fn(() => ({ mutate: mutateMock })),
}));

vi.mock('@/features/settings/hooks/use-delete-modality', () => ({
  useDeleteModality: vi.fn(() => ({ mutate: deleteMutateMock })),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('ModalitiesTab — Echo All', () => {
  beforeEach(() => {
    mutateMock.mockReset();
    mutateMock.mockImplementation((_name: string, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    deleteMutateMock.mockReset();
    deleteMutateMock.mockImplementation((_name: string, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    vi.mocked(useModalities).mockReturnValue(
      { data: ['PACS1', 'PACS2'] } as ReturnType<typeof useModalities>,
    );
    vi.mocked(useDeleteModality).mockReturnValue({
      mutate: deleteMutateMock,
    } as unknown as ReturnType<typeof useDeleteModality>);
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('calls echo.mutate for each modality (not echoModalityAction directly)', () => {
    render(<ModalitiesTab onAddClick={vi.fn()} onEditClick={vi.fn()} />);
    fireEvent.click(screen.getByText(/echo all/i));

    expect(mutateMock).toHaveBeenCalledWith('PACS1', expect.any(Object));
    expect(mutateMock).toHaveBeenCalledWith('PACS2', expect.any(Object));
    expect(mutateMock).toHaveBeenCalledTimes(2);
  });

  it('icon-only buttons have accessible aria-labels for each modality', () => {
    render(<ModalitiesTab onAddClick={vi.fn()} onEditClick={vi.fn()} />);

    // Buttons for PACS1
    expect(screen.getByRole('button', { name: /send c-echo to pacs1/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit modality pacs1/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete modality pacs1/i })).toBeInTheDocument();

    // Buttons for PACS2
    expect(screen.getByRole('button', { name: /send c-echo to pacs2/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit modality pacs2/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete modality pacs2/i })).toBeInTheDocument();
  });

  it('renders online status and fires success toast after a successful echo', () => {
    render(<ModalitiesTab onAddClick={vi.fn()} onEditClick={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /send c-echo to pacs1/i }));

    expect(toast.success).toHaveBeenCalledWith('C-ECHO to PACS1 succeeded');
    expect(screen.getByText(/1 online/i)).toBeInTheDocument();
    expect(screen.getByText(/less than a minute ago/i)).toBeInTheDocument();
  });

  it('renders offline status and fires error toast after a failed echo', () => {
    mutateMock.mockImplementationOnce((_name: string, opts?: { onError?: () => void }) => {
      opts?.onError?.();
    });
    render(<ModalitiesTab onAddClick={vi.fn()} onEditClick={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /send c-echo to pacs1/i }));

    expect(toast.error).toHaveBeenCalledWith('C-ECHO to PACS1 failed');
    expect(screen.getByText(/1 offline/i)).toBeInTheDocument();
    expect(screen.getByText(/less than a minute ago/i)).toBeInTheDocument();
  });

  it('confirms deletion through the dialog and fires success toast', () => {
    render(<ModalitiesTab onAddClick={vi.fn()} onEditClick={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /delete modality pacs1/i }));
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(deleteMutateMock).toHaveBeenCalledWith('PACS1', expect.any(Object));
    expect(toast.success).toHaveBeenCalledWith('Modality "PACS1" deleted');
  });

  it('fires an error toast when deletion fails', () => {
    deleteMutateMock.mockImplementationOnce((_name: string, opts?: { onError?: () => void }) => {
      opts?.onError?.();
    });
    render(<ModalitiesTab onAddClick={vi.fn()} onEditClick={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /delete modality pacs1/i }));
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(toast.error).toHaveBeenCalledWith('Failed to delete "PACS1"');
  });

  it('invokes onEditClick when the edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<ModalitiesTab onAddClick={vi.fn()} onEditClick={onEdit} />);

    fireEvent.click(screen.getByRole('button', { name: /edit modality pacs1/i }));

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ name: 'PACS1' }));
  });

  it('invokes onAddClick when Add Modality is clicked', () => {
    const onAdd = vi.fn();
    render(<ModalitiesTab onAddClick={onAdd} onEditClick={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /add modality/i }));

    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('renders the empty state when there are no modalities', () => {
    vi.mocked(useModalities).mockReturnValueOnce(
      { data: [] } as ReturnType<typeof useModalities>,
    );
    render(<ModalitiesTab onAddClick={vi.fn()} onEditClick={vi.fn()} />);

    expect(screen.getByText(/no modalities configured/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /echo all/i })).toBeDisabled();
  });
});
