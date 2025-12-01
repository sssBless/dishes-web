import { useState } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import type { Dish } from '../utils/services/dish.service';
import {apiService} from '../utils/services/api.service';

const HeartIcon = ({ filled = false, size = 16 }: { filled?: boolean; size?: number }) => (
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

interface LoaderData {
  favorites: Dish[];
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
    
    if (quantityInGrams <= 0) return;
    
    totalWeight += quantityInGrams;
    
    if (unit === 'шт' && (ingredient as any).caloriesPerPiece != null) {
      calories += (ingredient as any).caloriesPerPiece * di.quantity;
    } else if (ingredient.caloriesPer100g && ingredient.caloriesPer100g > 0) {
      calories += (ingredient.caloriesPer100g * quantityInGrams) / 100;
    }
    
    totalGi += ingredient.glycemicIndex * quantityInGrams;
    totalBreadUnits += ingredient.breadUnitsIn1g * quantityInGrams;
  });

  const avgGlycemicIndex = totalWeight > 0 ? totalGi / totalWeight : 0;

  return {
    calories: Math.round(calories),
    glycemicIndex: Math.round(avgGlycemicIndex),
    totalBreadUnits: Math.round(totalBreadUnits * 100) / 100,
  };
}

export default function Favorites() {
  const { favorites: initialFavorites } = useLoaderData() as LoaderData;
  const [favorites, setFavorites] = useState<Dish[]>(initialFavorites);
  const navigate = useNavigate();

  const handleRemoveFavorite = async (dishId: number) => {
    try {
      await apiService.dishService.removeFromFavorites(dishId);
      setFavorites(favorites.filter(dish => dish.id !== dishId));
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
      alert('Не удалось удалить блюдо из избранного');
    }
  };

  if (favorites.length === 0) {
    return (
      <div>
        <h1 style={{ marginBottom: '1.5rem' }}>Избранные блюда</h1>
        <div className="empty-state">
          <p>У вас пока нет избранных блюд</p>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/')}
            style={{ marginTop: '1rem' }}
          >
            Перейти к списку блюд
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Избранные блюда</h1>
      
      <div className="grid grid-3">
        {favorites.map((dish) => {
          const stats = calculateDishStats(dish);

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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFavorite(dish.id);
                }}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-coral)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  padding: 0,
                }}
                title="Удалить из избранного"
              >
                <HeartIcon filled={true} size={16} />
              </button>

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

              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                Автор: {dish.author.username}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

