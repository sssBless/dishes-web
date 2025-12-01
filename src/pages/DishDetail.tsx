import { Form, Link, useLoaderData, useNavigation, useSubmit, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { Dish } from '../utils/services/dish.service';
import { useAuth } from '../hooks/useAuth';
import {apiService} from '../utils/services/api.service';
import deleteIcon from '../assets/delete-icon.svg';

interface LoaderData {
  dish: Dish;
}

// Конвертация единиц измерения в граммы
function convertToGrams(quantity: number, unit: string, opts?: { gramsPerPiece?: number; densityGPerMl?: number }): number {
  const u = unit?.toLowerCase() || 'г';
  if (u === 'г' || u === 'g' || u === 'гр') return quantity;
  if (u === 'кг') return quantity * 1000;
  if (u === 'мл') return quantity * (opts?.densityGPerMl ?? 1);
  if (u === 'шт') return quantity * (opts?.gramsPerPiece ?? 0);
  if (u === 'ст.л.') return quantity * 15;
  if (u === 'ч.л.') return quantity * 5;
  if (u === 'стакан') return quantity * 200;
  return quantity;
}

function calculateDishStats(dish: Dish) {
  let calories = 0;
  let totalGi = 0;
  let totalWeight = 0;
  let totalBreadUnits = 0;

  dish.ingredients.forEach((di) => {
    const ingredient = di.ingredient;
    const unit = di.unit || 'г';
    const quantityInGrams = convertToGrams(di.quantity, unit, {
      gramsPerPiece: (ingredient as any).gramsPerPiece,
      densityGPerMl: (ingredient as any).densityGPerMl,
    });
    
    if (quantityInGrams <= 0) return; // Пропускаем ингредиенты с нулевым весом
    
    totalWeight += quantityInGrams;
    
    // Получаем калории из БД (caloriesPer100g из Ingredients)
    if (unit === 'шт' && (ingredient as any).caloriesPerPiece != null) {
      calories += (ingredient as any).caloriesPerPiece * di.quantity;
    } else if (ingredient.caloriesPer100g && ingredient.caloriesPer100g > 0) {
      calories += (ingredient.caloriesPer100g * quantityInGrams) / 100;
    }
    
    // ГИ берем из БД (Ingredients.glycemicIndex)
    totalGi += ingredient.glycemicIndex * quantityInGrams;
    
    // ХЕ берем из БД (Ingredients.breadUnitsIn1g)
    totalBreadUnits += ingredient.breadUnitsIn1g * quantityInGrams;
  });

  const avgGlycemicIndex = totalWeight > 0 ? totalGi / totalWeight : 0;

  return {
    calories: Math.round(calories),
    glycemicIndex: Math.round(avgGlycemicIndex),
    totalBreadUnits: Math.round(totalBreadUnits * 100) / 100,
  };
}

// SVG иконки в стиле SVG Repo
const EditIcon = ({ size = 20 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'block' }}
  >
    <path 
      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);


const LoadingIcon = ({ size = 20 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ 
      display: 'block',
      animation: 'spin 1s linear infinite',
    }}
  >
    <defs>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </defs>
    <circle 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeDasharray="32" 
      strokeDashoffset="32"
      opacity="0.3"
    />
    <circle 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeDasharray="32" 
      strokeDashoffset="24"
    />
  </svg>
);

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

