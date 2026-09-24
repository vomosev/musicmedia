'use client';

import { Card, CardBody } from './Card';
import Button from './Button';
import Spinner from './Spinner';
import Icon from '../Icon';

export function LoadingState({
  label = 'Loading content',
  skeletonCount = 3,
  className = '',
}) {
  const count = Math.min(Math.max(Number(skeletonCount) || 3, 1), 8);
  const classes = ['data-state', 'loading-state', className]
    .filter(Boolean)
    .join(' ');

  return (
    <Card className={classes}>
      <CardBody>
        <div className="loading-state-header">
          <Spinner size="panel" label={label} />
          <p className="loading-state-label">{label}</p>
        </div>

        <div className="skeleton-list" aria-hidden="true">
          {Array.from({ length: count }, (_, index) => (
            <div className="skeleton-region" key={index}>
              <span className="skeleton-line skeleton-line-title" />
              <span className="skeleton-line skeleton-line-body" />
              <span className="skeleton-line skeleton-line-short" />
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

export function ErrorState({
  title = 'We could not load this content',
  description = 'The service may be temporarily unavailable. Please try again.',
  message,
  onRetry,
  retryLabel = 'Try again',
  retrying = false,
  className = '',
}) {
  const detail = message || description;
  const classes = ['data-state', 'error-state', className]
    .filter(Boolean)
    .join(' ');

  return (
    <Card className={classes}>
      <CardBody>
        <div className="state-content" role="alert">
          <div className="state-icon" aria-hidden="true">
            <Icon name="alertCircle" />
          </div>

          <div className="state-copy">
            <h2 className="state-title">{title}</h2>
            <p className="state-description">{detail}</p>
          </div>

          {typeof onRetry === 'function' ? (
            <div className="state-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={onRetry}
                loading={retrying}
                disabled={retrying}
              >
                <Icon name="refresh" />
                <span>{retrying ? 'Trying again' : retryLabel}</span>
              </Button>
            </div>
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
}
