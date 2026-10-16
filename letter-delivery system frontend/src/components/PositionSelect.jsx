import { ChevronDown } from 'lucide-react';
import { getRecipientPositionGroups } from '../constants/recipientPositions';
import '../tokens.css';
import './PositionSelect.css';

const POSITION_GROUPS = getRecipientPositionGroups();

/**
 * Recipient position select.
 *
 * One field backed by the predefined local positions, so it renders and is usable
 * immediately with no network round trip. The options are grouped with <optgroup>
 * to mirror the mobile picker sections, and a native <select> keeps keyboard
 * navigation and screen-reader support without building a custom listbox.
 */
function PositionSelect({
  id = 'recipientPosition',
  value,
  onChange,
  onBlur,
  invalid = false,
  describedBy,
  disabled = false,
  placeholder = 'Select position',
}) {
  return (
    <div className={`position-select${invalid ? ' position-select-invalid' : ''}`}>
      <select
        id={id}
        name="recipientPosition"
        className="position-select-control"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        required
        aria-required="true"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
      >
        <option value="">{placeholder}</option>
        {POSITION_GROUPS.map(({ group, positions }) => (
          <optgroup key={group} label={group}>
            {positions.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <ChevronDown className="position-select-chevron" size={18} aria-hidden="true" />
    </div>
  );
}

export default PositionSelect;