import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface DishFiltersState {
  searchQuery: string;
  selectedIngredient: number | null;
  maxGlycemicIndex: number | '';
  maxCalories: number | '';
  statusFilter: 'ALL' | 'PENDING' | 'REJECTED' | 'ACCEPTED';
}

interface AdminFiltersState {
  searchQuery: string;
  statusFilter: 'ALL' | 'PENDING' | 'REJECTED' | 'ACCEPTED';
}

interface FiltersState {
  dishes: DishFiltersState;
  admin: AdminFiltersState;
}

const initialState: FiltersState = {
  dishes: {
    searchQuery: '',
    selectedIngredient: null,
    maxGlycemicIndex: '',
    maxCalories: '',
    statusFilter: 'ALL',
  },
  admin: {
    searchQuery: '',
    statusFilter: 'ALL',
  },
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    // Действия для фильтров блюд
    setDishSearchQuery: (state, action: PayloadAction<string>) => {
      state.dishes.searchQuery = action.payload;
    },
    setDishSelectedIngredient: (state, action: PayloadAction<number | null>) => {
      state.dishes.selectedIngredient = action.payload;
    },
    setDishMaxGlycemicIndex: (state, action: PayloadAction<number | ''>) => {
      state.dishes.maxGlycemicIndex = action.payload;
    },
    setDishMaxCalories: (state, action: PayloadAction<number | ''>) => {
      state.dishes.maxCalories = action.payload;
    },
    setDishStatusFilter: (state, action: PayloadAction<'ALL' | 'PENDING' | 'REJECTED' | 'ACCEPTED'>) => {
      state.dishes.statusFilter = action.payload;
    },
    resetDishFilters: (state) => {
      state.dishes = initialState.dishes;
    },
    
    // Действия для фильтров админ-панели
    setAdminSearchQuery: (state, action: PayloadAction<string>) => {
      state.admin.searchQuery = action.payload;
    },
    setAdminStatusFilter: (state, action: PayloadAction<'ALL' | 'PENDING' | 'REJECTED' | 'ACCEPTED'>) => {
      state.admin.statusFilter = action.payload;
    },
    resetAdminFilters: (state) => {
      state.admin = initialState.admin;
    },
  },
});

export const {
  setDishSearchQuery,
  setDishSelectedIngredient,
  setDishMaxGlycemicIndex,
  setDishMaxCalories,
  setDishStatusFilter,
  resetDishFilters,
  setAdminSearchQuery,
  setAdminStatusFilter,
  resetAdminFilters,
} = filtersSlice.actions;

export default filtersSlice.reducer;

