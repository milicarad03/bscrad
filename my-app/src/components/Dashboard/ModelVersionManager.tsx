import {
  useMemo,
  useState,
} from 'react';

import type {
  FormEvent,
} from 'react';

import {
  Card,
} from '../UI/Card';

import {
  Button,
} from '../UI/Button';

import type {
  ModelVersionDTO,
} from '../../models/device.dto';

interface ModelVersionManagerProps {
  modelVersions:
    ModelVersionDTO[];

  onUpload: (
    params: {
      modelName: string;
      version: string;
      schemaFile: File;
      mappingFile: File;
    },
  ) => Promise<any>;

  onRefresh: () => void;
}

export const ModelVersionManager = ({
  modelVersions,
  onUpload,
  onRefresh,
}: ModelVersionManagerProps) => {
  const [
    modelName,
    setModelName,
  ] = useState('');

  const [
    version,
    setVersion,
  ] = useState('');

  const [
    schemaFile,
    setSchemaFile,
  ] =
    useState<File | null>(
      null,
    );

  const [
    mappingFile,
    setMappingFile,
  ] =
    useState<File | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] = useState(false);

  /*
   * Postojeća imena modela.
   *
   * Korisno je da browser može
   * da ponudi modelA, modelB...
   */
  const modelNames =
    useMemo(
      () =>
        Array.from(
          new Set(
            modelVersions.map(
              (item) =>
                item.modelId,
            ),
          ),
        ).sort(),

      [modelVersions],
    );

  /*
   * Sortiranje za tabelu.
   */
  const sortedVersions =
    useMemo(
      () =>
        [...modelVersions]
          .sort(
            (a, b) => {
              const modelCompare =
                a.modelId.localeCompare(
                  b.modelId,
                );

              if (
                modelCompare !== 0
              ) {
                return modelCompare;
              }

              return a.version.localeCompare(
                b.version,
                undefined,
                {
                  numeric: true,
                },
              );
            },
          ),

      [modelVersions],
    );

  /*
   * Kada izaberemo schema fajl,
   * pokušavamo da automatski
   * pročitamo:
   *
   * properties.schemaId.const
   *
   * npr. modelB
   *
   * Ovo je samo pomoć u UI.
   * Pravu validaciju i dalje
   * radi serverski plugin.
   */
  const handleSchemaFile =
    async (
      file: File | null,
    ) => {
      setSchemaFile(
        file,
      );

      if (!file) {
        return;
      }

      try {
        const text =
          await file.text();

        const schema =
          JSON.parse(text);

        const detectedModel =
          schema
            ?.properties
            ?.schemaId
            ?.const;

        if (
          typeof detectedModel ===
            'string' &&
          detectedModel.trim()
        ) {
          setModelName(
            detectedModel.trim(),
          );
        }
      } catch {
        /*
         * Ne prikazujemo grešku ovde.
         *
         * Backend/plugin će uraditi
         * stvarnu validaciju.
         */
      }
    };

  const handleSubmit =
    async (
      e:
        FormEvent<HTMLFormElement>,
    ) => {
      e.preventDefault();

      if (
        !modelName.trim() ||
        !version.trim() ||
        !schemaFile ||
        !mappingFile
      ) {
        return;
      }

      setLoading(true);

      try {
        await onUpload({
          modelName:
            modelName.trim(),

          version:
            version.trim(),

          schemaFile,

          mappingFile,
        });

        /*
         * Reset nakon uspeha.
         */
        setModelName('');
        setVersion('');
        setSchemaFile(null);
        setMappingFile(null);

        e.currentTarget.reset();
      } finally {
        setLoading(false);
      }
    };

  return (
    <div
      style={{
        display: 'grid',
        gap: '25px',
      }}
    >
      <Card
        title="UPLOAD MODEL VERSION"
      >
        <form
          onSubmit={
            handleSubmit
          }
          style={{
            display: 'grid',
            gap: '18px',
          }}
        >
          <div>
            <p
              style={{
                fontSize:
                  '0.7rem',

                color: '#888',

                marginBottom:
                  '5px',
              }}
            >
              MODEL_NAME
            </p>

            <input
              className="search-input"
              list="known-model-names"
              value={
                modelName
              }
              onChange={(e) =>
                setModelName(
                  e.target.value,
                )
              }
              placeholder="modelB"
              required
            />

            <datalist
              id="known-model-names"
            >
              {modelNames.map(
                (name) => (
                  <option
                    key={name}
                    value={name}
                  />
                ),
              )}
            </datalist>
          </div>

          <div>
            <p
              style={{
                fontSize:
                  '0.7rem',

                color: '#888',

                marginBottom:
                  '5px',
              }}
            >
              VERSION
            </p>

            <input
              className="search-input"
              value={version}
              onChange={(e) =>
                setVersion(
                  e.target.value,
                )
              }
              placeholder="2.0.1"
              required
            />
          </div>

          <div>
            <p
              style={{
                fontSize:
                  '0.7rem',

                color: '#888',

                marginBottom:
                  '5px',
              }}
            >
              JSON_SCHEMA
            </p>

            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) =>
                handleSchemaFile(
                  e.target
                    .files?.[0] ??
                    null,
                )
              }
              required
            />
          </div>

          <div>
            <p
              style={{
                fontSize:
                  '0.7rem',

                color: '#888',

                marginBottom:
                  '5px',
              }}
            >
              MAPPER
            </p>

            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) =>
                setMappingFile(
                  e.target
                    .files?.[0] ??
                    null,
                )
              }
              required
            />
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: '10px',
            }}
          >
            <Button
              type="submit"
              className="btn-save"
              disabled={
                loading ||
                !schemaFile ||
                !mappingFile
              }
            >
              {loading
                ? 'VALIDATING...'
                : 'UPLOAD_SCHEMA_AND_MAPPER'}
            </Button>

            <Button
              type="button"
              className="btn-refresh"
              onClick={
                onRefresh
              }
            >
              REFRESH
            </Button>
          </div>
        </form>
      </Card>

      <Card
        title="REGISTERED MODEL VERSIONS"
      >
        <div
          style={{
            overflowX:
              'auto',
          }}
        >
          <table
            className="techno-table"
          >
            <thead>
              <tr>
                <th>
                  Model
                </th>

                <th>
                  Version
                </th>

                <th>
                  ID
                </th>
              </tr>
            </thead>

            <tbody>
              {sortedVersions.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      textAlign:
                        'center',

                      opacity:
                        0.5,

                      padding:
                        '30px',
                    }}
                  >
                    NO_MODEL_VERSIONS
                  </td>
                </tr>
              ) : (
                sortedVersions.map(
                  (item) => (
                    <tr
                      key={
                        item.id
                      }
                    >
                      <td
                        style={{
                          color:
                            '#81a4e4',

                          fontWeight:
                            'bold',
                        }}
                      >
                        {
                          item.modelId
                        }
                      </td>

                      <td>
                        {
                          item.version
                        }
                      </td>

                      <td
                        style={{
                          fontFamily:
                            'monospace',

                          opacity:
                            0.7,
                        }}
                      >
                        {
                          item.id
                        }
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};