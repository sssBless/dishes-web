import { useState } from 'react';
import { Form, Link, useLoaderData, useActionData, useNavigation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Dish } from '../utils/services/dish.service';
import type { Ingredient } from '../utils/services/ingredients.service';
import styles from './DishForm.module.css';
import { buildImageUrl } from '../config';

interface LoaderData {
  dish: Dish | null;
  ingredients: Ingredient[];
  isEdit: boolean;
}

export default function DishForm() {
  const { dish, ingredients, isEdit } = useLoaderData() as LoaderData;
  const actionData = useActionData() as { error?: string } | undefined;
  const navigation = useNavigation();
  const { user } = useAuth();
  const isSubmitting = navigation.state === 'submitting';

  const [selectedIngredients, setSelectedIngredients] = useState<Array<{
    ingredientId: number;
    quantity: number;
    unit: string;
  }>>(
    dish?.ingredients.map((di) => ({
      ingredientId: di.ingredientId,
      quantity: di.quantity,
      unit: di.unit || 'г',
    })) || [{ ingredientId: 0, quantity: 0, unit: 'г' }]
  );

  // Получить единицу измерения для ингредиента
  const getIngredientUnit = (ingredientId: number): string => {
    if (ingredientId === 0) return 'г';
    const ingredient = ingredients.find(ing => ing.id === ingredientId);
    return ingredient?.unit || 'г';
  };

  // Доступные единицы измерения
  const availableUnits = ['г', 'мл', 'шт', 'ст.л.', 'ч.л.', 'стакан'];

  const handleAddIngredient = () => {
    setSelectedIngredients([...selectedIngredients, { ingredientId: 0, quantity: 0, unit: 'г' }]);
  };

  const handleRemoveIngredient = (index: number) => {
    if (selectedIngredients.length > 1) {
      setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
    }
  };

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.backLink}>
        ← Назад к списку блюд
      </Link>

      <div className={`card ${styles.card}`}>
        <h1 className={styles.title}>
          {isEdit ? 'Редактировать блюдо' : 'Создать блюдо'}
        </h1>

        {actionData?.error && (
          <div className={styles.errorAlert}>{actionData.error}</div>
        )}

        <Form method="post" encType="multipart/form-data" replace className={styles.form}>
          <input type="hidden" name="authorId" value={user?.id || ''} />
          
          <div className={styles.formGroup}>
            <label htmlFor="name" className={`${styles.label} ${styles.labelRequired}`}>
              Название блюда
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className={styles.input}
              defaultValue={dish?.name || ''}
              required
              disabled={isSubmitting}
              maxLength={100}
              placeholder="Введите название блюда"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>
              Описание
            </label>
            <textarea
              id="description"
              name="description"
              className={`${styles.textarea} ${styles.textareaLarge}`}
              defaultValue={dish?.description || ''}
              disabled={isSubmitting}
              rows={4}
              maxLength={500}
              placeholder="Опишите блюдо..."
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="recipe" className={styles.label}>
              Рецепт
            </label>
            <textarea
              id="recipe"
              name="recipe"
              className={`${styles.textarea} ${styles.textareaLarge}`}
              defaultValue={dish?.recipe || ''}
              disabled={isSubmitting}
              rows={8}
              maxLength={2000}
              placeholder="Опишите пошаговый рецепт приготовления..."
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="cookingTime" className={styles.label}>
              Время приготовления (минуты)
            </label>
            <input
              type="number"
              id="cookingTime"
              name="cookingTime"
              className={styles.input}
              defaultValue={dish?.cookingTime || ''}
              min="1"
              disabled={isSubmitting}
              placeholder="Например: 30"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="image" className={styles.label}>
              Изображение
            </label>
            {isEdit && buildImageUrl(dish?.imageUrl) && (
              <div className={styles.imagePreview}>
                <span className={styles.imagePreviewLabel}>Текущее изображение:</span>
                <img
                  src={buildImageUrl(dish?.imageUrl) ?? undefined}
                  alt={dish?.name || ''}
                  className={styles.imagePreviewImg}
                />
              </div>
            )}
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              className={styles.fileInput}
              disabled={isSubmitting}
            />
            <div className={styles.helpText}>
              {isEdit ? 'Выберите новое изображение для замены' : 'Разрешены форматы: JPG, PNG, GIF, WebP. Максимальный размер: 5MB'}
            </div>
          </div>

          <div className={styles.formGroup}>
            <div className={styles.ingredientsHeader}>
              <label className={styles.ingredientsLabel}>Ингредиенты</label>
              <button
                type="button"
                onClick={handleAddIngredient}
                className={styles.addButton}
                disabled={isSubmitting}
              >
                + Добавить ингредиент
              </button>
            </div>

            {selectedIngredients.map((si, index) => (
              <div key={index} className={styles.ingredientRow}>
                <select
                  name={`ingredients[${index}].ingredientId`}
                  value={si.ingredientId}
                  onChange={(e) => {
                    const updated = [...selectedIngredients];
                    updated[index].ingredientId = Number(e.target.value);
                    // Автоматически устанавливаем единицу измерения из ингредиента
                    if (Number(e.target.value) > 0) {
                      updated[index].unit = getIngredientUnit(Number(e.target.value));
                    }
                    setSelectedIngredients(updated);
                  }}
                  disabled={isSubmitting}
                  className={styles.ingredientSelect}
                >
                  <option value="0">Выберите ингредиент...</option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} (ГИ: {ing.glycemicIndex})
                    </option>
                  ))}
                </select>
                <div className={styles.quantityGroup}>
                  <input
                    type="number"
                    name={`ingredients[${index}].quantity`}
                    placeholder="Количество"
                    value={si.quantity || ''}
                    onChange={(e) => {
                      const updated = [...selectedIngredients];
                      updated[index].quantity = Number(e.target.value) || 0;
                      setSelectedIngredients(updated);
                    }}
                    disabled={isSubmitting}
                    min="0"
                    step="0.1"
                    className={styles.quantityInput}
                  />
                  <select
                    name={`ingredients[${index}].unit`}
                    value={si.unit || 'г'}
                    onChange={(e) => {
                      const updated = [...selectedIngredients];
                      updated[index].unit = e.target.value;
                      setSelectedIngredients(updated);
                    }}
                    disabled={isSubmitting}
                    className={styles.unitSelect}
                  >
                    {availableUnits.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(index)}
                  className={styles.removeButton}
                  disabled={isSubmitting || selectedIngredients.length === 1}
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>

          <div className={styles.formActions}>
            <Link to="/" className={styles.cancelButton}>
              Отмена
            </Link>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? isEdit
                  ? 'Сохранение...'
                  : 'Создание...'
                : isEdit
                ? 'Сохранить'
                : 'Создать блюдо'}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
