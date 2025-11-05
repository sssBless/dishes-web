import { Form, Link, useActionData, useNavigation } from 'react-router-dom';

export default function Register() {
  const actionData = useActionData<{ error?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-primary)',
      padding: '2rem',
    }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center', color: 'var(--text-primary)' }}>
          Регистрация
        </h1>
        
        {actionData?.error && (
          <div className="alert alert-error">{actionData.error}</div>
        )}

        <Form method="post" replace>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="username">Имя пользователя</label>
            <input
              type="text"
              id="username"
              name="username"
              required
              minLength={3}
              disabled={isSubmitting}
              autoComplete="username"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              disabled={isSubmitting}
              autoComplete="email"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={6}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="confirmPassword">Подтвердите пароль</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              minLength={6}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </Form>

        <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-primary)' }}>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
}
