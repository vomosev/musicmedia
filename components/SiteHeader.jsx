'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { Icon } from './Icon';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

const authenticatedLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/releases', label: 'Releases' },
  { href: '/publishing', label: 'Publishing' },
  { href: '/campaigns', label: 'Campaigns' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  useEffect(() => {
    setMobileNavigationOpen(false);
    setLogoutError('');
  }, [pathname]);

  const accountName =
    user?.artistName || user?.artist_name || user?.name || user?.email || 'Artist account';

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);
    setLogoutError('');

    try {
      await logout();
      setMobileNavigationOpen(false);
      router.replace('/');
      router.refresh();
    } catch {
      setLogoutError('We could not sign you out. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  const renderNavigation = (mobile = false) => (
    <nav
      className={mobile ? 'mobile-navigation' : 'primary-navigation'}
      aria-label={mobile ? 'Mobile account navigation' : 'Account navigation'}
    >
      <ul className={mobile ? 'mobile-navigation-list' : 'navigation-list'}>
        {authenticatedLinks.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== '/dashboard' && pathname.startsWith(`${link.href}/`));

          return (
            <li key={link.href}>
              <Link
                className={`navigation-link${active ? ' navigation-link-active' : ''}`}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                onClick={mobile ? () => setMobileNavigationOpen(false) : undefined}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link
          className="site-brand"
          href={user ? '/dashboard' : '/'}
          aria-label="MusicMedia home"
        >
          <span className="site-brand-mark" aria-hidden="true">
            M
          </span>
          <span className="site-brand-text">MusicMedia</span>
        </Link>

        {user ? renderNavigation() : null}

        <div className="header-actions">
          {loading ? (
            <span className="header-auth-status" role="status" aria-live="polite">
              Checking account…
            </span>
          ) : user ? (
            <>
              <div className="account-summary" title={accountName}>
                <span className="account-name">{accountName}</span>
                {user.email ? <span className="account-email">{user.email}</span> : null}
              </div>

              <div className="desktop-account-action">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleLogout}
                  loading={loggingOut}
                  disabled={loggingOut}
                >
                  Log out
                </Button>
              </div>

              <div className="mobile-menu-action">
                <Button
                  type="button"
                  variant="ghost"
                  aria-label="Open account navigation"
                  aria-haspopup="dialog"
                  aria-expanded={mobileNavigationOpen}
                  onClick={() => setMobileNavigationOpen(true)}
                >
                  <Icon name="menu" />
                  <span className="screen-reader-only">Menu</span>
                </Button>
              </div>
            </>
          ) : (
            <div className="guest-actions">
              <Button href="/login" variant="ghost">
                Log in
              </Button>
              <Button href="/signup" variant="primary">
                Get started
              </Button>
            </div>
          )}
        </div>
      </div>

      {user ? (
        <Modal
          isOpen={mobileNavigationOpen}
          onClose={() => setMobileNavigationOpen(false)}
          title="Account navigation"
          description="Manage your MusicMedia catalog and campaigns."
        >
          <div className="mobile-navigation-content">
            <div className="mobile-account-summary">
              <span className="account-label">Signed in as</span>
              <strong className="account-name" title={accountName}>
                {accountName}
              </strong>
              {user.email ? (
                <span className="account-email" title={user.email}>
                  {user.email}
                </span>
              ) : null}
            </div>

            {renderNavigation(true)}

            {logoutError ? (
              <p className="form-error" role="alert">
                {logoutError}
              </p>
            ) : null}

            <Button
              type="button"
              variant="danger"
              fullWidth
              onClick={handleLogout}
              loading={loggingOut}
              disabled={loggingOut}
            >
              Log out
            </Button>
          </div>
        </Modal>
      ) : null}
    </header>
  );
}

export default SiteHeader;