/**
 * 统一扩展管理页面 - 管理插件和主题
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  message,
  Tooltip,
  Row,
  Col,
  Drawer,
  Typography,
  Tabs,
  Avatar,
  Empty,
  List,
  Descriptions,
  Modal
} from 'antd';
import {
  EyeOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  BgColorsOutlined,
  DeleteOutlined,
  CloudUploadOutlined,
  StopOutlined,
  PlayCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/lib/table';
import { type UnifiedExtension, type UnifiedExtensionQuery, type ExtensionInstallResult } from '../../api/unifiedExtension';
import { fileSystemExtensionApi, fileSystemExtensionUtils } from '../../api/fileSystemExtension';
import ExtensionUploader from '../../components/admin/ExtensionUploader';
import { getFramework } from '../../extensions';
import { publicExtensionLoader } from '../../extensions/manager/PublicExtensionLoader';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// 使用统一扩展接口
type Extension = UnifiedExtension;


const ExtensionManagement: React.FC = () => {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [filteredExtensions, setFilteredExtensions] = useState<Extension[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedExtension, setSelectedExtension] = useState<Extension | null>(null);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  // 跟踪正在进行的操作
  const [operatingExtensions, setOperatingExtensions] = useState<Set<string>>(new Set());
  // 跟踪扩展切换加载状态
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  // extensions.json 文件监听
  const [extensionsJsonLastModified, setExtensionsJsonLastModified] = useState<number>(0);

  // 读取前端扩展配置文件
  const loadFrontendExtensionsConfig = useCallback(async () => {
    try {
      const response = await fetch('/extensions/extensions.json?t=' + Date.now());
      if (!response.ok) {
        throw new Error(`Failed to fetch extensions.json: ${response.statusText}`);
      }
      
      // 记录文件修改时间
      const lastModified = response.headers.get('last-modified');
      if (lastModified) {
        setExtensionsJsonLastModified(new Date(lastModified).getTime());
      }
      
      const data = await response.json();
      return data.extensions || [];
    } catch (error) {
      console.error('读取前端扩展配置失败:', error);
      return [];
    }
  }, []);

  // 独立的重新加载函数（避免循环依赖）
  const reloadExtensionsQuietly = useCallback(async () => {
    try {
      // 构建查询参数
      const query: UnifiedExtensionQuery = {
        search: searchText || undefined,
        type: typeFilter === 'all' ? undefined : (typeFilter as 'plugin' | 'theme'),
        status: statusFilter === 'all' ? undefined : (statusFilter as 'active' | 'inactive' | 'error'),
        page: 1,
        pageSize: 1000
      };

      // 获取后端扩展列表
      const extensionResult = await fileSystemExtensionApi.getExtensions(query);
      
      // 获取前端扩展配置
      const frontendExtensions = await loadFrontendExtensionsConfig();
      
      if (extensionResult.isSuccess) {
        const backendExtensions = extensionResult.data;
        
        // 合并和修正扩展数据，优先使用前端配置的状态
        const mergedExtensions = backendExtensions.map(ext => {
          const frontendExt = frontendExtensions.find((fe: any) => fe.id === ext.uniqueId || fe.id === ext.id);
          
          if (frontendExt) {
            // 前端扩展，使用前端配置的状态
            return {
              ...ext,
              status: (frontendExt.enabled ? 'active' : 'inactive') as 'active' | 'inactive' | 'error' | 'loading',
              id: frontendExt.id,
              uniqueId: frontendExt.id
            };
          }
          
          // 后端扩展，保持原状态
          return ext;
        });
        
        setExtensions(mergedExtensions);
        
        console.log('🔄 扩展状态同步完成 (静默更新):', {
          frontend: frontendExtensions.map((fe: any) => ({ id: fe.id, enabled: fe.enabled })),
          merged: mergedExtensions.map(me => ({ id: me.id, status: me.status }))
        });
      }
    } catch (error) {
      console.debug('静默重新加载扩展失败:', error);
    }
  }, [searchText, typeFilter, statusFilter, loadFrontendExtensionsConfig]);

  // 检查 extensions.json 文件是否有更新
  const checkExtensionsJsonUpdates = useCallback(async () => {
    try {
      const response = await fetch('/extensions/extensions.json', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        const lastModified = response.headers.get('last-modified');
        const modifiedTime = lastModified ? new Date(lastModified).getTime() : Date.now();
        
        if (extensionsJsonLastModified > 0 && modifiedTime > extensionsJsonLastModified) {
          console.log('🔄 检测到 extensions.json 文件更新，重新加载扩展列表...');
          await reloadExtensionsQuietly();
        }
        
        setExtensionsJsonLastModified(modifiedTime);
      }
    } catch (error) {
      // 静默处理错误，避免干扰用户体验
      console.debug('检查 extensions.json 更新失败:', error);
    }
  }, [extensionsJsonLastModified, reloadExtensionsQuietly]);

  // 测试扩展框架状态的辅助函数
  const debugExtensionFrameworkState = useCallback((extensionId: string, action: string) => {
    try {
      const framework = getFramework();
      const integrations = framework.integrations.getAll();
      const slots = framework.slots.getAllSlots();
      const loadedExtensions = publicExtensionLoader.getLoadedExtensions();
      
      console.log(`🐛 [${action}] 扩展框架状态调试 (${extensionId}):`, {
        timestamp: new Date().toISOString(),
        extensionId,
        action,
        framework: {
          status: framework.status,
          integrationsCount: integrations.length,
          integrationNames: integrations.map((i: any) => i.name),
          slotsCount: Object.keys(slots).length,
          slotNames: Object.keys(slots),
          totalComponents: Object.values(slots).flat().length
        },
        loader: {
          hasExtension: loadedExtensions.has(extensionId),
          extensionEnabled: loadedExtensions.get(extensionId)?.manifest?.enabled,
          extensionError: loadedExtensions.get(extensionId)?.error,
          totalLoaded: loadedExtensions.size
        }
      });
    } catch (error) {
      console.error(`❌ 调试扩展框架状态失败:`, error);
    }
  }, []);

  // 加载扩展列表（整合前端和后端数据）
  const loadExtensions = useCallback(async () => {
    setLoading(true);
    try {
      // 构建查询参数
      const query: UnifiedExtensionQuery = {
        search: searchText || undefined,
        type: typeFilter === 'all' ? undefined : (typeFilter as 'plugin' | 'theme'),
        status: statusFilter === 'all' ? undefined : (statusFilter as 'active' | 'inactive' | 'error'),
        page: 1,
        pageSize: 1000 // 获取所有数据用于前端筛选和统计
      };

      // 获取后端扩展列表
      const extensionResult = await fileSystemExtensionApi.getExtensions(query);
      
      // 获取前端扩展配置
      const frontendExtensions = await loadFrontendExtensionsConfig();
      
      if (extensionResult.isSuccess) {
        const backendExtensions = extensionResult.data;
        
        // 合并和修正扩展数据，优先使用前端配置的状态
        const mergedExtensions = backendExtensions.map(ext => {
          const frontendExt = frontendExtensions.find((fe: any) => fe.id === ext.uniqueId || fe.id === ext.id);
          
          if (frontendExt) {
            // 前端扩展，使用前端配置的状态
            return {
              ...ext,
              status: (frontendExt.enabled ? 'active' : 'inactive') as 'active' | 'inactive' | 'error' | 'loading',
              id: frontendExt.id,
              uniqueId: frontendExt.id
            };
          }
          
          // 后端扩展，保持原状态
          return ext;
        });
        
        console.log('🔄 扩展状态同步完成:', {
          frontend: frontendExtensions.map((fe: any) => ({ id: fe.id, enabled: fe.enabled })),
          merged: mergedExtensions.map(me => ({ id: me.id, status: me.status }))
        });
        
        setExtensions(mergedExtensions);
      } else {
        message.error('加载扩展失败');
        setExtensions([]);
      }

      
    } catch (error) {
      console.error('加载扩展失败:', error);
      message.error('加载扩展失败');
      setExtensions([]);
    } finally {
      setLoading(false);
    }
  }, [searchText, typeFilter, statusFilter, loadFrontendExtensionsConfig]);

  // 筛选扩展
  const filterExtensions = useCallback(() => {
    let filtered = [...extensions];

    // 按标签页筛选
    if (activeTab !== 'all') {
      if (activeTab === 'frontend-plugins') {
        // 目前所有插件都是前端插件
        filtered = filtered.filter(ext => ext.type === 'plugin');
      } else if (activeTab === 'backend-plugins') {
        // 暂时没有后端插件，返回空数组
        filtered = [];
      } else if (activeTab === 'themes') {
        filtered = filtered.filter(ext => ext.type === 'theme');
      }
    }

    // 按搜索文本筛选
    if (searchText) {
      filtered = filtered.filter(ext => 
        ext.name.toLowerCase().includes(searchText.toLowerCase()) ||
        ext.description?.toLowerCase().includes(searchText.toLowerCase()) ||
        ext.author.toLowerCase().includes(searchText.toLowerCase()) ||
        fileSystemExtensionUtils.parseTags(ext.tags || '[]').some((tag: string) => tag.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    // 按状态筛选
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ext => ext.status === statusFilter);
    }

    // 按类型筛选
    if (typeFilter !== 'all') {
      filtered = filtered.filter(ext => ext.type === typeFilter);
    }

    setFilteredExtensions(filtered);
  }, [extensions, searchText, statusFilter, typeFilter, activeTab]);

  // 初始化加载扩展列表并启动监听（避免频繁重载）
  useEffect(() => {
    // 只在扩展列表为空时加载
    if (extensions.length === 0) {
      loadExtensions();
    }

    // 设置定时器，每5秒检查一次 extensions.json 文件更新
    const interval = setInterval(() => {
      checkExtensionsJsonUpdates();
    }, 5000);

    // 组件卸载时清理定时器
    return () => {
      clearInterval(interval);
    };
  }, [checkExtensionsJsonUpdates]); // 添加 checkExtensionsJsonUpdates 依赖

  // 筛选扩展
  useEffect(() => {
    filterExtensions();
  }, [extensions, searchText, statusFilter, typeFilter, activeTab, filterExtensions]);

  // 检查是否为前端扩展
  const isFrontendExtension = useCallback((extensionId: string): boolean => {
    try {
      // 前端扩展存储在 voxnest.client/extensions 目录
      const knownFrontendExtensions = ['cookie-consent', 'dark-mode-theme'];
      return knownFrontendExtensions.includes(extensionId);
    } catch (error) {
      console.warn('检查前端扩展失败:', error);
      return false;
    }
  }, []);

  // 调用统一的扩展切换API
  const callExtensionToggleAPI = useCallback(async (extensionId: string, enabled: boolean): Promise<void> => {
    const response = await fetch(`/api/extension/${extensionId}/toggle`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enabled }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API调用失败: ${response.statusText}`);
    }
  }, []);

  // 禁用前端扩展的框架集成
  const disableFrontendExtension = useCallback(async (extensionId: string, framework: any): Promise<void> => {
    try {
      console.log(`🔄 开始禁用前端扩展: ${extensionId}`);
      
      // 1. 检查当前框架状态
      const currentIntegrations = framework.integrations.getAll();
      const targetIntegration = currentIntegrations.find((integration: any) => 
        integration.name === extensionId || integration.name.includes(extensionId)
      );
      
      console.log(`📋 扩展禁用前状态检查:`, {
        extensionId,
        hasIntegration: !!targetIntegration,
        integrationName: targetIntegration?.name,
        totalIntegrations: currentIntegrations.length
      });

      // 2. 从扩展框架中注销集成（尝试多种可能的名称）
      let integrationUnregistered = false;
      if (framework.integrations) {
        // 尝试直接使用扩展ID注销
        let success = framework.integrations.unregister(extensionId);
        if (success) {
          console.log(`✅ 已从框架中注销集成 (ID): ${extensionId}`);
          integrationUnregistered = true;
        }
        
        // 如果没有成功，尝试使用完整的集成名称
        if (!success && targetIntegration) {
          success = framework.integrations.unregister(targetIntegration.name);
          if (success) {
            console.log(`✅ 已从框架中注销集成 (Name): ${targetIntegration.name}`);
            integrationUnregistered = true;
          }
        }
      }

      // 3. 从槽位中移除相关组件
      let componentsRemoved = false;
      if (framework.slots && framework.slots.unregisterBySource) {
        const slotsBefore = framework.slots.getAllSlots();
        const componentCountBefore = Object.values(slotsBefore).flat().length;
        
        framework.slots.unregisterBySource(extensionId);
        
        const slotsAfter = framework.slots.getAllSlots();
        const componentCountAfter = Object.values(slotsAfter).flat().length;
        
        if (componentCountBefore > componentCountAfter) {
          console.log(`✅ 已从槽位中移除组件: ${extensionId} (移除 ${componentCountBefore - componentCountAfter} 个组件)`);
          componentsRemoved = true;
        } else {
          console.log(`ℹ️  没有找到需要移除的组件: ${extensionId}`);
        }
      }

      // 4. 更新扩展加载器中的状态
      const loadedExtensions = publicExtensionLoader.getLoadedExtensions();
      const loadedExt = loadedExtensions.get(extensionId);
      if (loadedExt) {
        loadedExt.manifest.enabled = false;
        console.log(`✅ 已更新扩展状态为禁用: ${extensionId}`);
      } else {
        console.log(`ℹ️  扩展未在加载器中找到: ${extensionId}`);
      }

      // 5. 验证禁用结果
      const integrationsAfter = framework.integrations.getAll();
      const stillHasIntegration = integrationsAfter.some((integration: any) => 
        integration.name === extensionId || integration.name.includes(extensionId)
      );
      
      console.log(`🔍 验证扩展禁用结果:`, {
        extensionId,
        integrationUnregistered,
        componentsRemoved,
        stillHasIntegration,
        totalIntegrationsAfter: integrationsAfter.length
      });

      if (stillHasIntegration) {
        console.warn(`⚠️  扩展集成可能未完全注销: ${extensionId}`);
      }

      console.log(`🛑 前端扩展禁用完成: ${extensionId}`);
    } catch (error) {
      console.error(`❌ 禁用前端扩展失败: ${extensionId}`, error);
      throw error;
    }
  }, []);

  // 启用前端扩展的框架集成
  const enableFrontendExtension = useCallback(async (extensionId: string, framework: any): Promise<void> => {
    try {
      console.log(`🔄 开始启用前端扩展: ${extensionId}`);
      
      // 1. 检查扩展是否已加载
      const loadedExtensions = publicExtensionLoader.getLoadedExtensions();
      let loadedExt = loadedExtensions.get(extensionId);

      console.log(`📋 扩展加载状态检查:`, {
        extensionId,
        isLoaded: !!loadedExt,
        hasError: loadedExt?.error,
        manifestEnabled: loadedExt?.manifest?.enabled
      });

      if (!loadedExt || loadedExt.error) {
        // 如果未加载或加载失败，重新发现并加载扩展
        console.log(`🔍 重新发现和加载扩展: ${extensionId}`);
        const availableExtensions = await publicExtensionLoader.discoverExtensions();
        const manifest = availableExtensions.find(ext => ext.id === extensionId);
        
        if (!manifest) {
          throw new Error(`未找到扩展清单: ${extensionId}`);
        }

        console.log(`📄 找到扩展清单:`, {
          id: manifest.id,
          name: manifest.name,
          enabled: manifest.enabled,
          main: manifest.main
        });

        // 强制启用并加载
        manifest.enabled = true;
        loadedExt = await publicExtensionLoader.loadExtension(manifest);
        console.log(`📦 重新加载扩展完成: ${extensionId}`, {
          hasModule: !!loadedExt.module,
          hasError: !!loadedExt.error,
          initialized: loadedExt.initialized
        });
      } else {
        // 如果已加载，确保状态为启用
        loadedExt.manifest.enabled = true;
        console.log(`✅ 更新已加载扩展状态为启用: ${extensionId}`);
      }

      if (loadedExt.error) {
        throw new Error(`扩展加载失败: ${loadedExt.error}`);
      }

      // 2. 重新初始化扩展到框架
      if (loadedExt.module?.default) {
        const extensionModule = loadedExt.module.default;
        console.log(`🔧 准备注册扩展模块:`, {
          moduleType: typeof extensionModule,
          hasName: extensionModule && typeof extensionModule === 'object' && 'name' in extensionModule,
          hasHooks: extensionModule && typeof extensionModule === 'object' && 'hooks' in extensionModule,
          hasRegister: extensionModule && typeof extensionModule === 'object' && 'register' in extensionModule
        });

        if (typeof extensionModule === 'object' && extensionModule !== null) {
          if ('name' in extensionModule && 'hooks' in extensionModule) {
            // 集成对象，直接注册
            framework.register(extensionModule);
            console.log(`✅ 已注册集成对象: ${(extensionModule as any).name}`);
          } else if ('register' in extensionModule && typeof (extensionModule as any).register === 'function') {
            // 有注册函数，调用注册
            await (extensionModule as any).register(framework);
            console.log(`✅ 已执行扩展注册函数: ${extensionId}`);
          }
        } else if (typeof extensionModule === 'function') {
          // 直接是组件函数
          framework.slots.register('plugin.components', {
            component: extensionModule,
            source: extensionId,
            name: loadedExt.manifest.name,
            priority: 0
          });
          console.log(`✅ 已注册组件到默认槽位: ${extensionId}`);
        }
      } else {
        console.warn(`⚠️  扩展模块为空或无默认导出: ${extensionId}`);
      }

      // 3. 验证注册结果
      const registeredIntegrations = framework.integrations.getAll();
      const hasIntegration = registeredIntegrations.some((integration: any) => 
        integration.name === extensionId || integration.name.includes(extensionId)
      );
      
      console.log(`🔍 验证扩展注册结果:`, {
        extensionId,
        hasIntegration,
        totalIntegrations: registeredIntegrations.length,
        integrationNames: registeredIntegrations.map((i: any) => i.name)
      });

      console.log(`🟢 前端扩展启用完成: ${extensionId}`);
    } catch (error) {
      console.error(`❌ 启用前端扩展失败: ${extensionId}`, error);
      throw error;
    }
  }, []);

  // 启用/禁用扩展（支持前端扩展，确保状态同步）
  const handleToggleExtension = useCallback(async (extension: Extension) => {
    try {
      const isCurrentlyActive = extension.status === 'active';
      const newEnabled = !isCurrentlyActive;
      const action = newEnabled ? '启用' : '禁用';
      
      console.log(`🔄 开始${action}扩展: ${extension.uniqueId} (当前状态: ${extension.status})`);
      
      // 调试：记录操作前的状态
      debugExtensionFrameworkState(extension.uniqueId, `${action}前`);
      
      // 设置加载状态
      setToggleLoading(extension.uniqueId);
      setOperatingExtensions(prev => new Set(prev).add(extension.uniqueId));
      
      // 立即更新本地状态为 loading
      setExtensions(prevExtensions => 
        prevExtensions.map(ext => 
          ext.uniqueId === extension.uniqueId 
            ? { ...ext, status: 'loading' }
            : ext
        )
      );

      // 检查是否为前端扩展
      if (isFrontendExtension(extension.uniqueId)) {
        console.log(`🎯 处理前端扩展: ${extension.uniqueId}`);
        
        // Step 1: 调用后端API更新配置文件（这会更新 extensions.json）
        console.log(`📝 Step 1: 更新配置文件 (${action})`);
        await callExtensionToggleAPI(extension.uniqueId, newEnabled);
        
        // Step 2: 等待一小段时间让配置文件写入完成
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Step 3: 获取更新后的框架实例并处理框架集成
        console.log(`🔧 Step 3: 处理框架集成 (${action})`);
        const framework = getFramework();
        
        if (newEnabled) {
          // 启用前端扩展的框架集成
          console.log(`🟢 启用前端扩展框架集成: ${extension.uniqueId}`);
          await enableFrontendExtension(extension.uniqueId, framework);
        } else {
          // 禁用前端扩展的框架集成
          console.log(`🔴 禁用前端扩展框架集成: ${extension.uniqueId}`);
          await disableFrontendExtension(extension.uniqueId, framework);
        }
        
        // 调试：记录操作后的状态
        debugExtensionFrameworkState(extension.uniqueId, `${action}后`);
        
      } else {
        // 后端扩展使用原有的API
        console.log(`🎯 处理后端扩展: ${extension.uniqueId}`);
        const result = isCurrentlyActive 
          ? await fileSystemExtensionApi.disableExtension(extension.uniqueId)
          : await fileSystemExtensionApi.enableExtension(extension.uniqueId);
        
        if (!result.isSuccess) {
          throw new Error(result.message || '操作失败');
        }
      }
      
      // Step 4: 重新加载扩展列表，确保状态同步
      console.log(`🔄 Step 4: 重新加载扩展列表以同步状态...`);
      await loadExtensions();
      
      message.success(`✅ 扩展 ${extension.name} ${action}成功`);
      console.log(`🎉 扩展${action}操作完成: ${extension.uniqueId}`);
      
    } catch (error) {
      const action = extension.status === 'active' ? '禁用' : '启用';
      console.error(`❌ ${action} extension failed:`, error);
      message.error(`扩展 ${extension.name} ${action}失败: ${error instanceof Error ? error.message : '未知错误'}`);
      
      // 如果失败，重新加载以恢复正确状态
      console.log(`🔄 操作失败，重新加载扩展列表...`);
      await loadExtensions();
    } finally {
      setToggleLoading(null);
      setOperatingExtensions(prev => {
        const newSet = new Set(prev);
        newSet.delete(extension.uniqueId);
        return newSet;
      });
    }
  }, [loadExtensions, isFrontendExtension, callExtensionToggleAPI, disableFrontendExtension, enableFrontendExtension, debugExtensionFrameworkState]);


  // 重新加载扩展
  const handleReloadExtension = useCallback(async (extension: Extension) => {
    try {
      // 添加到操作中列表
      setOperatingExtensions(prev => new Set(prev).add(extension.uniqueId));
      
      // 立即更新本地状态为 loading，提供即时视觉反馈
      setExtensions(prevExtensions => 
        prevExtensions.map(ext => 
          ext.uniqueId === extension.uniqueId 
            ? { ...ext, status: 'loading' }
            : ext
        )
      );

      const result = await fileSystemExtensionApi.reloadExtension(extension.uniqueId);
      if (result.isSuccess) {
        message.success(`扩展 ${extension.name} 已重载`);
        // 重新加载扩展列表获取最新状态
        await loadExtensions();
      } else {
        message.error(result.message || '重载失败');
        // 操作失败时恢复原状态
        setExtensions(prevExtensions => 
          prevExtensions.map(ext => 
            ext.uniqueId === extension.uniqueId 
              ? { ...ext, status: extension.status }
              : ext
          )
        );
      }
    } catch (error) {
      console.error('重新加载扩展失败:', error);
      message.error('重新加载失败');
      // 异常时恢复原状态
      setExtensions(prevExtensions => 
        prevExtensions.map(ext => 
          ext.uniqueId === extension.uniqueId 
            ? { ...ext, status: extension.status }
            : ext
        )
      );
    } finally {
      // 从操作中列表移除
      setOperatingExtensions(prev => {
        const newSet = new Set(prev);
        newSet.delete(extension.uniqueId);
        return newSet;
      });
    }
  }, [loadExtensions]);

  // 查看扩展详情
  const handleViewDetail = (extension: Extension) => {
    setSelectedExtension(extension);
    setDetailVisible(true);
  };

  // 处理扩展安装成功
  const handleInstallSuccess = async (result: ExtensionInstallResult) => {
    message.success(`${result.extensionName} 安装成功！`);
    setUploadVisible(false);
    // 触发热重载
    try {
      await fileSystemExtensionApi.triggerHotReload();
    } catch (error) {
      console.warn('触发热重载失败:', error);
    }
    // 重新加载扩展列表
    await loadExtensions();
  };

  // 卸载扩展（完全删除）
  const handleUninstallExtension = useCallback(async (extension: Extension) => {
    try {
      // 添加到操作中列表
      setOperatingExtensions(prev => new Set(prev).add(extension.uniqueId));
      
      // 立即更新本地状态为 loading，提供即时视觉反馈
      setExtensions(prevExtensions => 
        prevExtensions.map(ext => 
          ext.uniqueId === extension.uniqueId 
            ? { ...ext, status: 'loading' }
            : ext
        )
      );

      const result = await fileSystemExtensionApi.uninstallExtension(extension.uniqueId);
      if (result.isSuccess) {
        message.success(`扩展 ${extension.name} 已卸载`);
        // 重新加载扩展列表获取最新状态
        await loadExtensions();
      } else {
        message.error(result.message || '卸载失败');
        // 操作失败时恢复原状态
        setExtensions(prevExtensions => 
          prevExtensions.map(ext => 
            ext.uniqueId === extension.uniqueId 
              ? { ...ext, status: extension.status }
              : ext
          )
        );
      }
    } catch (error) {
      console.error('卸载扩展失败:', error);
      message.error('卸载失败');
      // 异常时恢复原状态
      setExtensions(prevExtensions => 
        prevExtensions.map(ext => 
          ext.uniqueId === extension.uniqueId 
            ? { ...ext, status: extension.status }
            : ext
        )
      );
    } finally {
      // 从操作中列表移除
      setOperatingExtensions(prev => {
        const newSet = new Set(prev);
        newSet.delete(extension.uniqueId);
        return newSet;
      });
    }
  }, [loadExtensions]);

  // 获取状态标签
  const getStatusTag = (status: string) => {
    let text: string;
    let color: string;
    let icon: React.ReactNode;
    
    switch (status) {
      case 'active':
        text = '启用中';
        color = 'processing';
        icon = <CheckCircleOutlined />;
        break;
      case 'inactive':
        text = '禁用中';
        color = 'default';
        icon = <CloseCircleOutlined />;
        break;
      case 'loading':
        text = '加载中';
        color = 'processing';
        icon = undefined;
        break;
      case 'error':
        text = '错误';
        color = 'error';
        icon = <CloseCircleOutlined />;
        break;
      default:
        text = '未知';
        color = 'default';
        icon = <CloseCircleOutlined />;
    }
    
    return (
      <Tag 
        color={color} 
        icon={icon}
        style={{ 
          minWidth: '70px', 
          textAlign: 'center',
          padding: '4px 8px',
          fontSize: '12px'
        }}
      >
        {text}
      </Tag>
    );
  };

  // 获取类型图标
  const getTypeIcon = (type: string) => {
    return type === 'plugin' ? <CodeOutlined /> : <BgColorsOutlined />;
  };

  // 获取类型标签
  const getTypeTag = (type: string, isBackend = false) => {
    let text = type === 'plugin' ? '插件' : '主题';
    let color = type === 'plugin' ? 'blue' : 'purple';
    
    // 区分前端和后端插件
    if (type === 'plugin') {
      if (isBackend) {
        text = '后端插件';
        color = 'orange';
      } else {
        text = '前端插件';
        color = 'green';
      }
    }
    
    return <Tag color={color} icon={getTypeIcon(type)}>{text}</Tag>;
  };

  // 表格列定义
  const columns: ColumnsType<Extension> = [
    {
      title: '扩展信息',
      key: 'info',
      width: 300,
      render: (_: unknown, record: Extension) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            size={40}
            icon={getTypeIcon(record.type)}
            style={{ 
              backgroundColor: record.type === 'plugin' ? '#1890ff' : '#722ed1',
              flexShrink: 0
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Text strong style={{ fontSize: 14 }}>{record.name}</Text>
              {getTypeTag(record.type, false)} {/* 目前都是前端扩展 */}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.description}
            </Text>
            <div style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                by {record.author} • v{record.version}
              </Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
      filters: [
        { text: '启用中', value: 'active' },
        { text: '禁用中', value: 'inactive' },
        { text: '错误', value: 'error' },
      ],
    },
    {
      title: '功能',
      key: 'features',
      width: 200,
      render: (_: unknown, record: Extension) => (
        <div>
            {record.capabilities?.slots && record.capabilities.slots.length > 0 && (
              <div style={{ marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  插槽: {record.capabilities.slots.length}
                </Text>
              </div>
            )}
            {record.capabilities?.hooks && record.capabilities.hooks.length > 0 && (
              <div style={{ marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  钩子: {record.capabilities.hooks.length}
                </Text>
              </div>
            )}
            <div>
              {fileSystemExtensionUtils.parseTags(record.tags || '[]').slice(0, 3).map((tag: string) => (
                <Tag key={tag} style={{ fontSize: 10, margin: '0 2px 2px 0' }}>
                  {tag}
                </Tag>
              ))}
              {fileSystemExtensionUtils.parseTags(record.tags || '[]').length > 3 && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  +{fileSystemExtensionUtils.parseTags(record.tags || '[]').length - 3}
                </Text>
              )}
            </div>
        </div>
      ),
    },
    {
      title: '功能',
      key: 'actions',
      width: 240,
      render: (_: unknown, record: Extension) => {
        const isOperating = operatingExtensions.has(record.uniqueId);
        const isToggleLoading = toggleLoading === record.uniqueId;
        const isActive = record.status === 'active';
        
        return (
          <Space size="small">
            <Tooltip title={isActive ? '禁用此扩展' : '启用此扩展'}>
              <Button
                type={isActive ? 'default' : 'primary'}
                size="small"
                danger={isActive}
                loading={isToggleLoading}
                icon={!isToggleLoading ? 
                  (isActive ? <StopOutlined /> : <PlayCircleOutlined />) : 
                  undefined
                }
                onClick={() => handleToggleExtension(record)}
                disabled={isOperating || (toggleLoading !== null && !isToggleLoading)}
              >
                {isActive ? '禁用扩展' : '启用扩展'}
              </Button>
            </Tooltip>
            <Tooltip title="重新加载">
              <Button
                size="small"
                icon={<ReloadOutlined />}
                loading={isOperating && record.status === 'loading'}
                disabled={isOperating || toggleLoading !== null}
                onClick={() => handleReloadExtension(record)}
              />
            </Tooltip>
            <Tooltip title="查看详情">
              <Button
                size="small"
                icon={<EyeOutlined />}
                disabled={isOperating || toggleLoading !== null}
                onClick={() => handleViewDetail(record)}
              />
            </Tooltip>
            <Tooltip title="卸载扩展">
              <Button
                size="small"
                icon={<DeleteOutlined />}
                danger
                loading={isOperating && record.status === 'loading'}
                disabled={isOperating || toggleLoading !== null}
                onClick={() => {
                  Modal.confirm({
                    title: '确认卸载',
                    content: `确定要卸载扩展 ${record.name} 吗？这将删除所有相关文件。`,
                    onOk: () => handleUninstallExtension(record)
                  });
                }}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AppstoreOutlined />
          扩展管理
        </Title>
        <Paragraph type="secondary" style={{ margin: '8px 0 0 0' }}>
          统一管理前端插件和主题扩展，控制扩展的启用状态和配置
        </Paragraph>
      </div>


      {/* 主内容区 */}
      <Card>
        {/* 工具栏 */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Input.Search
              placeholder="搜索扩展名称、描述或标签"
              style={{ width: 300 }}
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
              allowClear
            />
            <Select
              placeholder="筛选状态"
              style={{ width: 120 }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="all">全部状态</Option>
              <Option value="active">启用中</Option>
              <Option value="inactive">禁用中</Option>
              <Option value="error">错误</Option>
            </Select>
            <Select
              placeholder="筛选类型"
              style={{ width: 120 }}
              value={typeFilter}
              onChange={setTypeFilter}
            >
              <Option value="all">全部类型</Option>
              <Option value="plugin">插件</Option>
              <Option value="theme">主题</Option>
            </Select>
          </div>
          <div>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadExtensions}
                loading={loading}
              >
                刷新
              </Button>
              <Button
                type="primary"
                icon={<CloudUploadOutlined />}
                onClick={() => setUploadVisible(true)}
              >
                安装扩展
              </Button>
            </Space>
          </div>
        </div>

        {/* 标签页 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ marginBottom: 16 }}
            items={[
            {
              label: '全部',
              key: 'all',
            },
            {
              label: '前端插件',
              key: 'frontend-plugins',
            },
            {
              label: '后端插件',
              key: 'backend-plugins',
            },
            {
              label: '主题',
              key: 'themes',
            },
          ]}
        />

        {/* 扩展列表 */}
        <Table
          rowKey="uniqueId"
          columns={columns}
          dataSource={filteredExtensions}
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            total: filteredExtensions.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number, range: [number, number]) =>
              `第 ${range[0]}-${range[1]} 项，共 ${total} 项`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无扩展数据"
              />
            ),
          }}
        />
      </Card>

      {/* 扩展详情抽屉 */}
      <Drawer
        title="扩展详情"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        extra={
          selectedExtension && (
            <Space>
              <Button
                type={selectedExtension.status === 'active' ? 'default' : 'primary'}
                danger={selectedExtension.status === 'active'}
                loading={toggleLoading === selectedExtension.uniqueId}
                icon={!toggleLoading || toggleLoading !== selectedExtension.uniqueId ? 
                  (selectedExtension.status === 'active' ? <StopOutlined /> : <PlayCircleOutlined />) : 
                  undefined
                }
                onClick={() => {
                  handleToggleExtension(selectedExtension);
                  setDetailVisible(false);
                }}
                disabled={toggleLoading !== null}
              >
                {selectedExtension.status === 'active' ? '禁用扩展' : '启用扩展'}
              </Button>
              <Button
                icon={<ReloadOutlined />}
                disabled={toggleLoading !== null}
                onClick={() => {
                  if (selectedExtension) {
                    handleReloadExtension(selectedExtension);
                    setDetailVisible(false);
                  }
                }}
              >
                重新加载
              </Button>
            </Space>
          )
        }
      >
        {selectedExtension && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar
                size={64}
                icon={getTypeIcon(selectedExtension.type)}
                style={{ 
                  backgroundColor: selectedExtension.type === 'plugin' ? '#1890ff' : '#722ed1',
                  marginBottom: 16
                }}
              />
              <Title level={4}>{selectedExtension.name}</Title>
              <div style={{ marginBottom: 8 }}>
                {getTypeTag(selectedExtension.type, false)} {/* 目前都是前端扩展 */}
                {getStatusTag(selectedExtension.status || 'inactive')}
              </div>
              <Text type="secondary">{selectedExtension.description}</Text>
            </div>

            <Descriptions column={1} bordered>
              <Descriptions.Item label="扩展ID">
                <Text code>{selectedExtension.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="版本">{selectedExtension.version}</Descriptions.Item>
              <Descriptions.Item label="作者">{selectedExtension.author}</Descriptions.Item>
              <Descriptions.Item label="类型">
                {getTypeTag(selectedExtension.type, false)} {/* 目前都是前端扩展 */}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {getStatusTag(selectedExtension.status || 'inactive')}
              </Descriptions.Item>
              {selectedExtension.uniqueId && (
                <Descriptions.Item label="扩展路径">
                  <Text code>extensions/{selectedExtension.uniqueId}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedExtension.tags && fileSystemExtensionUtils.parseTags(selectedExtension.tags).length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>标签</Title>
                <div>
                  {fileSystemExtensionUtils.parseTags(selectedExtension.tags).map((tag: string) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
              </div>
            )}

            {selectedExtension.capabilities?.slots && selectedExtension.capabilities.slots.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>使用的插槽</Title>
                <List
                  size="small"
                  dataSource={selectedExtension.capabilities.slots}
                  renderItem={(slot: string) => (
                    <List.Item>
                      <Text code>{slot}</Text>
                    </List.Item>
                  )}
                />
              </div>
            )}

            {selectedExtension.capabilities?.hooks && selectedExtension.capabilities.hooks.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>生命周期钩子</Title>
                <List
                  size="small"
                  dataSource={selectedExtension.capabilities.hooks}
                  renderItem={(hook: string) => (
                    <List.Item>
                      <Text code>{hook}</Text>
                    </List.Item>
                  )}
                />
              </div>
            )}

            {selectedExtension.capabilities && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>能力声明</Title>
                <Row gutter={[8, 8]}>
                  {Object.entries(selectedExtension.capabilities).map(([key, value]) => (
                    value && (
                      <Col key={key}>
                        <Tag color={value ? 'success' : 'default'}>
                          {key}
                        </Tag>
                      </Col>
                    )
                  ))}
                </Row>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* 扩展上传器 */}
      <ExtensionUploader
        visible={uploadVisible}
        onClose={() => setUploadVisible(false)}
        onInstallSuccess={handleInstallSuccess}
      />
    </div>
  );
};

export default ExtensionManagement;
