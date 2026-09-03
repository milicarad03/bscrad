import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, FileJson, Upload, X } from 'lucide-react';
import { readDeviceBulkImportFile } from '../../api/deviceBulkImport';
import type {
  BulkDeviceImportManifestDTO,
  BulkDeviceImportResultDTO,
  BulkDeviceModelSummaryDTO,
} from '../../models/device-bulk-import.dto';
import '../../styles/layouts/deviceBulkImport.css';

interface DeviceBulkImportDialogProps {
  onClose: () => void;
  onImport: (
    manifest: BulkDeviceImportManifestDTO,
  ) => Promise<BulkDeviceImportResultDTO>;
}

export const DeviceBulkImportDialog = ({
  onClose,
  onImport,
}: DeviceBulkImportDialogProps) => {
  const [fileName, setFileName] = useState('');
  const [manifest, setManifest] =
    useState<BulkDeviceImportManifestDTO | null>(null);
  const [result, setResult] =
    useState<BulkDeviceImportResultDTO | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, submitting]);

  const modelSummary = useMemo(() => {
    if (!manifest) return [];

    const counts = new Map<string, BulkDeviceModelSummaryDTO>();
    for (const device of manifest.devices) {
      const key = `${device.model}\u0000${device.version}`;
      const current = counts.get(key);
      counts.set(key, {
        model: device.model,
        version: device.version,
        count: (current?.count ?? 0) + 1,
      });
    }

    return [...counts.values()].sort(
      (left, right) =>
        left.model.localeCompare(right.model) ||
        left.version.localeCompare(right.version, undefined, {
          numeric: true,
        }),
    );
  }, [manifest]);

  const handleFile = async (file: File | null) => {
    setManifest(null);
    setResult(null);
    setError('');
    setFileName(file?.name ?? '');

    if (!file) return;

    try {
      setManifest(await readDeviceBulkImportFile(file));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to read the manifest.',
      );
    }
  };

  const handleImport = async () => {
    if (!manifest || submittingRef.current) return;

    submittingRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      setResult(await onImport(manifest));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Device import failed.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div
      className="bulk-import-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <section
        className="bulk-import-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-import-title"
        data-cy="bulk-import-dialog"
      >
        <header className="bulk-import-header">
          <div>
            <h2 id="bulk-import-title">Import devices</h2>
            <p>JSON manifest</p>
          </div>
          <button
            type="button"
            className="bulk-import-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close device import"
            title="Close"
          >
            <X size={18} />
          </button>
        </header>

        {!result && (
          <div className="bulk-import-body">
            <label className="bulk-import-file-control">
              <input
                type="file"
                accept=".json,application/json"
                aria-label="Device import manifest"
                data-cy="bulk-import-file"
                onChange={(event) =>
                  handleFile(event.target.files?.[0] ?? null)
                }
                disabled={submitting}
              />
              <FileJson size={22} />
              <span>{fileName || 'Choose manifest'}</span>
            </label>

            {error && (
              <div className="bulk-import-alert error" role="alert">
                {error}
              </div>
            )}

            {manifest && (
              <div className="bulk-import-preview" data-cy="bulk-import-preview">
                <dl className="bulk-import-facts">
                  <div>
                    <dt>Assigned user</dt>
                    <dd>{manifest.targetUserEmail}</dd>
                  </div>
                  <div>
                    <dt>Total devices</dt>
                    <dd>{manifest.devices.length}</dd>
                  </div>
                </dl>

                <div className="bulk-import-table-wrap">
                  <table className="bulk-import-table">
                    <thead>
                      <tr>
                        <th>Model</th>
                        <th>Version</th>
                        <th>Devices</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modelSummary.map((entry) => (
                        <tr key={`${entry.model}:${entry.version}`}>
                          <td>{entry.model}</td>
                          <td>{entry.version}</td>
                          <td>{entry.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="bulk-import-result" data-cy="bulk-import-result">
            <Check size={28} aria-hidden="true" />
            <h3>Import completed</h3>
            <div className="bulk-import-result-grid">
              <div><span>Total</span><strong>{result.total}</strong></div>
              <div><span>Created</span><strong>{result.created}</strong></div>
              <div><span>Skipped</span><strong>{result.skipped}</strong></div>
              <div><span>Failed</span><strong>{result.failed}</strong></div>
            </div>
            {result.skippedSerialNumbers.length > 0 && (
              <p className="bulk-import-skipped">
                Existing devices: {result.skippedSerialNumbers.slice(0, 8).join(', ')}
                {result.skippedSerialNumbers.length > 8
                  ? ` and ${result.skippedSerialNumbers.length - 8} more`
                  : ''}
              </p>
            )}
          </div>
        )}

        <footer className="bulk-import-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleImport}
              disabled={!manifest || submitting}
              data-cy="bulk-import-submit"
              data-testid="bulk-import-submit"
            >
              <Upload size={16} />
              {submitting ? 'Importing...' : 'Import devices'}
            </button>
          )}
        </footer>
      </section>
    </div>
  );
};
