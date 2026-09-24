export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-layout">
        <p className="footer-copy">
          © MusicMedia. Distribution, publishing, and marketing for independent
          artists.
        </p>

        <nav className="footer-links" aria-label="Platform links">
          <a href="/releases">Distribution</a>
          <a href="/publishing">Publishing</a>
          <a href="/campaigns">Marketing</a>
          <a href="https://musicmedia.arx-app.com">
            musicmedia.arx-app.com
          </a>
        </nav>
      </div>
    </footer>
  );
}