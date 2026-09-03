import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DeviceBulkImportDialog } from './DeviceBulkImportDialog';

const manifest = {
  targetUserEmail: 'owner@example.com',
  devices: [
    {
      serialNumber: 'fleet-a-001',
      name: 'Fleet Sensor A001',
      type: 'sensor',
      model: 'modelA',
      version: '10.0.0',
    },
    {
      serialNumber: 'fleet-b-001',
      name: 'Fleet Compressor B001',
      type: 'compressor',
      model: 'modelB',
      version: '10.0.0',
    },
  ],
};

const jsonFile = (contents: string) => {
  const file = new File([contents], 'devices.json', {
    type: 'application/json',
  });
  Object.defineProperty(file, 'text', {
    value: vi.fn().mockResolvedValue(contents),
  });
  return file;
};

describe('DeviceBulkImportDialog', () => {
  it('previews a manifest and displays the backend result', async () => {
    const onImport = vi.fn().mockResolvedValue({
      total: 2,
      created: 1,
      skipped: 1,
      failed: 0,
      targetUser: { id: 2, email: 'owner@example.com' },
      skippedSerialNumbers: ['fleet-a-001'],
      concurrentSkips: 0,
    });

    render(
      <DeviceBulkImportDialog onClose={vi.fn()} onImport={onImport} />,
    );
    fireEvent.change(screen.getByLabelText('Device import manifest'), {
      target: { files: [jsonFile(JSON.stringify(manifest))] },
    });

    expect(await screen.findByText('owner@example.com')).toBeTruthy();
    expect(screen.getByText('modelA')).toBeTruthy();
    expect(screen.getByText('modelB')).toBeTruthy();

    fireEvent.click(screen.getByTestId('bulk-import-submit'));

    await waitFor(() => expect(onImport).toHaveBeenCalledWith(manifest));
    expect(await screen.findByText('Import completed')).toBeTruthy();
    expect(screen.getByText('Existing devices: fleet-a-001')).toBeTruthy();
  });

  it('shows an error for invalid JSON without calling the backend', async () => {
    const onImport = vi.fn();
    render(
      <DeviceBulkImportDialog onClose={vi.fn()} onImport={onImport} />,
    );

    fireEvent.change(screen.getByLabelText('Device import manifest'), {
      target: { files: [jsonFile('{invalid')] },
    });

    expect(
      await screen.findByText(
        'The selected file does not contain valid JSON.',
      ),
    ).toBeTruthy();
    expect(onImport).not.toHaveBeenCalled();
  });

  it('keeps the dialog open when the backend rejects the import', async () => {
    const onImport = vi.fn().mockRejectedValue(
      new Error('MODEL_VERSIONS_NOT_FOUND'),
    );
    render(
      <DeviceBulkImportDialog onClose={vi.fn()} onImport={onImport} />,
    );
    fireEvent.change(screen.getByLabelText('Device import manifest'), {
      target: { files: [jsonFile(JSON.stringify(manifest))] },
    });

    await screen.findByText('owner@example.com');
    fireEvent.click(screen.getByTestId('bulk-import-submit'));

    expect(
      await screen.findByText('MODEL_VERSIONS_NOT_FOUND'),
    ).toBeTruthy();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('prevents duplicate imports while a request is pending', async () => {
    let finishImport: ((value: unknown) => void) | undefined;
    const onImport = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          finishImport = resolve;
        }),
    );
    render(
      <DeviceBulkImportDialog onClose={vi.fn()} onImport={onImport} />,
    );
    fireEvent.change(screen.getByLabelText('Device import manifest'), {
      target: { files: [jsonFile(JSON.stringify(manifest))] },
    });

    await screen.findByText('owner@example.com');
    const submit = screen.getByTestId('bulk-import-submit');
    fireEvent.click(submit);
    fireEvent.click(submit);

    expect(onImport).toHaveBeenCalledTimes(1);
    finishImport?.({
      total: 2,
      created: 2,
      skipped: 0,
      failed: 0,
      targetUser: { id: 2, email: 'owner@example.com' },
      skippedSerialNumbers: [],
      concurrentSkips: 0,
    });
    expect(await screen.findByText('Import completed')).toBeTruthy();
  });
});
