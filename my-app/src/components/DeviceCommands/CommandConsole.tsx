// src/components/DeviceCommands/CommandConsole.tsx
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { CommandField, type FieldMeta } from './CommandField';
import type { CommandMetadata } from '../../models/device.dto';
import { groupFieldsByPath } from '../../utils/commandFields.ts';

type CommandConsoleProps = {
  commandMetadata: CommandMetadata[];
  selectedCommand: string;
  onSelectCommand: (command: string) => void;
  commandPayload: Record<string, any>;
  onFieldChange: (path: string, value: any) => void;
  onExecute: () => void;
  disabled: boolean;
};

export const CommandConsole = ({
  commandMetadata,
  selectedCommand,
  onSelectCommand,
  commandPayload,
  onFieldChange,
  onExecute,
  disabled,
}: CommandConsoleProps) => {
  const activeCommand = commandMetadata.find(c => c.command === selectedCommand);
  const groupedFields = groupFieldsByPath(activeCommand?.fields ?? []);
    const isInvalid = activeCommand?.fields.some(field => {
    const val = commandPayload[field.path];
    const isMissing = field.required && (val === undefined || val === '' || val === null);
    
    // 1. Provera da li je obavezno polje prazno
    if (isMissing) return true;

    // 2. Provera numeričkih ograničenja (samo ako vrednost postoji)
    if (field.type === 'number' && val !== undefined && val !== '' && val !== null) {
      if (field.minimum !== undefined && val < field.minimum) return true;
      if (field.maximum !== undefined && val > field.maximum) return true;
    }
    
    return false;
  });

  // Dodatno: ako nije izabrana komanda, takođe je invalid
  const isButtonDisabled = disabled || isInvalid || !activeCommand;

  return (
    <Card title="COMMAND_CONSOLE">
      <div className="cf-pill-group cf-command-select">
        {commandMetadata.map(cmd => (
          <button
            key={cmd.command}
            type="button"
            className={`cf-pill ${selectedCommand === cmd.command ? 'cf-pill--active' : ''}`}
            onClick={() => onSelectCommand(cmd.command)}
          >
            {cmd.command}
          </button>
        ))}
      </div>

      {activeCommand && (
        <div className="cf-form">
          {Object.entries(groupedFields).map(([groupKey, fields]) => (
            <div key={groupKey} className="cf-group">
              {groupKey !== '_root' && (
                <span className="cf-group-title">{groupKey.toUpperCase()}</span>
              )}
              <div className="cf-group-fields">
                {fields.map((field: FieldMeta) => (
                  <div key={field.path} className="cf-field">
                    <label className="cf-field-label">{field.name}</label>
                    <CommandField
                      field={field}
                      value={commandPayload[field.path]}
                      
                      onChange={(value) => {
                      
                        onFieldChange(field.path, value)}
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

         <Button 
            onClick={onExecute} 
            disabled={isButtonDisabled} 
          >
            {isInvalid ? 'INVALID INPUT' : `EXECUTE ${selectedCommand}`}
          </Button>
        </div>
      )}
    </Card>
  );
};