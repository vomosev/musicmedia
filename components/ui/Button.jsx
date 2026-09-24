'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import { Spinner } from './Spinner';

const VALID_VARIANTS = new Set(['primary', 'secondary', 'ghost', 'danger']);

const Button = forwardRef(function Button(
  {
    children,
    href,
    variant = 'primary',
    type = 'button',
    loading = false,
    loadingLabel,
    disabled = false,
    fullWidth = false,
    icon,
    startIcon,
    endIcon,
    iconPosition = 'start',
    className = '',
    onClick,
    ...props
  },
  ref
) {
  const resolvedVariant = VALID_VARIANTS.has(variant) ? variant : 'primary';
  const isDisabled = disabled || loading;
  const leadingIcon = startIcon ?? (iconPosition !== 'end' ? icon : null);
  const trailingIcon = endIcon ?? (iconPosition === 'end' ? icon : null);

  const classes = [
    'button',
    `button--${resolvedVariant}`,
    fullWidth ? 'button--full-width' : '',
    loading ? 'button--loading' : '',
    isDisabled ? 'button--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {loading ? (
        <Spinner size="compact" label={loadingLabel || 'Loading'} />
      ) : leadingIcon ? (
        <span className="button__icon" aria-hidden="true">
          {leadingIcon}
        </span>
      ) : null}

      {children != null ? (
        <span className="button__label">
          {loading && loadingLabel ? loadingLabel : children}
        </span>
      ) : null}

      {!loading && trailingIcon ? (
        <span className="button__icon" aria-hidden="true">
          {trailingIcon}
        </span>
      ) : null}
    </>
  );

  const handleClick = (event) => {
    if (isDisabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    onClick?.(event);
  };

  if (href) {
    return (
      <Link
        {...props}
        ref={ref}
        href={href}
        className={classes}
        onClick={handleClick}
        aria-busy={loading || undefined}
        aria-disabled={isDisabled || undefined}
        tabIndex={isDisabled ? -1 : props.tabIndex}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      {...props}
      ref={ref}
      type={type}
      className={classes}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      onClick={handleClick}
    >
      {content}
    </button>
  );
});

Button.displayName = 'Button';

export { Button };
export default Button;