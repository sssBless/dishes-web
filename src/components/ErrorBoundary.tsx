import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';

export default function ErrorBoundary() {
  const error = useRouteError();

  let status = 500;
  let statusText = 'Internal Server Error';
  let message = 'Произошла непредвиденная ошибка';

  if (isRouteErrorResponse(error)) {
    status = error.status;
    statusText = error.statusText;

    if (status === 404) {
      message = 'Страница не найдена';
    } else if (status === 401) {
      message = 'Требуется авторизация';
    } else if (status === 403) {
      message = 'Доступ запрещен';
    } else {
      message = error.data?.message || error.statusText || message;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <div className="card" style={{ maxWidth: '600px', width: '100%' }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '1rem', color: 'var(--accent-coral)' }}>
          {status}
        </h1>
        <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
          {statusText}
        </h2>
        <p style={{ marginBottom: '2rem', color: '#666' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/" className="btn-primary">
            На главную
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary"
          >
            Обновить страницу
          </button>
        </div>
      </div>
    </div>
  );
}

