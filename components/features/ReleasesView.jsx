'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../AuthProvider';
import { Button } from '../ui/Button';
import { Field, Input, Select } from '../ui/Field';
import { Card, CardBody } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { Table } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState, LoadingState } from '../ui/DataState';
import { get, post } from '../../lib/api';
import {
  formatDate,
  formatStatus,
  truncateText,
} from '../../lib/formatters';

const INITIAL_FORM = {
  title: '',
  artist: '',
  releaseType: 'single',
  releaseDate: '',
  genre: '',
  label: '',
  primaryTrack: '',
  isrc: '',
  upc: '',
};

const RELEASE_TYPES = [
  { value: 'single', label: 'Single' },
  { value: 'ep', label: 'EP' },
  { value: 'album', label: 'Album' },
];

function normalizeIsrc(value) {
  return String(value || '')
    .trim()
    .replace(/[\s-]/g, '')
    .toUpperCase();
}

function releaseStatusVariant(status) {
  switch (String(status || '').toLowerCase()) {
    case 'live':
    case 'released':
    case 'approved':
      return 'success';
    case 'submitted':
    case 'processing':
    case 'scheduled':
    case 'pending':
      return 'accent';
    case 'rejected':
    case 'takedown':
      return 'danger';
    case 'draft':
      return 'neutral';
    default:
      return 'warning';
  }
}

function releaseValue(release, camelKey, snakeKey, fallback = '') {
  const value = release?.[camelKey] ?? release?.[snakeKey];
  return value === null || value === undefined || value === ''
    ? fallback
    : value;
}

function validateRelease(values) {
  const errors = {};
  const title = values.title.trim();
  const artist = values.artist.trim();
  const releaseDate = values.releaseDate.trim();
  const genre = values.genre.trim();
  const label = values.label.trim();
  const primaryTrack = values.primaryTrack.trim();
  const isrc = normalizeIsrc(values.isrc);
  const upc = values.upc.trim();

  if (!title) {
    errors.title = 'Enter a release title.';
  } else if (title.length > 160) {
    errors.title = 'Release titles must be 160 characters or fewer.';
  }

  if (!artist) {
    errors.artist = 'Enter the primary artist name.';
  } else if (artist.length > 120) {
    errors.artist = 'Artist names must be 120 characters or fewer.';
  }

  if (!RELEASE_TYPES.some((type) => type.value === values.releaseType)) {
    errors.releaseType = 'Choose a valid release type.';
  }

  if (!releaseDate) {
    errors.releaseDate = 'Choose a release date.';
  } else if (
    !/^\d{4}-\d{2}-\d{2}$/.test(releaseDate) ||
    Number.isNaN(Date.parse(`${releaseDate}T00:00:00Z`))
  ) {
    errors.releaseDate = 'Enter a valid release date.';
  }

  if (!genre) {
    errors.genre = 'Enter the release genre.';
  } else if (genre.length > 80) {
    errors.genre = 'Genres must be 80 characters or fewer.';
  }

  if (!label) {
    errors.label = 'Enter a label name or use “Independent”.';
  } else if (label.length > 120) {
    errors.label = 'Label names must be 120 characters or fewer.';
  }

  if (!primaryTrack) {
    errors.primaryTrack = 'Enter the primary track title.';
  } else if (primaryTrack.length > 160) {
    errors.primaryTrack = 'Track titles must be 160 characters or fewer.';
  }

  if (!isrc) {
    errors.isrc = 'Enter the primary track ISRC.';
  } else if (!/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(isrc)) {
    errors.isrc = 'Use a valid 12-character ISRC, such as USABC2600001.';
  }

  if (!upc) {
    errors.upc = 'Enter the release UPC.';
  } else if (!/^\d{12,13}$/.test(upc)) {
    errors.upc = 'UPC must contain 12 or 13 digits.';
  }

  return errors;
}

function extractReleases(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.releases)) return response.releases;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function ReleaseIdentity({ release }) {
  const title = releaseValue(release, 'title', 'title', 'Untitled release');
  const artist = releaseValue(
    release,
    'artist',
    'artist_name',
    'Unknown artist',
  );

  return (
    <div className="release-identity">
      <div className="release-cover" aria-hidden="true">
        <span className="release-cover-mark">
          {String(title).trim().charAt(0).toUpperCase() || 'M'}
        </span>
      </div>
      <div className="release-identity-copy">
        <strong className="table-primary-text">{truncateText(title, 56)}</strong>
        <span className="table-secondary-text">
          {truncateText(artist, 44)}
        </span>
      </div>
    </div>
  );
}

