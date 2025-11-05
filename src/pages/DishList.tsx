import { useMemo } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import type { Dish } from '../utils/services/dish.service';
import type { Ingredient } from '../utils/services/ingredients.service';
import { useAuth } from '../hooks/useAuth';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  setDishSearchQuery,
  setDishSelectedIngredient,
  setDishMaxGlycemicIndex,
  setDishMaxCalories,
  setDishStatusFilter,
  resetDishFilters,
} from '../store/slices/filtersSlice';

interface DishStats {
  calories: number;
  glycemicIndex: number;
  totalBreadUnits: number;
}

interface LoaderData {
  dishes: Dish[];
  ingredients: Ingredient[];
}

// Конвертация единиц измерения в граммы
function convertToGrams(quantity: number, unit: string): number {
  const conversionRates: { [key: string]: number } = {
    'г': 1,
    'мл': 1,
    'шт': 0,
    'ст.л.': 15,
    'ч.л.': 5,
    'стакан': 200,
  };
  
  return quantity * (conversionRates[unit] || 1);
}

function calculateDishStats(dish: Dish): DishStats {
  let calories = 0;
  let totalGi = 0;
  let totalWeight = 0;
  let totalBreadUnits = 0;

  dish.ingredients.forEach((di) => {
    const ingredient = di.ingredient;
    const unit = di.unit || 'г';
    const quantityInGrams = convertToGrams(di.quantity, unit);
    
    if (quantityInGrams <= 0) return; // Пропускаем ингредиенты с нулевым весом
    
    totalWeight += quantityInGrams;
    
    // Получаем калории из БД (caloriesPer100g из Ingredients)
    if (ingredient.caloriesPer100g && ingredient.caloriesPer100g > 0) {
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

// SVG иконки для статусов
const AcceptedIcon = ({ size = 16 }: { size?: number }) => (
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

const PendingIcon = ({ size = 16 }: { size?: number }) => (
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

const RejectedIcon = ({ size = 16 }: { size?: number }) => (
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

export default function DishList() {
  const { dishes, ingredients } = useLoaderData() as LoaderData;
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Получаем фильтры из Redux
  const filters = useAppSelector((state) => state.filters.dishes);
  const { searchQuery, selectedIngredient, maxGlycemicIndex, maxCalories, statusFilter } = filters;
  
  // Для обычных пользователей показываем только одобренные блюда
  const availableDishes = useMemo(() => {
    if (isAdmin) {
      return dishes;
    }
    return dishes.filter(dish => dish.status === 'ACCEPTED');
  }, [dishes, isAdmin]);

  const filteredDishes = useMemo(() => {
    return availableDishes.filter((dish) => {
      // Фильтр по статусу только для админов
      if (isAdmin && statusFilter !== 'ALL' && dish.status !== statusFilter) {
        return false;
      }

      if (searchQuery && !dish.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      if (selectedIngredient !== null) {
        const hasIngredient = dish.ingredients.some(
          (di) => di.ingredientId === selectedIngredient
        );
        if (!hasIngredient) return false;
      }

      const stats = calculateDishStats(dish);
      if (maxGlycemicIndex !== '' && stats.glycemicIndex > Number(maxGlycemicIndex)) {
        return false;
      }
      if (maxCalories !== '' && stats.calories > Number(maxCalories)) {
        return false;
      }

      return true;
    });
  }, [availableDishes, isAdmin, searchQuery, selectedIngredient, maxGlycemicIndex, maxCalories, statusFilter]);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '1.5rem' }}>Список блюд</h1>

        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Фильтры</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label htmlFor="search">Поиск по названию</label>
              <input
                type="text"
                id="search"
                placeholder="Введите название блюда..."
                value={searchQuery}
                onChange={(e) => dispatch(setDishSearchQuery(e.target.value))}
              />
            </div>

            <div>
              <label htmlFor="ingredient">Фильтр по ингредиенту</label>
              <select
                id="ingredient"
                value={selectedIngredient || ''}
                onChange={(e) => dispatch(setDishSelectedIngredient(e.target.value ? Number(e.target.value) : null))}
              >
                <option value="">Все ингредиенты</option>
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="gi">Макс. гликемический индекс</label>
              <input
                type="number"
                id="gi"
                placeholder="Без ограничений"
                value={maxGlycemicIndex}
                onChange={(e) => dispatch(setDishMaxGlycemicIndex(e.target.value ? Number(e.target.value) : ''))}
                min="0"
              />
            </div>

            <div>
              <label htmlFor="calories">Макс. калории</label>
              <input
                type="number"
                id="calories"
                placeholder="Без ограничений"
                value={maxCalories}
                onChange={(e) => dispatch(setDishMaxCalories(e.target.value ? Number(e.target.value) : ''))}
                min="0"
              />
            </div>

            {isAdmin && (
              <div>
                <label htmlFor="status">Статус</label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => dispatch(setDishStatusFilter(e.target.value as typeof statusFilter))}
                >
                  <option value="ALL">Все</option>
                  <option value="ACCEPTED">Принятые</option>
                  <option value="PENDING">На рассмотрении</option>
                  <option value="REJECTED">Отклоненные</option>
                </select>
              </div>
            )}
          </div>

          <button
            className="btn-secondary"
            onClick={() => dispatch(resetDishFilters())}
          >
            Сбросить фильтры
          </button>
        </div>
      </div>

      {filteredDishes.length === 0 ? (
        <div className="empty-state">
          <p>Блюда не найдены</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {filteredDishes.map((dish) => {
            const stats = calculateDishStats(dish);
            const statusColors = {
              ACCEPTED: 'rgba(79, 180, 119, 0.85)',
              PENDING: 'rgba(93, 176, 215, 0.85)',
              REJECTED: 'rgba(229, 115, 115, 0.85)',
            };
            const StatusIconComponent = {
              ACCEPTED: AcceptedIcon,
              PENDING: PendingIcon,
              REJECTED: RejectedIcon,
            }[dish.status];

            return (
              <div 
                key={dish.id} 
                className="card" 
                style={{ 
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onClick={(e) => {
                  // Если клик был по иконке статуса, не открываем детали
                  const target = e.target as HTMLElement;
                  if (target.closest('[data-status-icon]')) {
                    return;
                  }
                  navigate(`/dishes/${dish.id}`);
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
                {isAdmin && (
                  <div 
                    data-status-icon
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                      backgroundColor: statusColors[dish.status],
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '32px',
                      height: '32px',
                      zIndex: 10,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    }}
                  >
                    <StatusIconComponent size={18} />
                  </div>
                )}

                {dish.imageUrl && (
                  <img
                    src={`http://localhost:3000${dish.imageUrl}`}
                    alt={dish.name}
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                    }}
                  />
                )}

                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>
                  {dish.name}
                </h3>

                {dish.description && (
                  <p style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>
                    {dish.description.length > 100
                      ? `${dish.description.substring(0, 100)}...`
                      : dish.description}
                  </p>
                )}

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                    <strong>Калории:</strong> {stats.calories} ккал
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                    <strong>ГИ:</strong> {stats.glycemicIndex}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>
                    <strong>ХЕ:</strong> {stats.totalBreadUnits}
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                    <strong>Ингредиенты:</strong>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>
                    {dish.ingredients.length > 0
                      ? dish.ingredients
                          .slice(0, 3)
                          .map((di) => `${di.ingredient.name} (${di.quantity} ${di.unit || di.ingredient.unit || 'г'})`)
                          .join(', ')
                      : 'Нет ингредиентов'}
                    {dish.ingredients.length > 3 && '...'}
                  </div>
                </div>

                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  Автор: {dish.author.username}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

