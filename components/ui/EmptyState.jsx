import { Icon } from "../Icon";

export function EmptyState({
  icon = "music",
  title,
  description,
  action = null,
}) {
  return (
    <div className="empty-state">
      {icon ? (
        <div className="empty-state__icon" aria-hidden="true">
          {typeof icon === "string" ? <Icon name={icon} /> : icon}
        </div>
      ) : null}

      <div className="empty-state__content">
        <h2 className="empty-state__title">{title}</h2>
        {description ? (
          <p className="empty-state__description">{description}</p>
        ) : null}
      </div>

      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  );
}

export default EmptyState;