import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Layout from './components/Layout';
import AuthInitializer from './components/AuthInitializer';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './components/Login';
import Register from './components/Register';
import DishList from './pages/DishList';
import DishDetail from './pages/DishDetail';
import DishForm from './pages/DishForm';
import AdminPanel from './pages/AdminPanel';
import MyDishes from './pages/MyDishes';
import {
  dishesLoader,
  dishLoader,
  dishFormLoader,
  adminLoader,
  myDishesLoader,
} from './utils/loaders';
import {
  loginAction,
  registerAction,
  createDishAction,
  updateDishAction,
  deleteDishAction,
  changeDishStatusAction,
  changeUserRoleAction,
  updateDishForOwnerAction,
} from './utils/actions';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
    action: loginAction,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/register',
    element: <Register />,
    action: registerAction,
    errorElement: <ErrorBoundary />,
  },
  {
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: '/',
        element: (
          <ProtectedRoute>
            <DishList />
          </ProtectedRoute>
        ),
        loader: dishesLoader,
      },
      {
        path: '/dishes/new',
        element: (
          <ProtectedRoute>
            <DishForm />
          </ProtectedRoute>
        ),
        loader: dishFormLoader,
        action: createDishAction,
      },
      {
        path: '/dishes/:id',
        element: (
          <ProtectedRoute>
            <DishDetail />
          </ProtectedRoute>
        ),
        loader: dishLoader,
        action: deleteDishAction,
      },
      {
        path: '/dishes/:id/update',
        action: updateDishForOwnerAction,
      },
      {
        path: '/dishes/:id/edit',
        element: (
          <ProtectedRoute>
            <DishForm />
          </ProtectedRoute>
        ),
        loader: dishFormLoader,
        action: updateDishAction,
      },
      {
        path: '/my-dishes',
        element: (
          <ProtectedRoute>
            <MyDishes />
          </ProtectedRoute>
        ),
        loader: myDishesLoader,
      },
      {
        path: '/admin',
        element: (
          <ProtectedRoute requireAdmin>
            <AdminPanel />
          </ProtectedRoute>
        ),
        loader: adminLoader,
      },
      {
        path: '/admin/dishes/:id/status',
        action: changeDishStatusAction,
      },
      {
        path: '/admin/users/:id/role',
        action: changeUserRoleAction,
      },
      {
        path: '*',
        element: (
          <ProtectedRoute>
            <DishList />
          </ProtectedRoute>
        ),
        loader: dishesLoader,
      },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <AuthInitializer />
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>
);
