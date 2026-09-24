'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../AuthProvider';
import { Button } from '../ui/Button';
import { Field, Input, Select, Textarea } from '../ui/Field';
import { Card, CardBody, CardHeader } from '../ui/Card';
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
  alternateTitle: '',
  writers: '',
  ownershipShare: '100',
  pro: '',
  ipiNumber: '',
  registrationStatus: 'draft',
};

const PRO_OPTIONS = [
  { value: '', label: 'Select an organization' },
  { value: 'ASCAP', label: 'ASCAP' },
  { value: 'BMI', label: 'BMI' },
  { value: 'SESAC', label: 'SESAC' },
  { value: 'GMR', label: 'Global Music Rights (GMR)' },
  { value: 'PRS', label: 'PRS for Music' },
  { value: 'SOCAN', label: 'SOCAN' },
  { value: 'Other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'registered', label: 'Registered' },
];

function extractWorks(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.works)) {
    return payload.works;
  }

  if (Array.isArray(payload?.data?.works)) {
    return payload.data.works;
  }

  return [];
}

function extractCreatedWork(payload) {
  if (payload?.work && typeof payload.work === 'object') {
    return payload.work;
  }

  if (payload?.data?.work && typeof payload.data.work === 'object') {
    return payload.data.work;
  }

  if (payload?.id || payload?.title) {
    return payload;
  }

  return null;
}

function getWorkValue(work, camelKey, snakeKey, fallback = '') {
  return work?.[camelKey] ?? work?.[snakeKey] ?? fallback;
}

