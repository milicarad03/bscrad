import { useState } from 'react';
import { Button } from '../UI/Button';
import { CommandField } from './CommandField';
import type { CommandMetadata } from '../../models/device.dto';
import { buildPayloadFromCommandFields } from '../../utils/commandFields';

type Props = {
  command: CommandMetadata;
  disabled: boolean;
  latestTelemetry?: any;
  onExecute: (command: string, payload: any) => Promise<void>;
};

export const CommandCard = ({
  command,
  disabled,
  latestTelemetry,
  onExecute,
}: Props) => {
  const [payload, setPayload] = useState<Record<string, any>>({});
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      const finalPayload = buildPayloadFromCommandFields(payload, allowedPaths);
      await onExecute(command.command, finalPayload);
      setPayload({});
    } finally {
      setIsExecuting(false);
    }
  };

  const updateField = (path: string, value: any) => {
    console.log("FIELD CHANGED", path, value);

    setPayload(prev => {
      const next = {
        ...prev,
        [path]: value,
      };

      console.log("PAYLOAD", next);
      return next;
    });
  };

  const allowedPaths = new Set(command.fields.map(f => f.path));

  const isInvalid = command.fields.some(field => {
    const value = payload[field.path];

    if (
      field.required &&
      (value === undefined || value === null || value === '')
    ) {
      return true;
    }

    if (
      field.type === 'number' &&
      value !== undefined &&
      value !== ''
    ) {
      if (
        field.minimum !== undefined &&
        value < field.minimum
      ) {
        return true;
      }

      if (
        field.maximum !== undefined &&
        value > field.maximum
      ) {
        return true;
      }
    }

    return false;
  });

  const isAlreadyApplied = (() => {
    switch (command.command) {
      case 'SET_LED':
        return latestTelemetry?.led === payload['value'];

      case 'SET_LED_COLOR':
        return latestTelemetry?.ledColor === payload['color'];

      case 'SET_MODE':
        return latestTelemetry?.mode === payload['value'];

      case 'SET_OPERATING_PROFILE':
        return (
          latestTelemetry?.system?.status?.operatingProfile ===
          payload['mode']
        );

      default:
        return false;
    }
  })();

  return (
    <div className="dd-command-inner">
      <div className="dd-command-header">
        <span className="dd-command-title">{command.command}</span>
      </div>
      
      {command.fields.map(field => (
        <div key={field.path} className="cf-field">
          <label>{field.name}</label>
          <CommandField
            field={field}
            value={payload[field.path]}
            onChange={(value) => updateField(field.path, value)}
          />
        </div>
      ))}

      <Button 
        disabled={disabled || isInvalid || isAlreadyApplied || isExecuting}
        onClick={handleExecute}
        className="dd-btn"
      >
        {isExecuting ? 'SENDING...' : 'EXECUTE'}
      </Button>
    </div>
  );
};