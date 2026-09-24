import { AuthForm } from "../../components/features/AuthForm";

export const metadata = {
  title: "Log in | MusicMedia",
  description:
    "Log in to manage your music distribution, publishing registrations, and marketing campaigns.",
};

export default function LoginPage() {
  return (
    <section className="auth-page" aria-labelledby="login-page-title">
      <header className="auth-page-header">
        <p className="eyebrow">Artist account</p>
        <h1 id="login-page-title">Welcome back</h1>
        <p className="page-description">
          Log in to manage your releases, publishing catalog, marketing
          campaigns, and performance summaries.
        </p>
      </header>

      <AuthForm mode="login" />
    </section>
  );
}