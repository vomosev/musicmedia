import { Card, CardBody } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";

export default function Loading() {
  return (
    <section
      className="page-stack"
      aria-labelledby="route-loading-title"
      aria-busy="true"
    >
      <Card>
        <CardBody>
          <div className="loading-state" role="status" aria-live="polite">
            <Spinner size="panel" label="Loading MusicMedia content" />
            <div className="state-copy">
              <h1 id="route-loading-title" className="state-title">
                Loading your workspace
              </h1>
              <p className="state-description">
                Preparing your latest music activity and account tools.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="skeleton-grid" aria-hidden="true">
        <Card>
          <CardBody>
            <div className="skeleton-stack">
              <div className="skeleton skeleton-heading" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line skeleton-line-short" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="skeleton-stack">
              <div className="skeleton skeleton-heading" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line skeleton-line-short" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="skeleton-stack">
              <div className="skeleton skeleton-heading" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line skeleton-line-short" />
            </div>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}