function getErrorMessage(error, fallback) {
  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function statusVariant(status) {
  switch (String(status || '').toLowerCase()) {
    case 'registered':
      return 'success';
    case 'submitted':
    case 'pending':
      return 'warning';
    case 'rejected':
      return 'danger';
    default:
      return 'neutral';
  }
}

function validateForm(values) {
  const errors = {};
  const title = values.title.trim();
  const alternateTitle = values.alternateTitle.trim();
  const writers = values.writers.trim();
  const ownershipShare = Number(values.ownershipShare);
  const ipiNumber = values.ipiNumber.trim();

  if (!title) {
    errors.title = 'Enter the work title.';
  } else if (title.length > 160) {
    errors.title = 'Use 160 characters or fewer.';
  }

  if (alternateTitle.length > 160) {
    errors.alternateTitle = 'Use 160 characters or fewer.';
  }

  if (!writers) {
    errors.writers = 'Enter at least one writer.';
  } else if (writers.length > 500) {
    errors.writers = 'Use 500 characters or fewer.';
  }

  if (values.ownershipShare === '') {
    errors.ownershipShare = 'Enter your ownership share.';
  } else if (!Number.isFinite(ownershipShare) || ownershipShare <= 0 || ownershipShare > 100) {
    errors.ownershipShare = 'Enter a share greater than 0 and no more than 100.';
  } else if (!/^\d{1,3}(?:\.\d{1,2})?$/.test(values.ownershipShare)) {
    errors.ownershipShare = 'Use no more than two decimal places.';
  }

  if (!values.pro) {
    errors.pro = 'Select a performing-rights organization.';
  }

  if (ipiNumber && !/^\d{9,11}$/.test(ipiNumber)) {
    errors.ipiNumber = 'Enter a 9 to 11 digit IPI number.';
  }

  if (!STATUS_OPTIONS.some((option) => option.value === values.registrationStatus)) {
    errors.registrationStatus = 'Select a valid registration status.';
  }

  return errors;
}

export function PublishingView() {
  const { user, loading: authLoading, unavailable } = useAuth();
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadWorks = useCallback(async () => {
    if (!user) {
      setWorks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError('');

    try {
      const payload = await get('/api/works');
      setWorks(extractWorks(payload));
    } catch (error) {
      setLoadError(
        getErrorMessage(
          error,
          'We could not load your publishing catalog. Please try again.'
        )
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    loadWorks();
  }, [authLoading, user, loadWorks]);

  const columns = useMemo(
    () => [
      {
        key: 'title',
        header: 'Work',
        render: (work) => {
          const title = getWorkValue(work, 'title', 'title', 'Untitled work');
          const alternateTitle = getWorkValue(
            work,
            'alternateTitle',
            'alternate_title'
          );

          return (
            <div className="table-primary">
              <strong>{truncateText(title, 70)}</strong>
              {alternateTitle ? (
                <span className="table-secondary">
                  Also known as {truncateText(alternateTitle, 70)}
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        key: 'writers',
        header: 'Writers',
        render: (work) => {
          const writers = getWorkValue(work, 'writers', 'writers', 'Not provided');
          const writerText = Array.isArray(writers)
            ? writers
                .map((writer) =>
                  typeof writer === 'string'
                    ? writer
                    : writer?.name || writer?.writerName || ''
                )
                .filter(Boolean)
                .join(', ')
            : String(writers || 'Not provided');

          return truncateText(writerText, 80);
        },
      },
      {
        key: 'ownershipShare',
        header: 'Your share',
        render: (work) => {
          const share = getWorkValue(
            work,
            'ownershipShare',
            'ownership_share',
            null
          );
          const numericShare = Number(share);

          return Number.isFinite(numericShare)
            ? `${numericShare.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}%`
            : 'Not provided';
        },
      },
      {
        key: 'pro',
        header: 'PRO / IPI',
        render: (work) => {
          const pro = getWorkValue(
            work,
            'pro',
            'performing_rights_organization',
            'Not provided'
          );
          const ipiNumber = getWorkValue(work, 'ipiNumber', 'ipi_number');

          return (
            <div className="table-primary">
              <span>{pro}</span>
              {ipiNumber ? (
                <span className="table-secondary">IPI {ipiNumber}</span>
              ) : null}
            </div>
          );
        },
      },
      {
        key: 'registrationStatus',
        header: 'Status',
        render: (work) => {
          const status = getWorkValue(
            work,
            'registrationStatus',
            'registration_status',
            'draft'
          );

          return (
            <Badge variant={statusVariant(status)}>
              {formatStatus(status)}
            </Badge>
          );
        },
      },
      {
        key: 'createdAt',
        header: 'Added',
        render: (work) =>
          formatDate(getWorkValue(work, 'createdAt', 'created_at')),
      },
    ],
    []
  );

  function openCreateModal() {
    setForm(INITIAL_FORM);
    setFieldErrors({});
    setSubmitError('');
    setModalOpen(true);
  }

  function closeCreateModal() {
    if (submitting) {
      return;
    }

    setModalOpen(false);
    setFieldErrors({});
    setSubmitError('');
  }

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setFieldErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const next = { ...current };
      delete next[name];
      return next;
    });

    if (submitError) {
      setSubmitError('');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const errors = validateForm(form);
    setFieldErrors(errors);
    setSubmitError('');

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);

    const requestBody = {
      title: form.title.trim(),
      alternateTitle: form.alternateTitle.trim() || null,
      writers: form.writers.trim(),
      ownershipShare: Number(form.ownershipShare),
      pro: form.pro,
      ipiNumber: form.ipiNumber.trim() || null,
      registrationStatus: form.registrationStatus,
    };

    try {
      const payload = await post('/api/works', requestBody);
      const createdWork = extractCreatedWork(payload);

      if (createdWork) {
        setWorks((current) => [
          createdWork,
          ...current.filter(
            (work) =>
              String(work?.id) !== String(createdWork?.id) ||
              createdWork?.id == null
          ),
        ]);
      } else {
        const refreshedPayload = await get('/api/works');
        setWorks(extractWorks(refreshedPayload));
      }

      setForm(INITIAL_FORM);
      setModalOpen(false);
      setSuccessMessage(
        'Publishing work added. You can continue updating its registration as it progresses.'
      );
    } catch (error) {
      setSubmitError(
        getErrorMessage(
          error,
          'We could not save this work. Review the details and try again.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <section className="page-stack" aria-labelledby="publishing-heading">
        <header className="page-header">
          <div className="page-header-copy">
            <p className="page-eyebrow">Publishing</p>
            <h1 id="publishing-heading" className="page-title">
              Publishing catalog
            </h1>
            <p className="page-description">
              Register compositions, ownership details, and performing-rights
              information.
            </p>
          </div>
        </header>
        <LoadingState label="Loading your publishing catalog" />
      </section>
    );
  }

  if (!user) {
    return (
      <section className="page-stack" aria-labelledby="publishing-heading">
        <header className="page-header">
          <div className="page-header-copy">
            <p className="page-eyebrow">Publishing</p>
            <h1 id="publishing-heading" className="page-title">
              Publishing catalog
            </h1>
            <p className="page-description">
              Keep composition ownership and registration details organized in
              one place.
            </p>
          </div>
        </header>

        {unavailable ? (
          <ErrorState
            title="Publishing is temporarily unavailable"
            description="The MusicMedia service could not be reached. Check your connection and try again."
            onRetry={() => window.location.reload()}
            actionLabel="Try again"
          />
        ) : (
          <EmptyState
            title="Sign in to manage publishing"
            description="Your private publishing catalog is available after you sign in to your MusicMedia account."
            action={
              <Button href="/login" variant="primary">
                Sign in
              </Button>
            }
          />
        )}
      </section>
    );
  }

  return (
    <section className="page-stack" aria-labelledby="publishing-heading">
      <header className="page-header">
        <div className="page-header-copy">
          <p className="page-eyebrow">Publishing</p>
          <h1 id="publishing-heading" className="page-title">
            Publishing catalog
          </h1>
          <p className="page-description">
            Register compositions, document writer ownership, and track each
            work from draft through registration.
          </p>
        </div>

        <div className="page-actions">
          <Button type="button" variant="primary" onClick={openCreateModal}>
            Add a work
          </Button>
        </div>
      </header>

      {successMessage ? (
        <div className="notice notice-success" role="status">
          <span>{successMessage}</span>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setSuccessMessage('')}
          >
            Dismiss
          </Button>
        </div>
      ) : null}

      {loading ? (
        <LoadingState label="Loading your publishing catalog" />
      ) : loadError ? (
        <ErrorState
          title="We could not load your works"
          description={loadError}
          onRetry={loadWorks}
          actionLabel="Try again"
        />
      ) : works.length === 0 ? (
        <EmptyState
          title="Your publishing catalog is ready"
          description="Add your first composition to record its writers, ownership share, PRO affiliation, IPI number, and registration progress."
          action={
            <Button type="button" variant="primary" onClick={openCreateModal}>
              Add your first work
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader
            title="Registered works"
            description={`${works.length} ${
              works.length === 1 ? 'work' : 'works'
            } in your catalog`}
          />
          <CardBody>
            <Table
              caption="Publishing works in your MusicMedia catalog"
              columns={columns}
              rows={works}
              rowKey={(work, index) =>
                work?.id ?? `${getWorkValue(work, 'title', 'title')}-${index}`
              }
            />
          </CardBody>
        </Card>
      )}

      <Modal
        open={modalOpen}
        isOpen={modalOpen}
        onClose={closeCreateModal}
        title="Add a publishing work"
        description="Record the composition details and your ownership information. You can track registration progress from your catalog."
      >
        <form className="form-stack" onSubmit={handleSubmit} noValidate>
          {submitError ? (
            <div className="notice notice-danger" role="alert">
              {submitError}
            </div>
          ) : null}

          <div className="form-grid">
            <Field
              label="Work title"
              htmlFor="publishing-title"
              required
              error={fieldErrors.title}
            >
              <Input
                id="publishing-title"
                name="title"
                type="text"
                value={form.title}
                onChange={updateField}
                autoComplete="off"
                maxLength={160}
                required
                disabled={submitting}
              />
            </Field>

            <Field
              label="Alternate title"
              htmlFor="publishing-alternate-title"
              hint="Optional. Include another title used for this composition."
              error={fieldErrors.alternateTitle}
            >
              <Input
                id="publishing-alternate-title"
                name="alternateTitle"
                type="text"
                value={form.alternateTitle}
                onChange={updateField}
                autoComplete="off"
                maxLength={160}
                disabled={submitting}
              />
            </Field>

            <div className="form-field-full">
              <Field
                label="Writers"
                htmlFor="publishing-writers"
                hint="List each writer or composer, separated by commas."
                required
                error={fieldErrors.writers}
              >
                <Textarea
                  id="publishing-writers"
                  name="writers"
                  value={form.writers}
                  onChange={updateField}
                  rows={4}
                  maxLength={500}
                  required
                  disabled={submitting}
                />
              </Field>
            </div>

            <Field
              label="Your ownership share"
              htmlFor="publishing-ownership-share"
              hint="Enter a percentage from 0.01 to 100."
              required
              error={fieldErrors.ownershipShare}
            >
              <Input
                id="publishing-ownership-share"
                name="ownershipShare"
                type="number"
                value={form.ownershipShare}
                onChange={updateField}
                min="0.01"
                max="100"
                step="0.01"
                inputMode="decimal"
                required
                disabled={submitting}
              />
            </Field>

            <Field
              label="Performing-rights organization"
              htmlFor="publishing-pro"
              required
              error={fieldErrors.pro}
            >
              <Select
                id="publishing-pro"
                name="pro"
                value={form.pro}
                onChange={updateField}
                required
                disabled={submitting}
              >
                {PRO_OPTIONS.map((option) => (
                  <option key={option.value || 'empty'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="IPI number"
              htmlFor="publishing-ipi-number"
              hint="Optional. Enter the writer or publisher IPI as digits only."
              error={fieldErrors.ipiNumber}
            >
              <Input
                id="publishing-ipi-number"
                name="ipiNumber"
                type="text"
                value={form.ipiNumber}
                onChange={updateField}
                inputMode="numeric"
                autoComplete="off"
                maxLength={11}
                disabled={submitting}
              />
            </Field>

            <Field
              label="Registration status"
              htmlFor="publishing-registration-status"
              required
              error={fieldErrors.registrationStatus}
            >
              <Select
                id="publishing-registration-status"
                name="registrationStatus"
                value={form.registrationStatus}
                onChange={updateField}
                required
                disabled={submitting}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
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
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              disabled={submitting}
            >
              {submitting ? 'Saving work' : 'Save work'}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

export default PublishingView;