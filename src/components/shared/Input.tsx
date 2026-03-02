import { Message } from '@components/shared';
import { InputStyles } from '@styles/shared';
import { InputHTMLAttributes } from 'react';

interface Props {
  type: InputHTMLAttributes<HTMLInputElement>['type'];
  id?: string;
  label?: string;
  placeholder?: string;
  value?: string | number;
  method?: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>,
  ) => void;
  className?: string;
  textarea?: boolean;
  rows?: number;
  cols?: number;
  disabled?: boolean;
  fieldError?: { field: string; message: string };
  min?: number;
  max?: number;
  required?: boolean;
}

export default function Input({
  type,
  id,
  label,
  placeholder,
  value,
  method,
  className,
  textarea,
  rows,
  cols,
  disabled,
  fieldError,
  min,
  max,
  required = false,
}: Props) {
  const errorMessage =
    fieldError?.field === id ? fieldError?.message : undefined;

  return (
    <div
      className={[
        errorMessage && InputStyles.Error,
        InputStyles.Input,
        className,
      ].join(' ')}
    >
      {label && <label htmlFor={id}>{label}</label>}
      {textarea ? (
        <textarea
          required={required}
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e) => method?.(e)}
          rows={rows || 3}
          cols={cols}
          disabled={disabled}
          style={{ fontFamily: 'inherit' }}
        />
      ) : (
        <input
          required={required}
          type={type}
          id={id}
          placeholder={placeholder}
          value={value ? value : ''}
          onChange={method}
          disabled={disabled}
          style={{ fontFamily: 'inherit' }}
          min={min}
          max={max}
        />
      )}
      {errorMessage && <Message>{errorMessage}</Message>}
    </div>
  );
}
