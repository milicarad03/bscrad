import { Button } from '../UI/Button';
type LedColorPickerProps = {
  colors: string[];
  activeColor: string;
  disabled: boolean;
  onSelect: (color: string) => void;
};

const getTextColor = (color: string) => {
  const lightColors = ['WHITE', 'YELLOW', 'LIME', 'CYAN'];
  return lightColors.includes(color.toUpperCase()) ? '#0a0d12' : '#ffffff';
};

export const LedColorPicker = ({ colors, activeColor, disabled, onSelect }: LedColorPickerProps) => (
  <div className="dd-section">
    <span className="dd-section-title">LED COLOR CONFIG</span>
    <div className="dd-swatches">
      {colors.map((color) => (
        <Button
          key={color}
          className={`dd-btn dd-btn--swatch ${activeColor === color ? 'dd-btn--active' : ''}`}
          onClick={() => onSelect(color)}
          disabled={disabled}
          style={activeColor === color ? { background: color.toLowerCase(), color: getTextColor(color) } : undefined}
        >
          {color}
        </Button>
      ))}
    </div>
  </div>
);