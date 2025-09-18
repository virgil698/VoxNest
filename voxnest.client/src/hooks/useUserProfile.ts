import { useState, useEffect } from 'react';
import { getUserProfile, getUserProfileById, type UserProfilePageDto } from '../api/userProfile';

interface UseUserProfileOptions {
  username?: string;
  userId?: number;
  autoFetch?: boolean;
}

interface UseUserProfileResult {
  data: UserProfilePageDto | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * 用户个人主页数据 Hook
 */
export const useUserProfile = (options: UseUserProfileOptions): UseUserProfileResult => {
  const { username, userId, autoFetch = true } = options;
  const [data, setData] = useState<UserProfilePageDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!username && !userId) {
      setError('用户名或用户ID必须提供其中一个');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let result: UserProfilePageDto;
      if (username) {
        result = await getUserProfile(username);
      } else if (userId) {
        result = await getUserProfileById(userId);
      } else {
        throw new Error('用户名或用户ID必须提供其中一个');
      }

      setData(result);
    } catch (err) {
      console.error('获取用户资料失败:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('获取用户资料失败');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch && (username || userId)) {
      fetchData();
    }
  }, [username, userId, autoFetch]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
};
