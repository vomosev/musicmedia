"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../AuthProvider";
import Button from "../ui/Button";
import { Field, Input, Select } from "../ui/Field";
import { Card, CardBody, CardHeader } from "../ui/Card";
import Modal from "../ui/Modal";
import Table from "../ui/Table";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";
import { ErrorState, LoadingState } from "../ui/DataState";
import { get, post } from "../../lib/api";
import {
  formatCurrency,
  formatDate,
  formatStatus,
  truncateText,
} from "../../lib/formatters";

const INITIAL_FORM = {
  campaignName: "",
  release: "",
  objective: "",
  channel: "",
  budget: "",
  startDate: "",
  endDate: "",
};

const OBJECTIVES = [
  { value: "awareness", label: "Build awareness" },
  { value: "streams", label: "Increase streams" },
  { value: "pre_saves", label: "Drive pre-saves" },
  { value: "fan_growth", label: "Grow the fanbase" },
  { value: "sales", label: "Increase sales" },
];

const CHANNELS = [
  { value: "social_media", label: "Social media" },
  { value: "playlist_pitching", label: "Playlist pitching" },
  { value: "email", label: "Email marketing" },
  { value: "influencer", label: "Creator and influencer outreach" },
  { value: "multi_channel", label: "Multi-channel campaign" },
];

function normalizeCampaign(campaign) {
  return {
    id:
      campaign?.id ??
      campaign?.campaignId ??
      campaign?.campaign_id ??
      `${campaign?.campaignName || campaign?.campaign_name || "campaign"}-${
        campaign?.createdAt || campaign?.created_at || ""
      }`,
    campaignName:
      campaign?.campaignName ??
      campaign?.campaign_name ??
      campaign?.name ??
      "Untitled campaign",
    release:
      campaign?.release ??
      campaign?.releaseTitle ??
      campaign?.release_title ??
      "Unassigned release",
    objective: campaign?.objective ?? "awareness",
    channel: campaign?.channel ?? "multi_channel",
    budget: campaign?.budget ?? 0,
    startDate: campaign?.startDate ?? campaign?.start_date ?? null,
    endDate: campaign?.endDate ?? campaign?.end_date ?? null,
    status: campaign?.status ?? "draft",
  };
}

function extractCampaigns(response) {
  const items = Array.isArray(response)
    ? response
    : response?.campaigns ?? response?.data ?? [];

  return Array.isArray(items) ? items.map(normalizeCampaign) : [];
}

