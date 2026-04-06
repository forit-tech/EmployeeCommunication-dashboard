interface HeaderProps {
  apiStatus: "loading" | "online" | "error";
  theme: "light" | "dark";
  onThemeToggle: () => void;
}

const apiStatusCopy = {
  loading: {
    label: "Проверка API",
    tone: "muted",
  },
  online: {
    label: "API онлайн",
    tone: "success",
  },
  error: {
    label: "Ошибка API",
    tone: "danger",
  },
} as const;

export function Header({ apiStatus, theme, onThemeToggle }: HeaderProps) {
  const status = apiStatusCopy[apiStatus];

  return (
    <header className="dashboard-header">
      <div className="header-copy">
        <p className="eyebrow">Тестовое задание</p>
        <h1>Визуализация взаимодействий сотрудников</h1>
        <p className="lead">
          Одностраничный dashboard для обзора связей между сотрудниками,
          интенсивности взаимодействий и детального списка обменов из backend
          API.
        </p>
      </div>

      <div className="header-actions">
        <button
          className="theme-toggle"
          type="button"
          onClick={onThemeToggle}
          aria-label={`Переключить тему. Сейчас ${theme === "dark" ? "тёмная" : "светлая"}`}
        >
          <span className={`theme-option ${theme === "light" ? "is-active" : ""}`}>
            Light
          </span>
          <span className={`theme-option ${theme === "dark" ? "is-active" : ""}`}>
            Dark
          </span>
        </button>

        <div className={`status-chip status-chip--${status.tone}`}>
          <span className="status-dot" />
          {status.label}
        </div>
      </div>
    </header>
  );
}
