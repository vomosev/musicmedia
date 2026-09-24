'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../AuthProvider';
import { Card, CardBody, CardHeader, StatCard } from '../ui/Card';
import { Table } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState, LoadingState } from '../ui/DataState';
import { Button } from '../ui/Button';
import { ApiError, get } from '../../lib/api';
import {
  formatCurrency,
  formatDate,
  formatStatus,
  truncateText,
} from '../../lib/formatters';

function arrayValue(...values) {
  return values.find(Array.isArray) || [];
}

function numericValue(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number) && number >= 0) {
      return number;
    }
  }

  return 0;
}

function normalizeDashboard(response) {
  const envelope = response?.data ?? response?.dashboard ?? response ?? {};
  const summary = envelope.summary ?? envelope.counts ?? {};

  const releases = arrayValue(
    envelope.recentReleases,
    envelope.recent_releases,
    envelope.releases
  );
  const works = arrayValue(
    envelope.recentWorks,
    envelope.recent_works,
    envelope.works
  );
  const campaigns = arrayValue(
    envelope.recentCampaigns,
    envelope.recent_campaigns,
    envelope.campaigns
  );

  return {
    summary: {
      releases: numericValue(
        summary.releases,
        summary.releaseCount,
        summary.release_count,
        envelope.releaseCount,
        envelope.release_count
      ),
      works: numericValue(
        summary.works,
        summary.workCount,
        summary.work_count,
        envelope.workCount,
        envelope.work_count
      ),
      campaigns: numericValue(
        summary.campaigns,
        summary.campaignCount,
        summary.campaign_count,
        envelope.campaignCount,
        envelope.campaign_count
      ),
    },
    releases,
    works,
    campaigns,
  };
}

function badgeVariant(status) {
  const normalized = String(status || '').trim().toLowerCase();

  if (
    ['active', 'approved', 'distributed', 'live', 'registered', 'released'].includes(
      normalized
    )
  ) {
    return 'success';
  }

  if (
    ['draft', 'pending', 'planned', 'processing', 'submitted', 'scheduled'].includes(
      normalized
    )
  ) {
    return 'warning';
  }

  if (
    ['cancelled', 'canceled', 'declined', 'failed', 'rejected'].includes(normalized)
  ) {
    return 'danger';
  }

  if (['complete', 'completed', 'finished'].includes(normalized)) {
    return 'accent';
  }

  return 'neutral';
}

function StatusBadge({ status }) {
  const label = formatStatus(status || 'draft');

  return <Badge variant={badgeVariant(status)}>{label}</Badge>;
}

function DashboardLoading() {
  return (
    <div className="page-stack" aria-label="Loading dashboard">
      <div className="stats-grid">
        <LoadingState label="Loading release summary" />
        <LoadingState label="Loading publishing summary" />
        <LoadingState label="Loading campaign summary" />
      </div>
      <div className="dashboard-grid">
        <LoadingState label="Loading recent releases" />
        <LoadingState label="Loading recent works" />
        <LoadingState label="Loading recent campaigns" />
      </div>
    </div>
  );
}

