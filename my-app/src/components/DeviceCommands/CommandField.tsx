
import type { CommandMetadata } from '../../models/device.dto';

export type FieldMeta = CommandMetadata['fields'][number];

type CommandFieldProps = {
  field: FieldMeta;
  value: any;
  onChange: (value: any) => void;
};

export const CommandField = ({ field, value, onChange }: CommandFieldProps) => {
  // console.log('DEBUG CommandField render:', { name: field.name, path: field.path, type: field.type, enum: field.enum, value });
  if (field.enum) {
    if (field.enum.length <= 4) {
      return (
        <div className="cf-pill-group">
          {field.enum.map((opt: string) => (
            <button
              key={opt}
              type="button"
              className={`cf-pill ${value === opt ? 'cf-pill--active' : ''}`}
              onClick={() => onChange(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }
    return (
      <select
        className="dd-select"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">SELECT VALUE</option>
        {field.enum.map((opt: string) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  if (field.type === 'boolean') {
    return (
      <div className="cf-pill-group">
        <button
          type="button"
          className={`cf-pill ${value === true ? 'cf-pill--active' : ''}`}
          onClick={() => onChange(true)}
        >
          ON
        </button>
        <button
          type="button"
          className={`cf-pill ${value === false ? 'cf-pill--active' : ''}`}
          onClick={() => onChange(false)}
        >
          OFF
        </button>
      </div>
    );
  }
  const isOutOfRange = 
    (field.minimum !== undefined && value < field.minimum) || 
    (field.maximum !== undefined && value > field.maximum);

  if (field.type === 'number' || field.type === 'integer') {
    return (
      <div className="cf-field-container">
        <input
          type="number"
          className={`dd-input ${isOutOfRange ? 'cf-input--error' : ''}`}
          step={field.type === 'integer' ? 1 : 'any'}
          value={value ?? ''}
          min={field.minimum}
          max={field.maximum}
          onChange={(e) => {
            const val = e.target.value === '' ? '' : Number(e.target.value);
            onChange(val);
          }}
        />
        {isOutOfRange && (
          <span className="cf-error-text">
            Range: {field.minimum ?? '-inf'} - {field.maximum ?? 'inf'}
          </span>
        )}
      </div>
    );
  }



  return (
    <input
      type="text"
      className="dd-input"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};