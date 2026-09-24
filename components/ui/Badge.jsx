const BADGE_VARIANTS = new Set([
  "neutral",
  "accent",
  "success",
  "warning",
  "danger",
]);

export function Badge({
  children,
  variant = "neutral",
  label,
  className = "",
  ...props
}) {
  const resolvedVariant = BADGE_VARIANTS.has(variant) ? variant : "neutral";
  const content = children ?? label ?? resolvedVariant;
  const classes = [
    "badge",
    `badge--${resolvedVariant}`,
    className.trim(),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      {...props}
      className={classes}
      aria-label={label || props["aria-label"] || undefined}
    >
      {content}
    </span>
  );
}

export default Badge;