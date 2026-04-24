// 기존 createBrowserRouter 대신 createHashRouter를 불러옵니다.
import { createHashRouter } from 'react-router';
import { Dashboard } from './pages/Dashboard';

export const router = createHashRouter([
  {
    path: '/',
    Component: Dashboard,
  },
  {
    path: '*',
    Component: Dashboard,
  },
]);