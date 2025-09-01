import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { AuthGuard } from '../components/auth/AuthGuard';

// 页面组件（懒加载）
import { lazy } from 'react';

const HomePage = lazy(() => import('../pages/Home'));
const LoginPage = lazy(() => import('../pages/auth/Login'));
const RegisterPage = lazy(() => import('../pages/auth/Register'));
const PostDetailPage = lazy(() => import('../pages/post/PostDetail'));
const CreatePostPage = lazy(() => import('../pages/post/CreatePost'));
const MyPostsPage = lazy(() => import('../pages/post/MyPosts'));
const ProfilePage = lazy(() => import('../pages/user/Profile'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      // 认证相关路由
      {
        path: 'auth',
        children: [
          {
            path: 'login',
            element: <LoginPage />,
          },
          {
            path: 'register',
            element: <RegisterPage />,
          },
        ],
      },
      // 帖子相关路由
      {
        path: 'posts',
        children: [
          {
            path: ':id',
            element: <PostDetailPage />,
          },
          {
            path: 'create',
            element: (
              <AuthGuard>
                <CreatePostPage />
              </AuthGuard>
            ),
          },
        ],
      },
      // 用户相关路由
      {
        path: 'user',
        element: <AuthGuard />,
        children: [
          {
            path: 'posts',
            element: <MyPostsPage />,
          },
          {
            path: 'profile',
            element: <ProfilePage />,
          },
        ],
      },
      // 重定向和404
      {
        path: '404',
        element: <div>页面未找到</div>,
      },
      {
        path: '*',
        element: <Navigate to="/404" replace />,
      },
    ],
  },
]);
