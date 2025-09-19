import axios from 'axios';
import type { AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { getApiBaseUrl, getAppConfig } from '../config/index';

// 错误响应接口
export interface ErrorResponse {
  errorCode: string;
  message: string;
  details?: string;
  traceId?: string;
  timestamp: string;
  path?: string;
  method?: string;
  success: boolean;
}

// HTTP错误对象接口
interface HttpErrorObject {
  response?: {
    data?: ErrorResponse;
    status?: number;
    statusText?: string;
  };
  request?: unknown;
  message?: string;
  status?: number;
  statusText?: string;
}

// API基础配置 - 从配置函数获取
const API_BASE_URL = getApiBaseUrl();

// 创建axios实例
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: getAppConfig().api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
  // 添加请求内容验证
  validateStatus: (status) => {
    // 接受200-399的状态码，以及499（客户端关闭请求）
    return (status >= 200 && status < 400) || status === 499;
  },
});

// 请求拦截器 - 添加认证令牌和请求追踪
apiClient.interceptors.request.use(
  (config) => {
    const appConfig = getAppConfig();
    
    // 添加请求追踪ID
    config.headers['X-Request-Id'] = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const token = localStorage.getItem(appConfig.storage.tokenKey);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 记录请求开始（根据配置决定是否记录）
    if (appConfig.features.enableLogging && appConfig.features.logLevel === 'debug') {
      console.log(`🔄 API请求: ${config.method?.toUpperCase()} ${config.url}`, {
        requestId: config.headers['X-Request-Id'],
        data: config.data,
        timestamp: new Date().toISOString()
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ 请求配置失败:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理通用错误和详细日志
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const appConfig = getAppConfig();
    
    // 记录成功响应（根据配置决定是否记录）
    if (appConfig.features.enableLogging && appConfig.features.logLevel === 'debug') {
      console.log(`✅ API响应成功: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        requestId: response.config.headers['X-Request-Id'],
        traceId: response.data?.traceId,
        timestamp: new Date().toISOString()
      });
    }
    
    return response;
  },
  (error: AxiosError<ErrorResponse>) => {
    const errorResponse = error.response?.data;
    const requestId = error.config?.headers?.['X-Request-Id'];
    
    // 详细记录错误信息
    console.error(`❌ API请求失败: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      requestId,
      errorCode: errorResponse?.errorCode,
      message: errorResponse?.message,
      details: errorResponse?.details,
      traceId: errorResponse?.traceId,
      timestamp: new Date().toISOString(),
      fullError: error
    });

    if (error.response?.status === 401) {
      // 检查是否是登录接口的401错误
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      
      if (!isLoginRequest) {
        // 非登录接口的401错误，说明token过期或无效
        const appConfig = getAppConfig();
        localStorage.removeItem(appConfig.storage.tokenKey);
        localStorage.removeItem(appConfig.storage.userKey);
        message.error('认证失效，请重新登录');
        window.location.href = '/auth/login';
        return Promise.reject(error);
      }
      // 登录接口的401错误，不跳转，让组件处理
    }

    // 增强错误对象，包含后端返回的详细信息
    const enhancedError = {
      ...error,
      errorCode: errorResponse?.errorCode || 'NETWORK_ERROR',
      message: errorResponse?.message || error.message || '网络请求失败',
      details: errorResponse?.details,
      traceId: errorResponse?.traceId,
      timestamp: errorResponse?.timestamp || new Date().toISOString(),
      path: errorResponse?.path,
      method: errorResponse?.method,
      requestId,
      originalError: error
    };

    return Promise.reject(enhancedError);
  }
);

// API响应类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  errorCode?: string;
  details?: string;
  traceId?: string;
  timestamp?: string;
  path?: string;
  method?: string;
}

export interface PaginatedApiResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

// 错误处理工具函数
export const handleApiError = (error: unknown, customMessage?: string) => {
  const errorObj = error as HttpErrorObject; // Type assertion for error object
  const responseData = errorObj?.response?.data;
  const errorInfo = {
    title: customMessage || '操作失败',
    message: responseData?.message || errorObj?.message || '未知错误',
    errorCode: responseData?.errorCode || 'UNKNOWN_ERROR',
    details: responseData?.details,
    traceId: responseData?.traceId,
    requestId: responseData?.traceId, // 使用traceId作为requestId
    timestamp: responseData?.timestamp || new Date().toISOString()
  };

  // 构建错误消息内容
  let errorContent = `❌ ${errorInfo.title}\n${errorInfo.message}`;
  
  if (errorInfo.details && errorInfo.details !== errorInfo.message) {
    errorContent += `\n📋 详细信息: ${errorInfo.details}`;
  }
  
  if (errorInfo.traceId) {
    errorContent += `\n🔍 追踪ID: ${errorInfo.traceId}`;
  }
  
  if (errorInfo.errorCode && errorInfo.errorCode !== 'UNKNOWN_ERROR') {
    errorContent += `\n📝 错误代码: ${errorInfo.errorCode}`;
  }
  
  errorContent += `\n⏰ ${new Date(errorInfo.timestamp).toLocaleString()}`;

  // 显示用户友好的错误消息
  message.error({
    content: errorContent,
    duration: 10
  });

  // 返回错误信息供进一步处理
  return errorInfo;
};

// 通用API请求方法
export const api = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> =>
    apiClient.get(url, config),
  
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> =>
    apiClient.post(url, data, config),
  
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> =>
    apiClient.put(url, data, config),
  
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> =>
    apiClient.delete(url, config),
  
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> =>
    apiClient.patch(url, data, config),
};
