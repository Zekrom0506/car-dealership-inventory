import { useId, type InputHTMLAttributes } from 'react'
import { CircleAlert } from 'lucide-react'

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** Shown in rust under the input; also marks the input invalid. */
  error?: string
  /** Muted help text under the input, e.g. "Only when adding". */
  hint?: string
  /** Auth and dialog forms use a bolder label (600) and 46px inputs on auth pages. */
  emphasis?: 'normal' | 'strong'
  /** "lg" = 46px tall (log in / register). */
  inputSize?: 'md' | 'lg'
}

/**
 * Labelled text input. The label, error and hint are linked to the input
 * (htmlFor / aria-describedby) so screen readers read them with the field.
 */
export function TextField({
  label,
  error,
  hint,
  emphasis = 'normal',
  inputSize = 'md',
  id,
  className = '',
  ...inputProps
}: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className={`text-[13px] ${emphasis === 'strong' ? 'font-semibold' : 'font-medium'}`}>
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={
          `${inputSize === 'lg' ? 'h-[46px]' : 'h-11'} w-full box-border bg-paper px-3 font-body text-base text-ink md:text-[15px] ` +
          `${error ? 'border-2 border-rust' : 'border border-ink'} ${className}`
        }
        {...inputProps}
      />
      {error && (
        <span id={errorId} className="flex items-center gap-1.5 text-[13px] font-medium text-rust">
          <CircleAlert size={14} strokeWidth={2} aria-hidden="true" />
          {error}
        </span>
      )}
      {hint && (
        <span id={hintId} className="text-xs font-normal text-grease">
          {hint}
        </span>
      )}
    </div>
  )
}
