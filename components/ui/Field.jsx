'use client';

import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useId,
} from 'react';

const FieldContext = createContext(null);

function joinClasses(...classes) {
  return classes.filter(Boolean).join(' ');
}

function hasContent(value) {
  return value !== undefined && value !== null && value !== false && value !== '';
}

function normalizeId(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, '');
}

function findChildId(children) {
  const childArray = Children.toArray(children);

  for (const child of childArray) {
    if (isValidElement(child) && child.props?.id) {
      return child.props.id;
    }
  }

  return null;
}

function mergeDescribedBy(...values) {
  const ids = values
    .flatMap((value) => (typeof value === 'string' ? value.split(/\s+/) : []))
    .filter(Boolean);

  return ids.length > 0 ? [...new Set(ids)].join(' ') : undefined;
}

export function Field({
  id,
  htmlFor,
  label,
  hint,
  error,
  required = false,
  className = '',
  children,
}) {
  const generatedId = useId();
  const controlId =
    id ||
    htmlFor ||
    findChildId(children) ||
    `field-${normalizeId(generatedId)}`;

  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;
  const showHint = hasContent(hint);
  const showError = hasContent(error);

  const contextValue = {
    controlId,
    describedBy: mergeDescribedBy(
      showHint ? hintId : undefined,
      showError ? errorId : undefined,
    ),
    errorId: showError ? errorId : undefined,
    invalid: showError,
    required,
  };

  return (
    <div
      className={joinClasses(
        'field',
        showError && 'field-error-state',
        className,
      )}
    >
      {hasContent(label) ? (
        <label className="field-label" htmlFor={controlId}>
          <span className="field-label-text">{label}</span>
          {required ? (
            <span className="field-required" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <FieldContext.Provider value={contextValue}>
        {typeof children === 'function'
          ? children({
              id: controlId,
              describedBy: contextValue.describedBy,
              invalid: contextValue.invalid,
              required,
            })
          : children}
      </FieldContext.Provider>

      {showHint ? (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      ) : null}

      {showError ? (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef(function Input(
  {
    id,
    className = '',
    required = false,
    error,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    'aria-errormessage': ariaErrorMessage,
    ...props
  },
  ref,
) {
  const context = useContext(FieldContext);
  const generatedId = useId();
  const controlId =
    id || context?.controlId || `input-${normalizeId(generatedId)}`;
  const invalid = hasContent(error) || context?.invalid || ariaInvalid;
  const isRequired = required || Boolean(context?.required);

  return (
    <input
      {...props}
      ref={ref}
      id={controlId}
      required={isRequired}
      aria-required={isRequired || undefined}
      aria-invalid={invalid ? true : undefined}
      aria-describedby={mergeDescribedBy(
        ariaDescribedBy,
        context?.describedBy,
      )}
      aria-errormessage={
        ariaErrorMessage || (context?.invalid ? context.errorId : undefined)
      }
      className={joinClasses('field-control', 'input', className)}
    />
  );
});

export const Select = forwardRef(function Select(
  {
    id,
    className = '',
    required = false,
    error,
    children,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    'aria-errormessage': ariaErrorMessage,
    ...props
  },
  ref,
) {
  const context = useContext(FieldContext);
  const generatedId = useId();
  const controlId =
    id || context?.controlId || `select-${normalizeId(generatedId)}`;
  const invalid = hasContent(error) || context?.invalid || ariaInvalid;
  const isRequired = required || Boolean(context?.required);

  return (
    <select
      {...props}
      ref={ref}
      id={controlId}
      required={isRequired}
      aria-required={isRequired || undefined}
      aria-invalid={invalid ? true : undefined}
      aria-describedby={mergeDescribedBy(
        ariaDescribedBy,
        context?.describedBy,
      )}
      aria-errormessage={
        ariaErrorMessage || (context?.invalid ? context.errorId : undefined)
      }
      className={joinClasses('field-control', 'select', className)}
    >
      {children}
    </select>
  );
});

export const Textarea = forwardRef(function Textarea(
  {
    id,
    className = '',
    required = false,
    error,
    rows = 4,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    'aria-errormessage': ariaErrorMessage,
    ...props
  },
  ref,
) {
  const context = useContext(FieldContext);
  const generatedId = useId();
  const controlId =
    id || context?.controlId || `textarea-${normalizeId(generatedId)`;
  const invalid = hasContent(error) || context?.invalid || ariaInvalid;
  const isRequired = required || Boolean(context?.required);

  return (
    <textarea
      {...props}
      ref={ref}
      id={controlId}
      rows={rows}
      required={isRequired}
      aria-required={isRequired || undefined}
      aria-invalid={invalid ? true : undefined}
      aria-describedby={mergeDescribedBy(
        ariaDescribedBy,
        context?.describedBy,
      )}
      aria-errormessage={
        ariaErrorMessage || (context?.invalid ? context.errorId : undefined)
      }
      className={joinClasses('field-control', 'textarea', className)}
    />
  );
});