const HeartIcon = ({ filled = false, size = 20 }: { filled?: boolean; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor" 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'block' }}
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export default function DishDetail() {
  const { dish } = useLoaderData() as LoaderData;
  const { user, isAdmin } = useAuth();
  const navigation = useNavigation();
  const submit = useSubmit();
  const [searchParams] = useSearchParams();
  const isDeleting = navigation.state === 'submitting' && navigation.formMethod === 'DELETE';
  const fromAdmin = searchParams.get('from') === 'admin';
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);

  useEffect(() => {
    const checkFavorite = async () => {
      try {
        const result = await apiService.dishService.checkFavorite(dish.id);
        setIsFavorite(result.isFavorite);
      } catch (error) {
        console.error('Failed to check favorite status:', error);
      }
    };
    checkFavorite();
  }, [dish.id]);

  const handleToggleFavorite = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoadingFavorite) return;
    
    setIsLoadingFavorite(true);
    try {
      if (isFavorite) {
        await apiService.dishService.removeFromFavorites(dish.id);
        setIsFavorite(false);
      } else {
        await apiService.dishService.addToFavorites(dish.id);
        setIsFavorite(true);
      }
    } catch (error: any) {
      console.error('Failed to toggle favorite:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Не удалось изменить статус избранного';
      alert(errorMessage);
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (window.confirm('Вы уверены, что хотите удалить это блюдо?')) {
      submit(null, { method: 'delete' });
    }
  };

  const stats = calculateDishStats(dish);
  const statusColors = {
    ACCEPTED: 'var(--accent-green)',
    PENDING: 'var(--accent-blue)',
    REJECTED: 'var(--accent-coral)',
  };
  const StatusIcon = {
    ACCEPTED: AcceptedIcon,
    PENDING: PendingIcon,
    REJECTED: RejectedIcon,
  }[dish.status];

  const isOwner = user?.id === dish.authorId;
  // Админы и владельцы могут удалять блюда
  const canDelete = isOwner || isAdmin;
  // Владельцы могут обновить свое одобренное блюдо
  const canUpdate = isOwner && dish.status === 'ACCEPTED';
  // Админы могут редактировать любые блюда, владельцы могут редактировать свои блюда со статусом PENDING
  const canEdit = isAdmin || (isOwner && dish.status === 'PENDING');

  // Обычные пользователи могут видеть только одобренные блюда или свои собственные
  if (!isAdmin && dish.status !== 'ACCEPTED' && !isOwner) {
    return (
      <div>
        <div style={{ marginBottom: '1.5rem' }}>
          <Link 
            to={fromAdmin ? "/admin" : "/"} 
            style={{ color: 'var(--accent-blue)' }}
          >
            ← {fromAdmin ? 'Назад к админ-панели' : 'Назад к списку блюд'}
          </Link>
        </div>
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ color: 'var(--accent-coral)', marginBottom: '1rem' }}>Блюдо недоступно</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Это блюдо еще не одобрено администратором и недоступно для просмотра.
          </p>
          <Link to="/" className="btn-primary">
            Вернуться к списку блюд
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link 
          to={fromAdmin ? "/admin" : "/"} 
          style={{ color: 'var(--accent-blue)' }}
        >
          ← {fromAdmin ? 'Назад к админ-панели' : 'Назад к списку блюд'}
        </Link>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ marginBottom: '0.5rem' }}>{dish.name}</h1>
            {(isAdmin || isOwner) && (
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
                marginTop: '0.5rem',
              }}>
                <StatusIcon size={20} />
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {!isAdmin && user && (
              <button
                onClick={handleToggleFavorite}
                disabled={isLoadingFavorite}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: isFavorite ? 'var(--accent-coral)' : 'var(--accent-blue)',
                  color: 'white',
                  border: 'none',
                  cursor: isLoadingFavorite ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isLoadingFavorite ? 0.6 : 1,
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  if (!isLoadingFavorite) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoadingFavorite) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
                title={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
              >
                <HeartIcon filled={isFavorite} size={20} />
              </button>
            )}
            {(isAdmin || canEdit) && (
              <Link 
                to={`/dishes/${dish.id}/edit`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--accent-blue)',
                  color: 'white',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2980b9';
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-blue)';
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                title="Редактировать блюдо"
              >
                <EditIcon size={20} />
              </Link>
            )}
            {canUpdate && (
              <Form method="post" action={`/dishes/${dish.id}/update`} style={{ display: 'inline' }}>
                <button
                  type="submit"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--accent-blue)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '0.875rem',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2980b9';
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--accent-blue)';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  title="Обновить блюдо (статус изменится на 'На рассмотрении')"
                >
                  Обновить
                </button>
              </Form>
            )}
            {canDelete && (
              <Form method="delete" style={{ display: 'inline' }}>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--accent-coral)',
                    color: 'white',
                    border: 'none',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isDeleting ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isDeleting) {
                      e.currentTarget.style.backgroundColor = '#e74c3c';
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDeleting) {
                      e.currentTarget.style.backgroundColor = 'var(--accent-coral)';
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                  title={isDeleting ? 'Удаление...' : 'Удалить'}
                >
                  {isDeleting ? (
                    <LoadingIcon size={20} />
                  ) : (
                    <img 
                      src={deleteIcon} 
                      alt="Удалить" 
                      width={20} 
                      height={20}
                      style={{ 
                        display: 'block',
                        filter: 'brightness(0) invert(1)'
                      }}
                    />
                  )}
                </button>
              </Form>
            )}
          </div>
        </div>

        {dish.imageUrl && (
          <img
            src={`http://localhost:3000${dish.imageUrl}`}
            alt={dish.name}
            style={{
              width: '100%',
              maxHeight: '400px',
              objectFit: 'cover',
              borderRadius: '8px',
              marginBottom: '1.5rem',
            }}
          />
        )}

        {dish.description && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>Описание</h2>
            <p style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>
              {dish.description}
            </p>
          </div>
        )}

        {dish.cookingTime != null && dish.cookingTime > 0 && (
          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style={{ fontSize: '1rem', fontWeight: '500' }}>
              Время приготовления: {dish.cookingTime} мин
            </span>
          </div>
        )}

        {dish.recipe && dish.recipe.trim() && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>Рецепт</h2>
            <div style={{ 
              color: 'var(--text-primary)', 
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              backgroundColor: '#f9f9f9',
              padding: '1rem',
              borderRadius: '8px'
            }}>
              {dish.recipe}
            </div>
          </div>
        )}


        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Пищевая ценность</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}>
            <div className="card" style={{ backgroundColor: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>
                {stats.calories}
              </div>
              <div style={{ color: '#666' }}>ккал</div>
            </div>
            <div className="card" style={{ backgroundColor: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>
                {stats.glycemicIndex}
              </div>
              <div style={{ color: '#666' }}>Гликемический индекс</div>
            </div>
            <div className="card" style={{ backgroundColor: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-coral)' }}>
                {stats.totalBreadUnits}
              </div>
              <div style={{ color: '#666' }}>Хлебные единицы</div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Ингредиенты</h2>
          {dish.ingredients.length === 0 ? (
            <p style={{ color: '#666' }}>Нет ингредиентов</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {dish.ingredients.map((di) => (
                <div
                  key={di.ingredientId}
                  className="card"
                  style={{
                    backgroundColor: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500' }}>{di.ingredient.name}</div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      {di.ingredient.abbreviation} • ГИ: {di.ingredient.glycemicIndex}
                    </div>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                    {di.quantity} {di.unit || di.ingredient.unit || 'г'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.875rem',
          color: '#666',
        }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Автор:</strong> {dish.author.username} ({dish.author.email})
          </div>
          <div>
            <strong>Создано:</strong> {new Date(dish.createdAt).toLocaleString('ru-RU')}
          </div>
          {dish.updatedAt !== dish.createdAt && (
            <div>
              <strong>Обновлено:</strong> {new Date(dish.updatedAt).toLocaleString('ru-RU')}
            </div>
          )}
        </div>

        {isAdmin && (
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '2px solid var(--border-color)',
          }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Управление статусом</h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Form method="patch" action={`/admin/dishes/${dish.id}/status`}>
                <input type="hidden" name="status" value="ACCEPTED" />
                <button
                  type="submit"
                  className={dish.status === 'ACCEPTED' ? 'btn-primary' : 'btn-outline'}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  disabled={dish.status === 'ACCEPTED' || navigation.state === 'submitting'}
                >
                  Принять
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
                  На рассмотрение
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
                  Отклонить
                </button>
              </Form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

