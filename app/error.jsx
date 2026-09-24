'use client';

import { ErrorState } from '../components/ui/DataState';

export default function Error({ reset }) {
  return (
    <section className="page-stack" aria-label="Page error">
      <ErrorState
        title="We couldn’t load this MusicMedia page"
        description="Something unexpected happened while preparing this page. Your account data has not been changed. Please try again."
        onRetry={reset}
      />
    </section>
  );
}