function getErrorMessage(error, fallback) {
  if (error && typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function statusVariant(status) {
  switch (String(status || "").toLowerCase()) {
    case "active":
    case "completed":
      return "success";
    case "scheduled":
    case "pending":
      return "accent";
    case "paused":
      return "warning";
    case "cancelled":
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}

function validateCampaign(values) {
  const errors = {};
  const name = values.campaignName.trim();
  const release = values.release.trim();
  const budget = Number(values.budget);

  if (!name) {
    errors.campaignName = "Enter a campaign name.";
  } else if (name.length > 120) {
    errors.campaignName = "Campaign names must be 120 characters or fewer.";
  }

  if (!release) {
    errors.release = "Enter the release this campaign will promote.";
  } else if (release.length > 160) {
    errors.release = "Release names must be 160 characters or fewer.";
  }

  if (!OBJECTIVES.some((option) => option.value === values.objective)) {
    errors.objective = "Choose a campaign objective.";
  }

  if (!CHANNELS.some((option) => option.value === values.channel)) {
    errors.channel = "Choose a marketing channel.";
  }

  if (values.budget === "") {
    errors.budget = "Enter a campaign budget.";
  } else if (!Number.isFinite(budget) || budget < 0) {
    errors.budget = "Enter a valid budget of zero or more.";
  } else if (budget > 10000000) {
    errors.budget = "Budget must not exceed 10,000,000.";
  }

  if (!values.startDate) {
    errors.startDate = "Choose a start date.";
  }

  if (!values.endDate) {
    errors.endDate = "Choose an end date.";
  } else if (values.startDate && values.endDate < values.startDate) {
    errors.endDate = "End date must be on or after the start date.";
  }

  return errors;
}

export default function CampaignsView() {
  const {
    user,
    loading: authLoading,
    unavailable,
    refreshUser,
  } = useAuth();

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const loadCampaigns = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    setLoadError("");

    try {
      const response = await get("/api/campaigns");
      setCampaigns(extractCampaigns(response));
    } catch (error) {
      setLoadError(
        getErrorMessage(
          error,
          "Campaigns could not be loaded. Check your connection and try again."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadCampaigns();
    }
  }, [user, loadCampaigns]);

  const columns = useMemo(
    () => [
      {
        key: "campaignName",
        label: "Campaign",
        render: (value, suppliedRow) => {
          const row =
            suppliedRow || (value && typeof value === "object" ? value : null);
          const name = row ? row.campaignName : value;

          return truncateText(name, 48);
        },
      },
      {
        key: "release",
        label: "Release",
        render: (value, suppliedRow) => {
          const row =
            suppliedRow || (value && typeof value === "object" ? value : null);
          const release = row ? row.release : value;

          return truncateText(release, 44);
        },
      },
      {
        key: "objective",
        label: "Objective",
        render: (value, suppliedRow) => {
          const row =
            suppliedRow || (value && typeof value === "object" ? value : null);
          return formatStatus(row ? row.objective : value);
        },
      },
      {
        key: "channel",
        label: "Channel",
        render: (value, suppliedRow) => {
          const row =
            suppliedRow || (value && typeof value === "object" ? value : null);
          return formatStatus(row ? row.channel : value);
        },
      },
      {
        key: "budget",
        label: "Budget",
        render: (value, suppliedRow) => {
          const row =
            suppliedRow || (value && typeof value === "object" ? value : null);
          return formatCurrency(row ? row.budget : value);
        },
      },
      {
        key: "startDate",
        label: "Schedule",
        render: (value, suppliedRow) => {
          const row =
            suppliedRow || (value && typeof value === "object" ? value : null);
          const startDate = row ? row.startDate : value;
          const endDate = row?.endDate;

          return endDate
            ? `${formatDate(startDate)} – ${formatDate(endDate)}`
            : formatDate(startDate);
        },
      },
      {
        key: "status",
        label: "Status",
        render: (value, suppliedRow) => {
          const row =
            suppliedRow || (value && typeof value === "object" ? value : null);
          const status = row ? row.status : value;

          return (
            <Badge variant={statusVariant(status)}>
              {formatStatus(status)}
            </Badge>
          );
        },
      },
    ],
    []
  );

  function openModal() {
    setForm(INITIAL_FORM);
    setFieldErrors({});
    setSubmitError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (submitting) {
      return;
    }

    setIsModalOpen(false);
    setFieldErrors({});
    setSubmitError("");
  }

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const next = { ...current };
      delete next[name];
      return next;
    });
    setSubmitError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const errors = validateCampaign(form);
    setFieldErrors(errors);
    setSubmitError("");

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        campaignName: form.campaignName.trim(),
        release: form.release.trim(),
        objective: form.objective,
        channel: form.channel,
        budget: Number(form.budget),
        startDate: form.startDate,
        endDate: form.endDate,
      };

      const response = await post("/api/campaigns", payload);
      const created = response?.campaign ?? response?.data;

      if (created && !Array.isArray(created)) {
        const normalized = normalizeCampaign(created);
        setCampaigns((current) => [
          normalized,
          ...current.filter((item) => item.id !== normalized.id),
        ]);
      } else {
        await loadCampaigns();
      }

      setSuccessMessage(`Campaign “${payload.campaignName}” was created.`);
      setIsModalOpen(false);
      setForm(INITIAL_FORM);
      setFieldErrors({});
    } catch (error) {
      setSubmitError(
        getErrorMessage(
          error,
          "The campaign could not be created. Review the details and try again."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <section className="page-stack" aria-labelledby="campaigns-title">
        <div className="page-header">
          <div className="page-header__copy">
            <p className="eyebrow">Marketing</p>
            <h1 id="campaigns-title">Campaigns</h1>
            <p className="text-muted">
              Plan focused promotion around every release.
            </p>
          </div>
        </div>
        <LoadingState label="Checking your account and loading campaigns" />
      </section>
    );
  }

  if (unavailable && !user) {
    return (
      <section className="page-stack" aria-labelledby="campaigns-title">
        <div className="page-header">
          <div className="page-header__copy">
            <p className="eyebrow">Marketing</p>
            <h1 id="campaigns-title">Campaigns</h1>
          </div>
        </div>
        <ErrorState
          title="MusicMedia is temporarily unavailable"
          description="We could not confirm your account. Check your connection and try again."
          onRetry={refreshUser}
        />
      </section>
    );
  }

  if (!user) {
    return (
      <section className="page-stack" aria-labelledby="campaigns-title">
        <div className="page-header">
          <div className="page-header__copy">
            <p className="eyebrow">Marketing</p>
            <h1 id="campaigns-title">Campaigns</h1>
          </div>
        </div>
        <Card>
          <CardBody>
            <EmptyState
              icon="campaign"
              title="Sign in to manage campaigns"
              description="Your campaign plans, budgets, schedules, and performance status are available after you sign in."
              action={
                <Button href="/login" variant="primary">
                  Sign in
                </Button>
              }
            />
          </CardBody>
        </Card>
      </section>
    );
  }

  return (
    <section className="page-stack" aria-labelledby="campaigns-title">
      <div className="page-header">
        <div className="page-header__copy">
          <p className="eyebrow">Marketing</p>
          <h1 id="campaigns-title">Campaigns</h1>
          <p className="text-muted">
            Coordinate budgets, channels, and release promotion from one
            workspace.
          </p>
        </div>
        <div className="page-actions">
          <Button type="button" variant="primary" onClick={openModal}>
            New campaign
          </Button>
        </div>
      </div>

      {successMessage ? (
        <div className="alert alert--success" role="status">
          <p>{successMessage}</p>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setSuccessMessage("")}
          >
            Dismiss
          </Button>
        </div>
      ) : null}

      {loading ? (
        <LoadingState label="Loading marketing campaigns" />
      ) : loadError ? (
        <ErrorState
          title="Campaigns could not be loaded"
          description={loadError}
          onRetry={loadCampaigns}
        />
      ) : campaigns.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon="campaign"
              title="Plan your first campaign"
              description="Create a focused marketing plan for an upcoming or existing release, then track its schedule and status here."
              action={
                <Button type="button" variant="primary" onClick={openModal}>
                  Create campaign
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="card-heading">
              <div>
                <h2>Campaign plans</h2>
                <p className="text-muted">
                  {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"}{" "}
                  in your workspace
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <Table
              caption="Music marketing campaigns"
              columns={columns}
              rows={campaigns}
              rowKey="id"
            />
          </CardBody>
        </Card>
      )}

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title="Create a marketing campaign"
        description="Define the release, goal, channel, budget, and schedule for this promotion."
      >
        <form className="form-stack" onSubmit={handleSubmit} noValidate>
          {submitError ? (
            <div className="alert alert--danger" role="alert">
              {submitError}
            </div>
          ) : null}

          <div className="form-grid">
            <Field
              label="Campaign name"
              htmlFor="campaign-name"
              required
              error={fieldErrors.campaignName}
              hint="Use a name your team will recognize."
            >
              <Input
                id="campaign-name"
                name="campaignName"
                type="text"
                value={form.campaignName}
                onChange={updateField}
                maxLength={120}
                autoComplete="off"
                required
                disabled={submitting}
                aria-invalid={Boolean(fieldErrors.campaignName)}
              />
            </Field>

            <Field
              label="Release"
              htmlFor="campaign-release"
              required
              error={fieldErrors.release}
              hint="Enter the single or album this campaign will promote."
            >
              <Input
                id="campaign-release"
                name="release"
                type="text"
                value={form.release}
                onChange={updateField}
                maxLength={160}
                autoComplete="off"
                required
                disabled={submitting}
                aria-invalid={Boolean(fieldErrors.release)}
              />
            </Field>

            <Field
              label="Objective"
              htmlFor="campaign-objective"
              required
              error={fieldErrors.objective}
            >
              <Select
                id="campaign-objective"
                name="objective"
                value={form.objective}
                onChange={updateField}
                required
                disabled={submitting}
                aria-invalid={Boolean(fieldErrors.objective)}
              >
                <option value="">Choose an objective</option>
                {OBJECTIVES.map((objective) => (
                  <option key={objective.value} value={objective.value}>
                    {objective.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Primary channel"
              htmlFor="campaign-channel"
              required
              error={fieldErrors.channel}
            >
              <Select
                id="campaign-channel"
                name="channel"
                value={form.channel}
                onChange={updateField}
                required
                disabled={submitting}
                aria-invalid={Boolean(fieldErrors.channel)}
              >
                <option value="">Choose a channel</option>
                {CHANNELS.map((channel) => (
                  <option key={channel.value} value={channel.value}>
                    {channel.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Budget"
              htmlFor="campaign-budget"
              required
              error={fieldErrors.budget}
              hint="Enter the total planned budget in USD."
            >
              <Input
                id="campaign-budget"
                name="budget"
                type="number"
                value={form.budget}
                onChange={updateField}
                min="0"
                max="10000000"
                step="0.01"
                inputMode="decimal"
                required
                disabled={submitting}
                aria-invalid={Boolean(fieldErrors.budget)}
              />
            </Field>

            <Field
              label="Start date"
              htmlFor="campaign-start-date"
              required
              error={fieldErrors.startDate}
            >
              <Input
                id="campaign-start-date"
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={updateField}
                required
                disabled={submitting}
                aria-invalid={Boolean(fieldErrors.startDate)}
              />
            </Field>

            <Field
              label="End date"
              htmlFor="campaign-end-date"
              required
              error={fieldErrors.endDate}
            >
              <Input
                id="campaign-end-date"
                name="endDate"
                type="date"
                value={form.endDate}
                onChange={updateField}
                min={form.startDate || undefined}
                required
                disabled={submitting}
                aria-invalid={Boolean(fieldErrors.endDate)}
              />
            </Field>
          </div>

          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={closeModal}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Create campaign
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}