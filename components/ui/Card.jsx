import { forwardRef } from "react";
import { Icon } from "../Icon";

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

export const Card = forwardRef(function Card(
  { as: Component = "section", className = "", children, ...props },
  ref
) {
  return (
    <Component ref={ref} className={classNames("card", className)} {...props}>
      {children}
    </Component>
  );
});

Card.displayName = "Card";

export const CardHeader = forwardRef(function CardHeader(
  {
    as: Component = "div",
    headingAs: Heading = "h2",
    title,
    description,
    eyebrow,
    action,
    children,
    className = "",
    ...props
  },
  ref
) {
  const hasSummary = eyebrow || title || description;

  return (
    <Component
      ref={ref}
      className={classNames("card-header", className)}
      {...props}
    >
      {hasSummary ? (
        <div className="card-header-content">
          {eyebrow ? <p className="card-eyebrow">{eyebrow}</p> : null}
          {title ? <Heading className="card-title">{title}</Heading> : null}
          {description ? (
            <p className="card-description">{description}</p>
          ) : null}
        </div>
      ) : null}

      {children}

      {action ? <div className="card-header-action">{action}</div> : null}
    </Component>
  );
});

CardHeader.displayName = "CardHeader";

export const CardBody = forwardRef(function CardBody(
  { as: Component = "div", className = "", children, ...props },
  ref
) {
  return (
    <Component
      ref={ref}
      className={classNames("card-body", className)}
      {...props}
    >
      {children}
    </Component>
  );
});

CardBody.displayName = "CardBody";

export const StatCard = forwardRef(function StatCard(
  {
    as: Component = "article",
    label,
    title,
    value,
    icon,
    description,
    detail,
    helperText,
    trend,
    className = "",
    ...props
  },
  ref
) {
  const displayLabel = label ?? title;
  const supportingText = description ?? detail ?? helperText;
  const iconContent =
    typeof icon === "string" ? (
      <Icon name={icon} className="stat-card-icon-svg" />
    ) : (
      icon
    );

  return (
    <Component
      ref={ref}
      className={classNames("card", "stat-card", className)}
      {...props}
    >
      <div className="stat-card-content">
        <div className="stat-card-summary">
          {displayLabel ? (
            <p className="stat-card-label">{displayLabel}</p>
          ) : null}
          {value !== undefined && value !== null ? (
            <p className="stat-card-value">{value}</p>
          ) : null}
          {supportingText ? (
            <p className="stat-card-description">{supportingText}</p>
          ) : null}
          {trend ? <div className="stat-card-trend">{trend}</div> : null}
        </div>

        {iconContent ? (
          <div className="stat-card-icon" aria-hidden="true">
            {iconContent}
          </div>
        ) : null}
      </div>
    </Component>
  );
});

StatCard.displayName = "StatCard";