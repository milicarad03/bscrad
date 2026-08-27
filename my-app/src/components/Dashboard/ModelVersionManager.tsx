import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { ModelVersionDTO } from '../../models/device.dto';
import '../../../src/styles/layouts/modelVersionManager.css';

interface ModelVersionManagerProps {
  modelVersions: ModelVersionDTO[];
  onUpload: (params: {
    modelName: string;
    version: string;
    schemaFile: File;
    mappingFile: File;
  }) => Promise<any>;
  onRefresh: () => void;
}

export const ModelVersionManager = ({
  modelVersions,
  onUpload,
  onRefresh,
}: ModelVersionManagerProps) => {
  const [modelName, setModelName] = useState('');
  const [version, setVersion] = useState('');
  const [schemaFile, setSchemaFile] = useState<File | null>(null);
  const [mappingFile, setMappingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const modelNames = useMemo(
    () => Array.from(new Set(modelVersions.map((item) => item.modelId))).sort(),
    [modelVersions]
  );
  const sortedVersions = useMemo(
    () =>
      [...modelVersions].sort((a, b) => {
        const modelCompare = a.modelId.localeCompare(b.modelId);
        if (modelCompare !== 0) return modelCompare;

        return a.version.localeCompare(b.version, undefined, {
          numeric: true,
        });
      }),
    [modelVersions]
  );

  const handleSchemaFile = async (file: File | null) => {
    setSchemaFile(file);
    setError(null);

    if (!file) return;

    try {
      const text = await file.text();
      const schema = JSON.parse(text);
      const detectedModel = schema?.properties?.schemaId?.const;

      if (typeof detectedModel === 'string' && detectedModel.trim()) {
        setModelName(detectedModel.trim());
      }
    } catch {
    }
  };

 const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formElement = e.currentTarget; 
    setError(null);
    setSuccess(false);

    if (!modelName.trim() || !version.trim() || !schemaFile || !mappingFile) {
      setError('Please fill in all fields and select both files');
      return;
    }

    setLoading(true);

    try {
      await onUpload({
        modelName: modelName.trim(),
        version: version.trim(),
        schemaFile,
        mappingFile,
      });


      setModelName('');
      setVersion('');
      setSchemaFile(null);
      setMappingFile(null);
      setSuccess(true);
      
      formElement.reset();

      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manager-container">
      {/* UPLOAD FORM */}
      <div className="manager-card">
        <h2 className="manager-card-title">Upload Model Version</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {error && <div className="alert alert-error">{error}</div>}

            {success && (
              <div className="alert alert-success">
                Model version uploaded successfully!
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Model Name</label>
              <input
                className="form-input"
                list="known-model-names"
                value={modelName}
                onChange={(e) => {
                  setModelName(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. modelB"
                required
              />
              <datalist id="known-model-names">
                {modelNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            <div className="form-group">
              <label className="form-label">Version</label>
              <input
                className="form-input"
                value={version}
                onChange={(e) => {
                  setVersion(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. 2.0.1"
                required
              />
            </div>

            {/* Schema File Upload */}
            <div className="form-group form-full-width">
              <label className="form-label">JSON Schema File</label>
              <div className="file-upload-wrapper">
                <label className={`file-upload-label ${schemaFile ? 'has-file' : ''}`}>
                  <input
                    type="file"
                    className="file-upload-input"
                    accept=".json,application/json"
                    onChange={(e) => handleSchemaFile(e.target.files?.[0] ?? null)}
                    required
                  />
                  <span className="file-upload-text">
                    {schemaFile ? 'Change file' : 'Click or drag schema.json here'}
                  </span>
                </label>
                {schemaFile && (
                  <div className="file-upload-success">{schemaFile.name}</div>
                )}
              </div>
            </div>

            {/* Mapping File Upload */}
            <div className="form-group form-full-width">
              <label className="form-label">Mapper File</label>
              <div className="file-upload-wrapper">
                <label className={`file-upload-label ${mappingFile ? 'has-file' : ''}`}>
                  <input
                    type="file"
                    className="file-upload-input"
                    accept=".json,application/json"
                    onChange={(e) => {
                      setMappingFile(e.target.files?.[0] ?? null);
                      setError(null);
                    }}
                    required
                  />
                  <span className="file-upload-text">
                    {mappingFile ? 'Change file' : 'Click or drag mapper.json here'}
                  </span>
                </label>
                {mappingFile && (
                  <div className="file-upload-success">{mappingFile.name}</div>
                )}
              </div>
            </div>
          </div>

          <div className="button-group">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !schemaFile || !mappingFile}
            >
              {loading ? 'Validating...' : 'Upload'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              disabled={loading}
              onClick={onRefresh}
            >
              Refresh
            </button>
          </div>
        </form>
      </div>

  
      <div className="manager-card">
        <h2 className="manager-card-title">Registered Model Versions</h2>

        <div className="table-container">
          <table className="manager-table">
            <thead>
              <tr>
                <th>Model Name</th>
                <th>Version</th>
                <th>ID</th>
              </tr>
            </thead>
            <tbody>
              {sortedVersions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="table-empty">
                    No registered models found
                  </td>
                </tr>
              ) : (
                sortedVersions.map((item) => (
                  <tr key={item.id}>
                    <td className="cell-model">{item.modelId}</td>
                    <td>{item.version}</td>
                    <td className="cell-id">{item.id}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};