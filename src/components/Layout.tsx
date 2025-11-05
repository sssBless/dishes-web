import { Link, NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Layout() {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        backgroundColor: 'var(--header-bg)',
        boxShadow: 'var(--shadow)',
        padding: '1rem 0',
        marginBottom: '2rem',
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Link to={isAdmin ? "/admin" : "/"} style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: 'var(--accent-green)',
            textDecoration: 'none',
          }}>
            Диабетическое Питание
          </Link>

          <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            {isAuthenticated ? (
              <>
                {!isAdmin && (
                  <NavLink 
                    to="/" 
                    end
                    style={({ isActive }) => ({ 
                      color: isActive ? 'var(--accent-blue)' : 'var(--text-primary)',
                      fontWeight: isActive ? '600' : '400',
                      textDecoration: 'none',
                      borderBottom: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
                      paddingBottom: '0.25rem',
                      transition: 'all 0.2s',
                    })}
                  >
                    Блюда
                  </NavLink>
                )}
                <NavLink 
                  to="/dishes/new" 
                  end
                  style={({ isActive }) => ({ 
                    color: isActive ? 'var(--accent-blue)' : 'var(--text-primary)',
                    fontWeight: isActive ? '600' : '400',
                    textDecoration: 'none',
                    borderBottom: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
                    paddingBottom: '0.25rem',
                    transition: 'all 0.2s',
                  })}
                >
                  Добавить блюдо
                </NavLink>
                {!isAdmin && (
                  <NavLink 
                    to="/my-dishes" 
                    end
                    style={({ isActive }) => ({ 
                      color: isActive ? 'var(--accent-blue)' : 'var(--text-primary)',
                      fontWeight: isActive ? '600' : '400',
                      textDecoration: 'none',
                      borderBottom: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
                      paddingBottom: '0.25rem',
                      transition: 'all 0.2s',
                    })}
                  >
                    Мои блюда
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink 
                    to="/admin" 
                    end
                    style={({ isActive }) => ({ 
                      color: isActive ? 'var(--accent-blue)' : 'var(--text-primary)',
                      fontWeight: isActive ? '600' : '400',
                      textDecoration: 'none',
                      borderBottom: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
                      paddingBottom: '0.25rem',
                      transition: 'all 0.2s',
                    })}
                  >
                    Админ-панель
                  </NavLink>
                )}
                <span style={{ color: 'var(--text-primary)' }}>
                  {user?.username}
                </span>
                <button onClick={handleLogout} className="btn-outline" style={{ padding: '0.5rem 1rem' }}>
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-outline" style={{ padding: '0.5rem 1rem' }}>
                  Вход
                </Link>
                <Link to="/register" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
                  Регистрация
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main style={{ flex: 1, padding: '0 1rem' }}>
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer style={{
        backgroundColor: 'var(--header-bg)',
        padding: '2rem 0',
        marginTop: '3rem',
        textAlign: 'center',
        color: 'var(--text-primary)',
      }}>
        <div className="container">
          <p>&copy; 2025 Диабетическое Питание. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