export default function ReleasesView() {
  const { user, loading: authLoading, unavailable, refreshUser } = useAuth();
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadReleases = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setLoadError('');

    try {
      const response = await get('/api/releases');
      setReleases(extractReleases(response));
    } catch (error) {
      setLoadError(
        error?.message ||
          'We could not load your releases. Check your connection and try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let active = true;

    if (!user) return undefined;

    const load = async () => {
      setLoading(true);
      setLoadError('');

      try {
        const response = await get('/api/releases');
        if (active) setReleases(extractReleases(response));
      } catch (error) {
        if (active) {
          setLoadError(
            error?.message ||
              'We could not load your releases. Check your connection and try again.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [user]);

  const columns = useMemo(
    () => [
      {
        key: 'release',
        label: 'Release',
        render: (release) => <ReleaseIdentity release={release} />,
      },
      {
        key: 'type',
        label: 'Type',
        render: (release) =>
          formatStatus(
            releaseValue(release, 'releaseType', 'release_type', 'release'),
          ),
      },
      {
        key: 'date',
        label: 'Release date',
        render: (release) =>
          formatDate(
            releaseValue(release, 'releaseDate', 'release_date', null),
          ),
      },
      {
        key: 'track',
        label: 'Primary track',
        render: (release) => {
          const track =
            releaseValue(
              release,
              'primaryTrack',
              'primary_track',
              release?.tracks?.[0]?.title,
            ) || 'Not provided';
          const isrc =
            releaseValue(
              release,
              'isrc',
              'isrc',
              release?.tracks?.[0]?.isrc,
            ) || 'No ISRC';

          return (
            <div className="table-cell-stack">
              <span className="table-primary-text">
                {truncateText(track, 44)}
              </span>
              <span className="table-secondary-text">{isrc}</span>
            </div>
          );
        },
      },
      {
        key: 'status',
        label: 'Status',
        render: (release) => {
          const status = releaseValue(release, 'status', 'status', 'draft');
          return (
            <Badge variant={releaseStatusVariant(status)}>
              {formatStatus(status)}
            </Badge>
          );
        },
      },
    ],
    [],
  );

  function openCreateModal() {
    const artist =
      user?.artistName || user?.artist_name || user?.name || '';

    setForm({
      ...INITIAL_FORM,
      artist,
    });
    setErrors({});
    setSubmitError('');
    setSuccessMessage('');
    setIsModalOpen(true);
  }

  function closeCreateModal() {
    if (submitting) return;
    setIsModalOpen(false);
    setErrors({});
    setSubmitError('');
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });

    if (submitError) setSubmitError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateRelease(form);
    setErrors(nextErrors);
    setSubmitError('');

    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);

    const payload = {
      title: form.title.trim(),
      artist: form.artist.trim(),
      releaseType: form.releaseType,
      releaseDate: form.releaseDate,
      genre: form.genre.trim(),
      label: form.label.trim(),
      primaryTrack: form.primaryTrack.trim(),
      isrc: normalizeIsrc(form.isrc),
      upc: form.upc.trim(),
    };

    try {
      const response = await post('/api/releases', payload);
      const createdRelease = response?.release || response?.data || null;

      if (createdRelease && !Array.isArray(createdRelease)) {
        setReleases((current) => [createdRelease, ...current]);
      } else {
        await loadReleases();
      }

      setIsModalOpen(false);
      setForm(INITIAL_FORM);
      setErrors({});
      setSuccessMessage(
        `${payload.title} was added to your distribution catalog.`,
      );
    } catch (error) {
      setSubmitError(
        error?.message ||
          'We could not create this release. Review the details and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return <LoadingState label="Loading your distribution workspace" />;
  }

  if (!user && unavailable) {
    return (
      <ErrorState
        title="Distribution is temporarily unavailable"
        description="MusicMedia could not verify your account because the service is currently unreachable."
        onRetry={refreshUser}
      />
    );
  }

  if (!user) {
    return (
      <EmptyState
        icon="music"
        title="Sign in to manage releases"
        description="Access your distribution catalog, delivery details, identifiers, and release status from one workspace."
        action={
          <Button href="/login" variant="primary">
            Sign in
          </Button>
        }
      />
    );
  }

  return (
    <section className="page-stack" aria-labelledby="releases-title">
      <header className="page-header">
        <div className="page-heading">
          <p className="eyebrow">Distribution</p>
          <h1 id="releases-title">Releases</h1>
          <p className="page-description">
            Prepare singles, EPs, and albums for delivery while keeping release
            dates, identifiers, and primary track details organized.
          </p>
        </div>
        <div className="page-actions">
          <Button variant="primary" onClick={openCreateModal}>
            Add release
          </Button>
        </div>
      </header>

      {successMessage ? (
        <div className="alert alert-success" role="status">
          <span>{successMessage}</span>
          <Button
            variant="ghost"
            onClick={() => setSuccessMessage('')}
            aria-label="Dismiss success message"
          >
            Dismiss
          </Button>
        </div>
      ) : null}

      {loading ? (
        <LoadingState label="Loading releases" />
      ) : loadError ? (
        <ErrorState
          title="Your releases could not be loaded"
          description={loadError}
          onRetry={loadReleases}
        />
      ) : releases.length === 0 ? (
        <EmptyState
          icon="music"
          title="Your first release starts here"
          description="Add a single, EP, or album to begin organizing metadata and preparing your music for distribution."
          action={
            <Button variant="primary" onClick={openCreateModal}>
              Add your first release
            </Button>
          }
        />
      ) : (
        <Card>
          <CardBody>
            <Table
              caption="Distribution releases"
              columns={columns}
              rows={releases}
              rowKey="id"
            />
          </CardBody>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeCreateModal}
        title="Add a release"
        description="Enter the core metadata for your release and its primary track. You can review the catalog entry after it is created."
      >
        <form className="form-stack" onSubmit={handleSubmit} noValidate>
          {submitError ? (
            <div className="alert alert-danger" role="alert">
              {submitError}
            </div>
          ) : null}

          <div className="form-grid">
            <Field
              id="release-title"
              label="Release title"
              required
              error={errors.title}
            >
              <Input
                id="release-title"
                name="title"
                value={form.title}
                onChange={handleChange}
                maxLength={160}
                autoComplete="off"
                placeholder="Midnight Signals"
                disabled={submitting}
              />
            </Field>

            <Field
              id="release-artist"
              label="Primary artist"
              required
              error={errors.artist}
            >
              <Input
                id="release-artist"
                name="artist"
                value={form.artist}
                onChange={handleChange}
                maxLength={120}
                autoComplete="organization"
                placeholder="Nova Vale"
                disabled={submitting}
              />
            </Field>

            <Field
              id="release-type"
              label="Release type"
              required
              error={errors.releaseType}
            >
              <Select
                id="release-type"
                name="releaseType"
                value={form.releaseType}
                onChange={handleChange}
                disabled={submitting}
              >
                {RELEASE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              id="release-date"
              label="Release date"
              required
              error={errors.releaseDate}
              hint="Choose the planned or original release date."
            >
              <Input
                id="release-date"
                name="releaseDate"
                type="date"
                value={form.releaseDate}
                onChange={handleChange}
                disabled={submitting}
              />
            </Field>

            <Field
              id="release-genre"
              label="Genre"
              required
              error={errors.genre}
            >
              <Input
                id="release-genre"
                name="genre"
                value={form.genre}
                onChange={handleChange}
                maxLength={80}
                autoComplete="off"
                placeholder="Alternative R&B"
                disabled={submitting}
              />
            </Field>

            <Field
              id="release-label"
              label="Label"
              required
              error={errors.label}
              hint="Independent artists can enter “Independent”."
            >
              <Input
                id="release-label"
                name="label"
                value={form.label}
                onChange={handleChange}
                maxLength={120}
                autoComplete="organization"
                placeholder="Independent"
                disabled={submitting}
              />
            </Field>

            <Field
              id="release-primary-track"
              label="Primary track"
              required
              error={errors.primaryTrack}
            >
              <Input
                id="release-primary-track"
                name="primaryTrack"
                value={form.primaryTrack}
                onChange={handleChange}
                maxLength={160}
                autoComplete="off"
                placeholder="Midnight Signals"
                disabled={submitting}
              />
            </Field>

            <Field
              id="release-isrc"
              label="Primary track ISRC"
              required
              error={errors.isrc}
              hint="Enter 12 characters, with or without hyphens."
            >
              <Input
                id="release-isrc"
                name="isrc"
                value={form.isrc}
                onChange={handleChange}
                maxLength={15}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                placeholder="USABC2600001"
                disabled={submitting}
              />
            </Field>

            <Field
              id="release-upc"
              label="UPC"
              required
              error={errors.upc}
              hint="Enter the 12- or 13-digit release barcode."
            >
              <Input
                id="release-upc"
                name="upc"
                value={form.upc}
                onChange={handleChange}
                maxLength={13}
                inputMode="numeric"
                autoComplete="off"
                spellCheck={false}
                placeholder="012345678905"
                disabled={submitting}
              />
            </Field>
          </div>

          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={closeCreateModal}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Create release
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}