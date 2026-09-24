'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../AuthProvider';
import { Field, Input } from '../ui/Field';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ApiError, post } from '../../lib/api';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createInitialValues() {
  return {
    name: '',
    artistName: '',
    email: '',
    password: '',
    confirmation: '',
  };
}

function validate(values, mode) {
  const errors = {};
  const email = values.email.trim();

  if (mode === 'signup') {
    const name = values.name.trim();
    const artistName = values.artistName.trim();

    if (!name) {
      errors.name = 'Enter your full name.';
    } else if (name.length < 2) {
      errors.name = 'Your name must contain at least 2 characters.';
    } else if (name.length > 120) {
      errors.name = 'Your name must contain 120 characters or fewer.';
    }

    if (!artistName) {
      errors.artistName = 'Enter the artist or project name you release under.';
    } else if (artistName.length < 2) {
      errors.artistName = 'Artist name must contain at least 2 characters.';
    } else if (artistName.length > 160) {
      errors.artistName = 'Artist name must contain 160 characters or fewer.';
    }
  }

  if (!email) {
    errors.email = 'Enter your email address.';
  } else if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!values.password) {
    errors.password = 'Enter your password.';
  } else if (values.password.length < 8) {
    errors.password = 'Password must contain at least 8 characters.';
  } else if (values.password.length > 128) {
    errors.password = 'Password must contain 128 characters or fewer.';
  }

  if (mode === 'signup') {
    if (!values.confirmation) {
      errors.confirmation = 'Confirm your password.';
    } else if (values.confirmation !== values.password) {
      errors.confirmation = 'Passwords do not match.';
    }
  }

  return errors;
}

function getServerFieldErrors(error) {
  if (!(error instanceof ApiError)) {
    return {};
  }

  const details =
    error.data?.details ??
    error.data?.fields ??
    error.details ??
    error.fields;

  if (!details || typeof details !== 'object' || Array.isArray(details)) {
    return {};
  }

  const allowedFields = new Set([
    'name',
    'artistName',
    'email',
    'password',
    'confirmation',
  ]);
  const fieldErrors = {};

  Object.entries(details).forEach(([field, message]) => {
    if (allowedFields.has(field) && typeof message === 'string' && message.trim()) {
      fieldErrors[field] = message.trim();
    }
  });

  return fieldErrors;
}