export default function DashboardView() {
  const { user, loading: authLoading, unavailable, refreshUser } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [requestVersion, setRequestVersion] = useState(0);

  const retry = useCallback(() => {
    setRequestVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    if (authLoading || unavailable || !user) {
      return undefined;
    }

    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const response = await get('/api/dashboard');

        if (active) {
          setDashboard(normalizeDashboard(response));
        }
      } catch (requestError) {
        if (active) {
          setError(requestError);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [authLoading, unavailable, user, requestVersion]);

  const releaseColumns = useMemo(
    () => [
      {
        key: 'title',
        label: 'Release',
        render: (release) => (
          <div className="table-cell-stack">
            <strong className="table-primary">
              {truncateText(release.title || release.release_title || 'Untitled release', 56)}
            </strong>
            <span className="table-secondary">
              {truncateText(
                release.artist ||
                  release.artist_name ||
                  user?.artistName ||
                  user?.artist_name ||
                  'Independent artist',
                48
              )}
            </span>
          </div>
        ),
      },
      {
        key: 'release_type',
        label: 'Type',
        render: (release) =>
          formatStatus(release.releaseType || release.release_type || 'single'),
      },
      {
        key: 'release_date',
        label: 'Release date',
        render: (release) =>
          formatDate(release.releaseDate || release.release_date),
      },
      {
        key: 'status',
        label: 'Status',
        render: (release) => <StatusBadge status={release.status} />,
      },
    ],
    [user]
  );

  const workColumns = useMemo(
    () => [
      {
        key: 'title',
        label: 'Work',
        render: (work) => (
          <div className="table-cell-stack">
            <strong className="table-primary">
              {truncateText(work.title || work.work_title || 'Untitled work', 56)}
            </strong>
            <span className="table-secondary">
              {truncateText(
                work.writers || work.writer_names || work.writer || 'Writer details pending',
                56
              )}
            </span>
          </div>
        ),
      },
      {
        key: 'pro',
        label: 'PRO',
        render: (work) =>
          truncateText(
            work.performingRightsOrganization ||
              work.performing_rights_organization ||
              work.pro ||
              'Not specified',
            28
          ),
      },
      {
        key: 'ownership_share',
        label: 'Ownership',
        render: (work) => {
          const share = Number(work.ownershipShare ?? work.ownership_share);
          return Number.isFinite(share) ? `${share}%` : '—';
        },
      },
      {
        key: 'registration_status',
        label: 'Status',
        render: (work) => (
          <StatusBadge
            status={work.registrationStatus || work.registration_status || work.status}
          />
        ),
      },
    ],
    []
  );

  const campaignColumns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Campaign',
        render: (campaign) => (
          <div className="table-cell-stack">
            <strong className="table-primary">
              {truncateText(
                campaign.name || campaign.campaign_name || 'Untitled campaign',
                56
              )}
            </strong>
            <span className="table-secondary">
              {truncateText(
                campaign.releaseTitle ||
                  campaign.release_title ||
                  campaign.release ||
                  campaign.objective ||
                  'General audience growth',
                56
              )}
            </span>
          </div>
        ),
      },
      {
        key: 'channel',
        label: 'Channel',
        render: (campaign) =>
          formatStatus(campaign.channel || 'multi-channel'),
      },
      {
        key: 'budget',
        label: 'Budget',
        render: (campaign) => formatCurrency(campaign.budget),
      },
      {
        key: 'status',
        label: 'Status',
        render: (campaign) => <StatusBadge status={campaign.status} />,
      },
    ],
    []
  );

  if (authLoading) {
    return <DashboardLoading />;
  }

  if (unavailable) {
    return (
      <ErrorState
        title="Your dashboard is temporarily unavailable"
        description="MusicMedia could not reach the account service. Check your connection and try again."
        message="MusicMedia could not reach the account service. Check your connection and try again."
        onRetry={refreshUser}
      />
    );
  }

  if (!user) {
    return (
      <EmptyState
        title="Sign in to open your dashboard"
        description="Access release delivery, publishing registrations, and campaign performance from one secure workspace."
        action={
          <Button href="/login" variant="primary">
            Sign in
          </Button>
        }
      />
    );
  }

  if (loading && !dashboard) {
    return <DashboardLoading />;
  }

  if (error && !dashboard) {
    const unauthorized = error instanceof ApiError && error.status === 401;

    return (
      <ErrorState
        title={unauthorized ? 'Your session has expired' : 'We could not load your dashboard'}
        description={
          unauthorized
            ? 'Sign in again to continue managing your music.'
            : 'Your data is safe. Retry the request when your connection is available.'
        }
        message={
          unauthorized
            ? 'Sign in again to continue managing your music.'
            : 'Your data is safe. Retry the request when your connection is available.'
        }
        onRetry={unauthorized ? refreshUser : retry}
      />
    );
  }

  const data =
    dashboard ||
    normalizeDashboard({
      summary: {},
      recentReleases: [],
      recentWorks: [],
      recentCampaigns: [],
    });

  const hasRecentActivity =
    data.releases.length > 0 ||
    data.works.length > 0 ||
    data.campaigns.length > 0;

  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-heading">
          <p className="eyebrow">Artist workspace</p>
          <h1>Welcome back, {user.artistName || user.artist_name || user.name}</h1>
          <p className="page-description">
            Track your distribution pipeline, publishing catalog, and active marketing
            plans from one place.
          </p>
        </div>
        <div className="page-actions">
          <Button href="/releases" variant="primary">
            Add a release
          </Button>
          <Button href="/campaigns" variant="secondary">
            Plan a campaign
          </Button>
        </div>
      </header>

      {error ? (
        <div className="inline-state" role="status">
          <p>Some dashboard information may be out of date.</p>
          <Button variant="ghost" onClick={retry} loading={loading}>
            Refresh
          </Button>
        </div>
      ) : null}

      <section className="section-stack" aria-labelledby="account-summary-title">
        <div className="section-heading">
          <div>
            <h2 id="account-summary-title">Catalog summary</h2>
            <p>A current view of the projects managed through MusicMedia.</p>
          </div>
        </div>
        <div className="stats-grid">
          <StatCard
            label="Distribution releases"
            value={data.summary.releases}
            description="Singles, EPs, and albums"
          />
          <StatCard
            label="Publishing works"
            value={data.summary.works}
            description="Composition registrations"
          />
          <StatCard
            label="Marketing campaigns"
            value={data.summary.campaigns}
            description="Planned and active promotions"
          />
        </div>
      </section>

      <section className="section-stack" aria-labelledby="recent-activity-title">
        <div className="section-heading">
          <div>
            <h2 id="recent-activity-title">Recent activity</h2>
            <p>Your latest distribution, publishing, and marketing records.</p>
          </div>
        </div>

        {!hasRecentActivity ? (
          <EmptyState
            title="Your recent activity will appear here"
            description="Start by preparing a release, registering a composition, or creating a focused marketing campaign."
            action={
              <Button href="/releases" variant="primary">
                Create your first release
              </Button>
            }
          />
        ) : (
          <div className="dashboard-grid">
            <Card as="section">
              <CardHeader
                title="Recent releases"
                description="Latest projects in your distribution pipeline."
                action={
                  <Button href="/releases" variant="ghost">
                    View releases
                  </Button>
                }
              />
              <CardBody>
                {data.releases.length > 0 ? (
                  <Table
                    caption="Recent distribution releases"
                    columns={releaseColumns}
                    rows={data.releases}
                    rowKey="id"
                  />
                ) : (
                  <EmptyState
                    title="No releases yet"
                    description="Prepare your first single, EP, or album for distribution."
                    action={
                      <Button href="/releases" variant="secondary">
                        Add release
                      </Button>
                    }
                  />
                )}
              </CardBody>
            </Card>

            <Card as="section">
              <CardHeader
                title="Recent publishing works"
                description="Compositions and ownership registrations."
                action={
                  <Button href="/publishing" variant="ghost">
                    View works
                  </Button>
                }
              />
              <CardBody>
                {data.works.length > 0 ? (
                  <Table
                    caption="Recent publishing works"
                    columns={workColumns}
                    rows={data.works}
                    rowKey="id"
                  />
                ) : (
                  <EmptyState
                    title="No registered works yet"
                    description="Add a composition to organize writers, ownership, and registration details."
                    action={
                      <Button href="/publishing" variant="secondary">
                        Register a work
                      </Button>
                    }
                  />
                )}
              </CardBody>
            </Card>

            <Card as="section">
              <CardHeader
                title="Recent campaigns"
                description="Promotion plans across your selected channels."
                action={
                  <Button href="/campaigns" variant="ghost">
                    View campaigns
                  </Button>
                }
              />
              <CardBody>
                {data.campaigns.length > 0 ? (
                  <Table
                    caption="Recent marketing campaigns"
                    columns={campaignColumns}
                    rows={data.campaigns}
                    rowKey="id"
                  />
                ) : (
                  <EmptyState
                    title="No campaigns yet"
                    description="Build a campaign around an upcoming release or catalog milestone."
                    action={
                      <Button href="/campaigns" variant="secondary">
                        Create campaign
                      </Button>
                    }
                  />
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}