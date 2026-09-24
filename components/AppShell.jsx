import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

export default function AppShell({ children }) {
  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="app-main">
        <div className="container page-content">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}