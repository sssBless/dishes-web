import { useState } from 'react';
import { Form, useLoaderData, useActionData, useNavigation, useRevalidator, useNavigate } from 'react-router-dom';
import type { Dish } from '../utils/services/dish.service';
import type { User } from '../utils/services/user.service';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  setAdminSearchQuery,
  setAdminStatusFilter,
  resetAdminFilters,
} from '../store/slices/filtersSlice';

interface LoaderData {
  dishes: Dish[];
  users: User[];
}

interface ActionData {
  error?: string;
  success?: boolean;
}

// SVG иконки для статусов
const AcceptedIcon = ({ size = 20 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'block' }}
  >
    <path 
      d="M20 6L9 17l-5-5" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

const PendingIcon = ({ size = 20 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'block' }}
  >
    <circle 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="2"
    />
    <path 
      d="M12 6v6l4 2" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

const RejectedIcon = ({ size = 20 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'block' }}
  >
    <path 
      d="M18 6L6 18M6 6l12 12" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export default function AdminPanel() {
  const { dishes, users } = useLoaderData() as LoaderData;
  const actionData = useActionData() as ActionData | undefined;
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dishes' | 'users'>('dishes');
  const dispatch = useAppDispatch();
  const adminFilters = useAppSelector((state) => state.filters.admin);
  const { searchQuery, statusFilter } = adminFilters;

  const statusColors = {
    ACCEPTED: 'var(--accent-green)',
    PENDING: 'var(--accent-blue)',
    REJECTED: 'var(--accent-coral)',
  };
  const StatusIconComponent = {
    ACCEPTED: AcceptedIcon,
    PENDING: PendingIcon,
    REJECTED: RejectedIcon,
  };
  const statusLabels = {
    ACCEPTED: 'Принято',
    PENDING: 'На рассмотрении',
    REJECTED: 'Отклонено',
  };

  // Revalidate after successful action
  if (actionData?.success && navigation.state === 'idle') {
    revalidator.revalidate();
  }

  // Фильтрация блюд по поисковому запросу и статусу
  const filteredDishes = dishes.filter((dish) => {
    // Фильтр по статусу
    if (statusFilter !== 'ALL' && dish.status !== statusFilter) {
      return false;
    }
    // Фильтр по поисковому запросу
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      dish.name.toLowerCase().includes(query) ||
      dish.description?.toLowerCase().includes(query) ||
      dish.author.username.toLowerCase().includes(query) ||
      dish.author.email.toLowerCase().includes(query) ||
      dish.id.toString().includes(query)
    );
  });

  // Фильтрация пользователей по поисковому запросу
  const filteredUsers = users.filter((user) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.id.toString().includes(query) ||
      (user.role === 'ADMIN' && 'администратор'.includes(query)) ||
      (user.role === 'USER' && 'пользователь'.includes(query))
    );
  });

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Админ-панель</h1>

      {actionData?.error && <div className="alert alert-error">{actionData.error}</div>}
      {actionData?.success && <div className="alert alert-success">Операция выполнена успешно</div>}

      <div style={{ marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('dishes')}
            className={activeTab === 'dishes' ? 'btn-primary' : 'btn-outline'}
            style={{ padding: '0.75rem 1.5rem' }}
          >
            Блюда
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={activeTab === 'users' ? 'btn-primary' : 'btn-outline'}
            style={{ padding: '0.75rem 1.5rem' }}
          >
            Пользователи
          </button>
          <div style={{ flex: 1, maxWidth: '400px', marginLeft: 'auto' }}>
            <input
              type="text"
              placeholder={`Поиск по ${activeTab === 'dishes' ? 'блюдам' : 'пользователям'}...`}
              value={searchQuery}
              onChange={(e) => dispatch(setAdminSearchQuery(e.target.value))}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => dispatch(setAdminSearchQuery(''))}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              ✕ Очистить
            </button>
          )}
        </div>
      </div>

      {activeTab === 'dishes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Управление блюдами</h2>
            {(searchQuery || statusFilter !== 'ALL') && (
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                Найдено: {filteredDishes.length} из {dishes.length}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#666', marginRight: '0.5rem' }}>Статус:</span>
            <button
              onClick={() => dispatch(setAdminStatusFilter('ALL'))}
              className={statusFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              Все
            </button>
            <button
              onClick={() => dispatch(setAdminStatusFilter('PENDING'))}
              className={statusFilter === 'PENDING' ? 'btn-primary' : 'btn-outline'}
              style={{ 
                padding: '0.5rem 1rem', 
                fontSize: '0.875rem',
                borderColor: statusFilter === 'PENDING' ? 'var(--accent-blue)' : undefined,
              }}
            >
              {statusLabels.PENDING}
            </button>
            <button
              onClick={() => dispatch(setAdminStatusFilter('ACCEPTED'))}
              className={statusFilter === 'ACCEPTED' ? 'btn-primary' : 'btn-outline'}
              style={{ 
                padding: '0.5rem 1rem', 
                fontSize: '0.875rem',
                borderColor: statusFilter === 'ACCEPTED' ? 'var(--accent-green)' : undefined,
              }}
            >
              {statusLabels.ACCEPTED}
            </button>
            <button
              onClick={() => dispatch(setAdminStatusFilter('REJECTED'))}
              className={statusFilter === 'REJECTED' ? 'btn-primary' : 'btn-outline'}
              style={{ 
                padding: '0.5rem 1rem', 
                fontSize: '0.875rem',
                borderColor: statusFilter === 'REJECTED' ? 'var(--accent-coral)' : undefined,
              }}
            >
              {statusLabels.REJECTED}
            </button>
          </div>
          {dishes.length === 0 ? (
            <div className="empty-state">Нет блюд</div>
          ) : filteredDishes.length === 0 ? (
            <div className="empty-state">
              {searchQuery || statusFilter !== 'ALL' 
                ? `По выбранным фильтрам ничего не найдено${searchQuery ? ` (поиск: "${searchQuery}")` : ''}${statusFilter !== 'ALL' ? ` (статус: ${statusLabels[statusFilter]})` : ''}`
                : 'Нет блюд'
              }
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {filteredDishes.map((dish) => (
                <div 
                  key={dish.id} 
                  className="card"
                  style={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onClick={(e) => {
                    // Если клик был по кнопке или форме, не открываем детали
                    const target = e.target as HTMLElement;
                    if (target.closest('button') || target.closest('form')) {
                      return;
                    }
                    navigate(`/dishes/${dish.id}?from=admin`);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ margin: 0, color: 'var(--accent-blue)' }}>{dish.name}</h3>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '4px',
                          backgroundColor: statusColors[dish.status],
                          color: 'white',
                          minWidth: '40px',
                          height: '40px',
                        }}>
                          {(() => {
                            const Icon = StatusIconComponent[dish.status];
                            return <Icon size={20} />;
                          })()}
                        </div>
                      </div>
                      {dish.description && (
                        <p style={{ 
                          fontSize: '0.875rem', 
                          color: '#666', 
                          marginBottom: '0.5rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {dish.description}
                        </p>
                      )}
                      <div style={{ fontSize: '0.875rem', color: '#666' }}>
                        Автор: {dish.author.username} • Ингредиентов: {dish.ingredients?.length || 0}
                      </div>
                    </div>
                  </div>

                  <div 
                    style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Form method="patch" action={`/admin/dishes/${dish.id}/status`}>
                      <input type="hidden" name="status" value="ACCEPTED" />
                      <button
                        type="submit"
                        className={dish.status === 'ACCEPTED' ? 'btn-primary' : 'btn-outline'}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        disabled={dish.status === 'ACCEPTED' || navigation.state === 'submitting'}
                      >
                        ✓ Принять
                      </button>
                    </Form>
                    <Form method="patch" action={`/admin/dishes/${dish.id}/status`}>
                      <input type="hidden" name="status" value="PENDING" />
                      <button
                        type="submit"
                        className={dish.status === 'PENDING' ? 'btn-primary' : 'btn-outline'}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        disabled={dish.status === 'PENDING' || navigation.state === 'submitting'}
                      >
                        ⏳ На рассмотрение
                      </button>
                    </Form>
                    <Form method="patch" action={`/admin/dishes/${dish.id}/status`}>
                      <input type="hidden" name="status" value="REJECTED" />
                      <button
                        type="submit"
                        className={dish.status === 'REJECTED' ? 'btn-danger' : 'btn-outline'}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        disabled={dish.status === 'REJECTED' || navigation.state === 'submitting'}
                      >
                        ✗ Отклонить
                      </button>
                    </Form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Управление пользователями</h2>
            {searchQuery && (
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                Найдено: {filteredUsers.length} из {users.length}
              </div>
            )}
          </div>
          {users.length === 0 ? (
            <div className="empty-state">Нет пользователей</div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state">По запросу "{searchQuery}" ничего не найдено</div>
          ) : (
            <div className="card">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>ID</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Имя пользователя</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Роль</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem' }}>{user.id}</td>
                      <td style={{ padding: '0.75rem' }}>{user.username}</td>
                      <td style={{ padding: '0.75rem' }}>{user.email}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '4px',
                          backgroundColor: user.role === 'ADMIN' ? 'var(--accent-green)' : 'var(--accent-blue)',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                        }}>
                          {user.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Form method="patch" action={`/admin/users/${user.id}/role`}>
                            <input type="hidden" name="role" value="ADMIN" />
                            <button
                              type="submit"
                              className={user.role === 'ADMIN' ? 'btn-primary' : 'btn-outline'}
                              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                              disabled={user.role === 'ADMIN' || navigation.state === 'submitting'}
                            >
                              Админ
                            </button>
                          </Form>
                          <Form method="patch" action={`/admin/users/${user.id}/role`}>
                            <input type="hidden" name="role" value="USER" />
                            <button
                              type="submit"
                              className={user.role === 'USER' ? 'btn-primary' : 'btn-outline'}
                              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                              disabled={user.role === 'USER' || navigation.state === 'submitting'}
                            >
                              Пользователь
                            </button>
                          </Form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