function getSubmitError(error, mode) {
  if (error instanceof ApiError && typeof error.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return mode === 'login'
    ? 'We could not sign you in. Check your connection and try again.'
    : 'We could not create your account. Check your connection and try again.';
}

export function AuthForm({ mode = 'login' }) {
  const isSignup = mode === 'signup';
  const router = useRouter();
  const { refreshUser } = useAuth();
  const errorRef = useRef(null);
  const [values, setValues] = useState(createInitialValues);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (submitError) {
      errorRef.current?.focus();
    }
  }, [submitError]);

  function updateField(event) {
    const { name, value } = event.target;

    setValues((current) => ({
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

    if (submitting) {
      return;
    }

    const nextErrors = validate(values, isSignup ? 'signup' : 'login');
    setFieldErrors(nextErrors);
    setSubmitError('');

    if (Object.keys(nextErrors).length > 0) {
      const firstInvalidField = Object.keys(nextErrors)[0];
      document.getElementById(`auth-${firstInvalidField}`)?.focus();
      return;
    }

    setSubmitting(true);

    const payload = isSignup
      ? {
          name: values.name.trim(),
          artistName: values.artistName.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
        }
      : {
          email: values.email.trim().toLowerCase(),
          password: values.password,
        };

    try {
      await post(
        isSignup ? '/api/auth/signup' : '/api/auth/login',
        payload
      );
      await refreshUser();
      router.replace('/dashboard');
      router.refresh();
    } catch (error) {
      const serverFieldErrors = getServerFieldErrors(error);

      if (Object.keys(serverFieldErrors).length > 0) {
        setFieldErrors((current) => ({
          ...current,
          ...serverFieldErrors,
        }));
      }

      setSubmitError(getSubmitError(error, isSignup ? 'signup' : 'login'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-layout" aria-labelledby="auth-form-title">
      <Card className="auth-card">
        <CardHeader>
          <div className="auth-form-header">
            <Badge variant="accent">
              {isSignup ? 'Artist onboarding' : 'Secure artist access'}
            </Badge>
            <div className="section-heading">
              <h1 id="auth-form-title" className="section-title">
                {isSignup ? 'Create your MusicMedia account' : 'Welcome back'}
              </h1>
              <p className="section-description">
                {isSignup
                  ? 'Set up one workspace for distribution, publishing registrations, and release marketing.'
                  : 'Sign in to manage your releases, publishing catalog, campaigns, and performance summaries.'}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardBody>
          <form
            className="auth-form"
            onSubmit={handleSubmit}
            noValidate
            aria-busy={submitting}
          >
            {submitError ? (
              <div
                ref={errorRef}
                className="form-alert form-alert--error"
                role="alert"
                tabIndex={-1}
              >
                <strong>
                  {isSignup ? 'Account creation failed' : 'Sign-in failed'}
                </strong>
                <span>{submitError}</span>
              </div>
            ) : null}

            <div className="form-stack">
              {isSignup ? (
                <div className="form-grid">
                  <Field
                    label="Full name"
                    htmlFor="auth-name"
                    error={fieldErrors.name}
                    required
                  >
                    <Input
                      id="auth-name"
                      name="name"
                      type="text"
                      value={values.name}
                      onChange={updateField}
                      autoComplete="name"
                      maxLength={120}
                      disabled={submitting}
                      required
                      aria-invalid={Boolean(fieldErrors.name)}
                    />
                  </Field>

                  <Field
                    label="Artist name"
                    htmlFor="auth-artistName"
                    hint="Use the primary artist or project name shown on your releases."
                    error={fieldErrors.artistName}
                    required
                  >
                    <Input
                      id="auth-artistName"
                      name="artistName"
                      type="text"
                      value={values.artistName}
                      onChange={updateField}
                      autoComplete="organization"
                      maxLength={160}
                      disabled={submitting}
                      required
                      aria-invalid={Boolean(fieldErrors.artistName)}
                    />
                  </Field>
                </div>
              ) : null}

              <Field
                label="Email address"
                htmlFor="auth-email"
                error={fieldErrors.email}
                required
              >
                <Input
                  id="auth-email"
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={updateField}
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={254}
                  disabled={submitting}
                  required
                  aria-invalid={Boolean(fieldErrors.email)}
                />
              </Field>

              <Field
                label="Password"
                htmlFor="auth-password"
                hint={isSignup ? 'Use at least 8 characters.' : undefined}
                error={fieldErrors.password}
                required
              >
                <Input
                  id="auth-password"
                  name="password"
                  type="password"
                  value={values.password}
                  onChange={updateField}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  minLength={8}
                  maxLength={128}
                  disabled={submitting}
                  required
                  aria-invalid={Boolean(fieldErrors.password)}
                />
              </Field>

              {isSignup ? (
                <Field
                  label="Confirm password"
                  htmlFor="auth-confirmation"
                  error={fieldErrors.confirmation}
                  required
                >
                  <Input
                    id="auth-confirmation"
                    name="confirmation"
                    type="password"
                    value={values.confirmation}
                    onChange={updateField}
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    disabled={submitting}
                    required
                    aria-invalid={Boolean(fieldErrors.confirmation)}
                  />
                </Field>
              ) : null}
            </div>

            <div className="form-actions">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={submitting}
                disabled={submitting}
              >
                {isSignup ? 'Create account' : 'Sign in'}
              </Button>

              <p className="auth-alternate">
                {isSignup
                  ? 'Already have a MusicMedia account?'
                  : 'New to MusicMedia?'}
              </p>

              <Button
                href={isSignup ? '/login' : '/signup'}
                variant="secondary"
                fullWidth
                disabled={submitting}
              >
                {isSignup ? 'Sign in instead' : 'Create an account'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </section>
  );
}

export default AuthForm;