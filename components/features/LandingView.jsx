import { Button } from "../ui/Button";
import { Card, CardHeader, CardBody } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Icon } from "../Icon";

const platformFeatures = [
  {
    icon: "upload",
    title: "Release everywhere",
    description:
      "Prepare singles, EPs, and albums for distribution with organized metadata, identifiers, track details, and release dates.",
    points: [
      "Centralized release metadata",
      "ISRC and UPC tracking",
      "Clear delivery status",
    ],
  },
  {
    icon: "document",
    title: "Protect your publishing",
    description:
      "Register songs, document writer contributions, and keep ownership information ready for publishing administration.",
    points: [
      "Writer and ownership records",
      "PRO and IPI information",
      "Registration status tracking",
    ],
  },
  {
    icon: "megaphone",
    title: "Plan focused campaigns",
    description:
      "Connect each release to a practical marketing plan with objectives, channels, budgets, and campaign dates.",
    points: [
      "Release-linked campaigns",
      "Budget and timeline planning",
      "Channel-specific objectives",
    ],
  },
];

const workflowSteps = [
  {
    number: "01",
    title: "Build your catalog",
    description:
      "Add a release such as “Midnight Signals,” confirm its primary track, and schedule the launch date.",
  },
  {
    number: "02",
    title: "Register the work",
    description:
      "Record the writers, ownership shares, performing-rights organization, and registration progress.",
  },
  {
    number: "03",
    title: "Launch the campaign",
    description:
      "Create a six-week audience-growth campaign across social, playlist, and direct-to-fan channels.",
  },
  {
    number: "04",
    title: "Review the picture",
    description:
      "Use one dashboard to see recent releases, publishing activity, and active marketing plans.",
  },
];

const trustFeatures = [
  {
    icon: "shield",
    title: "Your account stays private",
    description:
      "Secure, session-based access keeps catalog and campaign management available only to your authenticated account.",
  },
  {
    icon: "check",
    title: "Built for accurate records",
    description:
      "Structured fields and clear validation help you maintain dependable release, rights, and campaign information.",
  },
  {
    icon: "chart",
    title: "A clearer operating view",
    description:
      "Useful summaries replace scattered spreadsheets so the next action across your music business is easier to identify.",
  },
];

export default function LandingView() {
  return (
    <div className="landing-view page-stack">
      <section className="hero" aria-labelledby="landing-title">
        <div className="hero-content">
          <Badge tone="accent">Built for independent music teams</Badge>

          <div className="hero-copy">
            <h1 id="landing-title">
              Move your music from finished master to lasting momentum.
            </h1>
            <p className="hero-description">
              MusicMedia brings distribution planning, publishing records, and
              marketing campaigns into one focused workspace for artists and
              their teams.
            </p>
          </div>

          <div className="hero-actions">
            <Button href="/signup" variant="primary">
              Create your artist account
            </Button>
            <Button href="/login" variant="secondary">
              Log in
            </Button>
          </div>

          <ul className="hero-highlights" aria-label="Platform highlights">
            <li>
              <Icon name="check" />
              <span>Organized release delivery</span>
            </li>
            <li>
              <Icon name="check" />
              <span>Documented ownership details</span>
            </li>
            <li>
              <Icon name="check" />
              <span>Practical campaign planning</span>
            </li>
          </ul>
        </div>

        <div className="hero-preview" aria-label="Example artist workspace">
          <div className="hero-preview-artwork" aria-hidden="true">
            <Icon name="music" />
          </div>

          <div className="hero-preview-content">
            <div className="hero-preview-heading">
              <div>
                <span className="eyebrow">Upcoming release</span>
                <h2>Midnight Signals</h2>
              </div>
              <Badge tone="success">Scheduled</Badge>
            </div>

            <dl className="hero-preview-details">
              <div>
                <dt>Release type</dt>
                <dd>EP</dd>
              </div>
              <div>
                <dt>Tracks</dt>
                <dd>5</dd>
              </div>
              <div>
                <dt>Launch</dt>
                <dd>18 Oct 2026</dd>
              </div>
            </dl>

            <div className="hero-preview-progress">
              <div className="hero-preview-progress-header">
                <span>Launch readiness</span>
                <strong>80%</strong>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-label="Example launch readiness"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow="80"
              >
                <span className="progress-value progress-value--eighty" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="platform-title">
        <div className="section-heading">
          <span className="eyebrow">One connected platform</span>
          <h2 id="platform-title">
            Give every part of your release strategy a home.
          </h2>
          <p>
            Keep the details that drive your music business organized from the
            first delivery plan through rights registration and audience
            growth.
          </p>
        </div>

        <div className="feature-grid">
          {platformFeatures.map((feature) => (
            <Card key={feature.title} as="article" className="feature-card">
              <CardHeader>
                <div className="feature-icon" aria-hidden="true">
                  <Icon name={feature.icon} />
                </div>
                <h3>{feature.title}</h3>
              </CardHeader>
              <CardBody>
                <p>{feature.description}</p>
                <ul className="check-list">
                  {feature.points.map((point) => (
                    <li key={point}>
                      <Icon name="check" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="landing-section" aria-labelledby="workflow-title">
        <div className="section-heading">
          <span className="eyebrow">A realistic workflow</span>
          <h2 id="workflow-title">From release setup to campaign review.</h2>
          <p>
            MusicMedia gives growing teams a repeatable path without forcing
            distribution, publishing, and promotion into separate systems.
          </p>
        </div>

        <ol className="workflow-grid">
          {workflowSteps.map((step) => (
            <li key={step.number} className="workflow-step">
              <span className="workflow-number" aria-hidden="true">
                {step.number}
              </span>
              <div className="workflow-copy">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-section" aria-labelledby="confidence-title">
        <div className="section-heading">
          <span className="eyebrow">Work with confidence</span>
          <h2 id="confidence-title">
            Reliable tools for decisions that matter.
          </h2>
          <p>
            Clear records and focused summaries help you spend less time
            reconstructing information and more time building your audience.
          </p>
        </div>

        <div className="trust-grid">
          {trustFeatures.map((feature) => (
            <Card key={feature.title} as="article" className="trust-card">
              <CardBody>
                <div className="feature-icon feature-icon--subtle" aria-hidden="true">
                  <Icon name={feature.icon} />
                </div>
                <div className="trust-card-copy">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="cta-panel" aria-labelledby="cta-title">
        <div className="cta-copy">
          <Badge tone="accent">Your next release starts here</Badge>
          <h2 id="cta-title">
            Build a more organized foundation for your music.
          </h2>
          <p>
            Create your MusicMedia account to manage upcoming releases,
            publishing works, and marketing campaigns from one secure
            workspace.
          </p>
        </div>

        <div className="cta-actions">
          <Button href="/signup" variant="primary">
            Get started
          </Button>
          <Button href="/login" variant="ghost">
            I already have an account
          </Button>
        </div>
      </section>
    </div>
  );
}