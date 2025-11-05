import { useLoaderData, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Dish } from '../utils/services/dish.service';

interface LoaderData {
  dishes: Dish[];
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

function calculateDishStats(dish: Dish) {
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

export default function MyDishes() {
  const { dishes } = useLoaderData() as LoaderData;
  const navigate = useNavigate();
  const { user } = useAuth();

  const statusColors = {
    ACCEPTED: 'rgba(79, 180, 119, 0.85)',
    PENDING: 'rgba(93, 176, 215, 0.85)',
    REJECTED: 'rgba(229, 115, 115, 0.85)',
  };

  const statusLabels = {
    ACCEPTED: 'Одобрено',
    PENDING: 'На рассмотрении',
    REJECTED: 'Отклонено',
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Мои блюда</h1>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          Здесь вы можете видеть все созданные вами блюда и их статусы модерации
        </p>
      </div>

      {dishes.length === 0 ? (
        <div className="empty-state">
          <p>Вы еще не создали ни одного блюда</p>
          <Link to="/dishes/new" className="btn-primary" style={{ marginTop: '1rem' }}>
            Создать первое блюдо
          </Link>
        </div>
      ) : (
        <div className="grid grid-3">
          {dishes.map((dish) => {
            const stats = calculateDishStats(dish);
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
                onClick={() => navigate(`/dishes/${dish.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <div style={{
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
                  gap: '0.25rem',
                  minWidth: '32px',
                  height: '32px',
                  zIndex: 10,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}>
                  <StatusIconComponent size={18} />
                </div>

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

                <div style={{ 
                  marginBottom: '1rem', 
                  padding: '0.75rem', 
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                }}>
                  <div style={{ marginBottom: '0.25rem', fontWeight: '500' }}>
                    Статус: {statusLabels[dish.status]}
                  </div>
                  {dish.status === 'PENDING' && (
                    <div style={{ color: '#666', fontSize: '0.8rem' }}>
                      Ваше блюдо находится на рассмотрении у администратора
                    </div>
                  )}
                  {dish.status === 'REJECTED' && (
                    <div style={{ color: '#666', fontSize: '0.8rem' }}>
                      Ваше блюдо было отклонено администратором
                    </div>
                  )}
                  {dish.status === 'ACCEPTED' && (
                    <div style={{ color: '#666', fontSize: '0.8rem' }}>
                      Ваше блюдо одобрено и доступно всем пользователям
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


