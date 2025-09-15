import { createBrowserRouter, Navigate } from 'react-router-dom';
import { EnhancedLayout } from '../components/layout/EnhancedLayout';
import { AuthGuard } from '../components/auth/AuthGuard';
import AdminLayout from '../components/admin/AdminLayout';

// 页面组件（懒加载）
import { lazy } from 'react';

const HomePage = lazy(() => import('../pages/Home'));
const LoginPage = lazy(() => import('../pages/auth/Login'));
const RegisterPage = lazy(() => import('../pages/auth/Register'));
const PostDetailPage = lazy(() => import('../pages/post/PostDetail'));
const CreatePostPage = lazy(() => import('../pages/post/CreatePost'));
const MyPostsPage = lazy(() => import('../pages/post/MyPosts'));
const ProfilePage = lazy(() => import('../pages/user/Profile'));
const InstallPage = lazy(() => import('../pages/Install'));

// Admin 页面（懒加载）
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
const AdminSiteSettings = lazy(() => import('../pages/admin/SiteSettings'));
const AdminLogManagement = lazy(() => import('../pages/admin/LogManagement'));
const AdminExtensionManagement = lazy(() => import('../pages/admin/ExtensionManagement'));
const AdminExtensionSettings = lazy(() => import('../pages/admin/ExtensionSettings'));

export const router = createBrowserRouter([
  // 安装页面（不需要Layout）
  {
    path: '/install',
    element: <InstallPage />,
  },
  // Admin 管理面板
  {
    path: '/admin',
    element: (
      <AuthGuard>
        <AdminLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <AdminDashboard />,
      },
      {
        path: 'settings',
        element: <AdminSiteSettings />,
      },
      {
        path: 'logs',
        element: <AdminLogManagement />,
      },
      // 其他管理页面将在后续添加
      {
        path: 'users',
        element: <div>用户管理页面 - 开发中</div>,
      },
      {
        path: 'posts',
        element: <div>帖子管理页面 - 开发中</div>,
      },
      {
        path: 'tags',
        element: <div>标签管理页面 - 开发中</div>,
      },
      {
        path: 'extensions',
        element: <AdminExtensionManagement />,
      },
      {
        path: 'extension-settings',
        element: <AdminExtensionSettings />,
      },
    ],
  },
  {
    path: '/',
    element: <EnhancedLayout />,
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
