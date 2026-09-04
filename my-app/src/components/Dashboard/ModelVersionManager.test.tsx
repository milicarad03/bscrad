import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ModelVersionManager } from './ModelVersionManager';

const jsonFile = (name: string, contents: string) => {
  const file = new File([contents], name, {
    type: 'application/json',
  });
  Object.defineProperty(file, 'text', {
    value: vi.fn().mockResolvedValue(contents),
  });
  return file;
};

describe('ModelVersionManager', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resets the form after an asynchronous model upload', async () => {
    const onUpload = vi.fn().mockResolvedValue({ id: 'version-1' });
    const reset = vi
      .spyOn(HTMLFormElement.prototype, 'reset')
      .mockImplementation(() => undefined);
    const { container } = render(
      <ModelVersionManager
        modelVersions={[]}
        onUpload={onUpload}
        onRefresh={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('e.g. modelB'), {
      target: { value: 'modelA' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. 2.0.1'), {
      target: { value: '10.0.0' },
    });

    const fileInputs = container.querySelectorAll<HTMLInputElement>(
      'input[type="file"]',
    );
    fireEvent.change(fileInputs[0], {
      target: {
        files: [
          jsonFile(
            'schema.json',
            JSON.stringify({
              properties: { schemaId: { const: 'modelA' } },
            }),
          ),
        ],
      },
    });
    fireEvent.change(fileInputs[1], {
      target: {
        files: [jsonFile('mapper.json', JSON.stringify({}))],
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith({
        modelName: 'modelA',
        version: '10.0.0',
        schemaFile: expect.any(File),
        mappingFile: expect.any(File),
      });
      expect(reset).toHaveBeenCalledTimes(1);
    });
    expect(
      screen.getByText('Model version uploaded successfully!'),
    ).toBeTruthy();
  });
});
