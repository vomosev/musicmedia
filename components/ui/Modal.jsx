'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import Icon from '../Icon';
import Button from './Button';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

let openModalCount = 0;

function getFocusableElements(container) {
  if (!container) {
    return [];
  }

  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-hidden') !== 'true' &&
      element.getAttribute('tabindex') !== '-1'
  );
}

export function Modal({
  isOpen,
  open,
  onClose,
  title = 'Dialog',
  description,
  children,
  footer,
  initialFocusRef,
  closeLabel = 'Close dialog',
  closeOnBackdrop = true,
  closeOnEscape = true,
  dismissible = true,
  size = 'medium',
  className = '',
}) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef(null);
  const bodyRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();

  const visible = typeof isOpen === 'boolean' ? isOpen : Boolean(open);
  const safeSize = ['small', 'medium', 'large'].includes(size)
    ? size
    : 'medium';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!mounted || !visible) {
      return undefined;
    }

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    openModalCount += 1;
    document.body.classList.add('modal-open');

    const focusTimer = window.requestAnimationFrame(() => {
      const requestedFocus = initialFocusRef?.current;

      if (
        requestedFocus instanceof HTMLElement &&
        panelRef.current?.contains(requestedFocus)
      ) {
        requestedFocus.focus();
        return;
      }

      const bodyFocusable = getFocusableElements(bodyRef.current);
      const panelFocusable = getFocusableElements(panelRef.current);
      const target = bodyFocusable[0] || panelFocusable[0] || panelRef.current;

      target?.focus();
    });

    const handleKeyDown = (event) => {
      if (!panelRef.current) {
        return;
      }

      if (event.key === 'Escape' && dismissible && closeOnEscape) {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements(panelRef.current);

      if (focusableElements.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (
          activeElement === firstElement ||
          activeElement === panelRef.current ||
          !panelRef.current.contains(activeElement)
        ) {
          event.preventDefault();
          lastElement.focus();
        }
      } else if (
        activeElement === lastElement ||
        !panelRef.current.contains(activeElement)
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    const handleFocusIn = (event) => {
      if (
        panelRef.current &&
        event.target instanceof Node &&
        !panelRef.current.contains(event.target)
      ) {
        const focusableElements = getFocusableElements(panelRef.current);
        (focusableElements[0] || panelRef.current).focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      window.cancelAnimationFrame(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);

      openModalCount = Math.max(0, openModalCount - 1);
      if (openModalCount === 0) {
        document.body.classList.remove('modal-open');
      }

      const previouslyFocused = previouslyFocusedRef.current;
      if (
        previouslyFocused instanceof HTMLElement &&
        document.contains(previouslyFocused)
      ) {
        window.requestAnimationFrame(() => previouslyFocused.focus());
      }
    };
  }, [
    closeOnEscape,
    dismissible,
    initialFocusRef,
    mounted,
    visible,
  ]);

  if (!mounted || !visible) {
    return null;
  }

  const handleBackdropMouseDown = (event) => {
    if (
      dismissible &&
      closeOnBackdrop &&
      event.target === event.currentTarget
    ) {
      onCloseRef.current?.();
    }
  };

  const panelClasses = [
    'modal-panel',
    `modal-panel--${safeSize}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={handleBackdropMouseDown}
      aria-hidden="false"
    >
      <section
        ref={panelRef}
        className={panelClasses}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        <header className="modal-header">
          <div className="modal-heading">
            <h2 className="modal-title" id={titleId}>
              {title}
            </h2>
            {description ? (
              <p className="modal-description" id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>

          {dismissible ? (
            <Button
              type="button"
              variant="ghost"
              className="modal-close"
              aria-label={closeLabel}
              onClick={() => onCloseRef.current?.()}
            >
              <Icon name="close" />
            </Button>
          ) : null}
        </header>

        <div ref={bodyRef} className="modal-body">
          {children}
        </div>

        {footer ? <footer className="modal-footer">{footer}</footer> : null}
      </section>
    </div>,
    document.body
  );
}

export default Modal;