import AuthForm from "../../components/features/AuthForm";

export const metadata = {
  title: "Create your artist account | MusicMedia",
  description:
    "Join MusicMedia to distribute releases, register publishing works, and plan music marketing campaigns.",
};

export default function SignupPage() {
  return (
    <section className="page-stack" aria-labelledby="signup-heading">
      <header className="page-header">
        <p className="eyebrow">Artist onboarding</p>
        <h1 id="signup-heading" className="page-title">
          Build your music career in one place
        </h1>
        <p className="page-description">
          Create your MusicMedia account to prepare releases for distribution,
          organize your publishing catalog, and launch focused marketing
          campaigns.
        </p>
      </header>

      <AuthForm mode="signup" />
    </section>
  );
}