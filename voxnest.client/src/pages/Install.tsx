import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Steps, Button, message, Alert } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { InstallApi, InstallStep } from '../api/install';
import type { InstallStatusDto, DatabaseConfigDto, CreateAdminDto, SiteConfigDto } from '../api/install';
import DatabaseConfigStep from '../components/install/DatabaseConfigStep';
import AdminSetupStep from '../components/install/AdminSetupStep';
import SiteConfigStep from '../components/install/SiteConfigStep';
import SimpleLoading from '../components/common/SimpleLoading';
import { handleApiError } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { UserStatus } from '../types/auth';
import { usePostInstallMonitor } from '../hooks/useServiceStatus';
import '../styles/pages/Install.css';

interface DiagnosisData {
  timestamp: string;
  configFile: {
    exists: boolean;
    readable: boolean;
    validConfig: boolean;
    errorMessage?: string;
  };
  database?: {
    connected: boolean;
    provider?: string;
    connectionString?: string;
    errorMessage?: string;
  };
  tables?: Record<string, {
    exists: boolean;
    columns?: string[];
    rowCount?: number;
  }>;
  seedData?: Record<string, unknown>;
}

// 添加错误消息动画样式
const injectErrorAnimationStyles = () => {
  const errorAnimationCSS = `
    @keyframes messageSlideIn {
      0% {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    @keyframes messageShake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-3px); }
      75% { transform: translateX(3px); }
    }
    
    .ant-message .ant-message-notice {
      animation: messageSlideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    
    .ant-message .ant-message-error {
      animation: messageSlideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), 
                 messageShake 0.3s ease-in-out 0.2s;
    }
    
    .ant-alert {
      animation: messageSlideIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
  `;
  
  if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.textContent = errorAnimationCSS;
    if (!document.head.querySelector('[data-message-animations]')) {
      styleElement.setAttribute('data-message-animations', 'true');
      document.head.appendChild(styleElement);
    }
  }
};

// 注入样式
injectErrorAnimationStyles();

const Install: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const { setAuth } = useAuthStore();
  const [installStatus, setInstallStatus] = useState<InstallStatusDto | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [dbInitStarted, setDbInitStarted] = useState(false);
  const [dbInitCompleted, setDbInitCompleted] = useState(false);
  
  // 安装后服务重启监控
  const { waitingForRestart, startMonitoring } = usePostInstallMonitor(() => {
    // 服务重启完成回调
    message.success('🎉 系统重启完成！正在跳转到首页...');
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
  });

  // 安装步骤配置
  const installSteps = useMemo(() => [
    {
      title: '数据库配置',
      description: '配置数据库连接信息',
      step: InstallStep.DatabaseConfig
    },
    {
      title: '数据库初始化',
      description: '创建数据库表和基础数据',
      step: InstallStep.DatabaseInit
    },
    {
      title: '管理员设置',
      description: '创建系统管理员账户',
      step: InstallStep.CreateAdmin
    },
    {
      title: '完成安装',
      description: '站点配置和安装完成',
      step: InstallStep.Completed
    }
  ], []);

  // 获取安装状态
  const fetchInstallStatus = useCallback(async () => {
    try {
      setLoading(true);
      const status = await InstallApi.getInstallStatus();
      setInstallStatus(status);
      
      // 根据安装状态设置当前步骤
      const stepIndex = installSteps.findIndex(step => step.step === status.currentStep);
      setCurrentStep(stepIndex >= 0 ? stepIndex : 0);
      
      // 如果检测到用户回到了中间步骤，显示恢复提示
      if (status.currentStep === InstallStep.DatabaseInit && status.configExists) {
        console.log('检测到断点续传：数据库配置已存在，继续初始化过程');
        message.info({
          content: '检测到之前的安装进度，将继续数据库初始化步骤',
          duration: 3,
          key: 'resume-install'
        });
      } else if (status.currentStep === InstallStep.CreateAdmin && status.databaseInitialized) {
        console.log('检测到断点续传：数据库已初始化，继续创建管理员');
        message.info({
          content: '检测到数据库已初始化，将继续创建管理员账户',
          duration: 3,
          key: 'resume-install'
        });
      }
    } catch (error) {
      console.error('获取安装状态失败:', error);
      message.error('获取安装状态失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  }, [installSteps]);

  useEffect(() => {
    fetchInstallStatus();
  }, [fetchInstallStatus]);

  // 重置数据库初始化状态，当步骤变化时
  useEffect(() => {
    if (currentStep !== 1) {
      setDbInitStarted(false);
      setDbInitCompleted(false);
    }
  }, [currentStep]);

  // 自动触发数据库初始化（使用useEffect而不是在render中）
  useEffect(() => {
    if (currentStep === 1 && !dbInitStarted && !dbInitCompleted) {
      setDbInitStarted(true);
      const initializeDB = async () => {
        try {
          setProcessing(true);
          
          // 显示初始化开始消息
          message.loading({ content: '正在初始化数据库...', key: 'dbInit', duration: 0 });
          
          // 首先尝试直接初始化（首次安装不强制重新初始化）
          let result = await InstallApi.initializeDatabaseDirect(false);
          if (!result.success) {
            // 如果直接初始化失败，尝试传统的热重载方式
            message.info({ content: '尝试热重载方式初始化...', key: 'dbInit', duration: 2 });
            await new Promise(resolve => setTimeout(resolve, 1000));
            result = await InstallApi.initializeDatabase();
          }
          
          if (!result.success) {
            message.error({ content: `数据库初始化失败：${result.message}`, key: 'dbInit' });
            setDbInitStarted(false); // 重置状态以允许重试
            return;
          }

          // 显示成功消息
          message.success({ content: '数据库初始化成功！', key: 'dbInit' });
          setDbInitCompleted(true);
          
          // 等待1.5秒让用户看到成功消息
          setTimeout(() => {
            setCurrentStep(2); // 进入管理员设置步骤
          }, 1500);
          
        } catch (error) {
          console.error('数据库初始化失败:', error);
          const errorMessage = error instanceof Error ? error.message : '未知错误';
          message.error({ content: `数据库初始化失败：${errorMessage}`, key: 'dbInit' });
          setDbInitStarted(false); // 重置状态以允许重试
        } finally {
          setProcessing(false);
        }
      };
      
      // 延迟500ms执行，让界面有时间渲染
      const timer = setTimeout(initializeDB, 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, dbInitStarted, dbInitCompleted]);

  // 数据库配置处理
  const handleDatabaseConfig = async (config: DatabaseConfigDto) => {
    try {
      setProcessing(true);
      
      // 测试数据库连接
      const testResult = await InstallApi.testDatabaseConnection(config);
      if (!testResult.success) {
        message.error(testResult.message);
        return;
      }

      // 保存数据库配置
      const saveResult = await InstallApi.saveDatabaseConfig(config);
      if (!saveResult.success) {
        message.error(saveResult.message);
        return;
      }

      message.success('数据库配置保存成功');
      
      // 进入下一步：初始化数据库（通过设置步骤触发useEffect）
      setCurrentStep(1);
    } catch (error) {
      console.error('数据库配置失败:', error);
      message.error('数据库配置失败，请检查配置信息');
    } finally {
      setProcessing(false);
    }
  };

  // 重试数据库初始化
  const retryDatabaseInit = async () => {
    try {
      setProcessing(true);
      
      // 显示重试消息
      message.loading({ content: '正在重新初始化数据库...', key: 'dbInit', duration: 0 });
      
      // 直接调用强制重新初始化API
      const result = await InstallApi.initializeDatabaseDirect(true);
      
      if (!result.success) {
        message.error({ content: `重新初始化失败：${result.message}`, key: 'dbInit' });
        return;
      }

      // 显示成功消息
      message.success({ content: '数据库重新初始化成功！', key: 'dbInit' });
      setDbInitCompleted(true);
      
      // 刷新安装状态
      await fetchInstallStatus();
      
      // 等待1.5秒让用户看到成功消息后进入下一步
      setTimeout(() => {
        setCurrentStep(2); // 进入管理员设置步骤
      }, 1500);
      
    } catch (error) {
      console.error('重试数据库初始化失败:', error);
      message.destroy('dbInit');
      handleApiError(error, '重试数据库初始化失败');
    } finally {
      setProcessing(false);
    }
  };

  // 显示数据库诊断信息
  const showDatabaseDiagnosis = async () => {
    try {
      message.loading({ content: '正在获取诊断信息...', key: 'diagnosis', duration: 0 });
      
      const diagnosis = await InstallApi.diagnoseDatabase();
      message.destroy('diagnosis');
      
      // 格式化诊断信息用于显示
      const formatDiagnosis = (data: DiagnosisData) => {
        const lines = [];
        lines.push(`🕐 诊断时间: ${data.timestamp}`);
        lines.push('');
        
        lines.push('📁 配置文件状态:');
        lines.push(`  • 存在: ${data.configFile.exists ? '✅' : '❌'}`);
        lines.push(`  • 可读: ${data.configFile.readable ? '✅' : '❌'}`);
        lines.push(`  • 有效: ${data.configFile.validConfig ? '✅' : '❌'}`);
        if (data.configFile.errorMessage) {
          lines.push(`  • 错误: ${data.configFile.errorMessage}`);
        }
        lines.push('');
        
        lines.push('🗄️ 数据库状态:');
        if (data.database) {
          lines.push(`  • 连接: ${data.database.connected ? '✅' : '❌'}`);
          lines.push(`  • 提供商: ${data.database.provider || 'N/A'}`);
          lines.push(`  • 连接串: ${data.database.connectionString || 'N/A'}`);
          if (data.database.errorMessage) {
            lines.push(`  • 错误: ${data.database.errorMessage}`);
          }
        } else {
          lines.push(`  • 未找到数据库信息`);
        }
        lines.push('');
        
        if (data.tables && Object.keys(data.tables).length > 0) {
          lines.push('📋 数据表状态:');
          Object.entries(data.tables).forEach(([tableName, tableInfo]: [string, { exists: boolean; columns?: string[]; rowCount?: number; count?: number; error?: string }]) => {
            if (tableInfo.exists) {
              lines.push(`  • ${tableName}: ✅ (${tableInfo.count} 条记录)`);
            } else {
              lines.push(`  • ${tableName}: ❌ ${tableInfo.error || '不存在'}`);
            }
          });
          lines.push('');
        }
        
        if (data.seedData && Object.keys(data.seedData).length > 0) {
          lines.push('🌱 种子数据状态:');
          Object.entries(data.seedData).forEach(([key, value]: [string, unknown]) => {
            if (key === 'error') {
              lines.push(`  • 错误: ${value}`);
            } else if (typeof value === 'object' && value !== null) {
              const objValue = value as Record<string, unknown>;
              if ('exists' in objValue) {
                lines.push(`  • ${key}: ${objValue.exists ? '✅' : '❌'} ${objValue.id ? `(ID: ${objValue.id})` : ''}`);
              } else if ('hasData' in objValue) {
                lines.push(`  • ${key}: ${objValue.hasData ? '✅' : '❌'} (${objValue.count} 条记录)`);
              }
            }
          });
        }
        
        return lines.join('\n');
      };
      
      // 显示诊断信息
      message.info({
        content: (
          <div style={{ maxHeight: '400px', overflow: 'auto', whiteSpace: 'pre-line', fontFamily: 'monospace', fontSize: '12px' }}>
            {formatDiagnosis(diagnosis as DiagnosisData)}
          </div>
        ),
        duration: 0,
        key: 'diagnosis-result',
        style: { maxWidth: '600px' }
      });
      
    } catch (error) {
      console.error('获取诊断信息失败:', error);
      message.destroy('diagnosis');
      handleApiError(error, '获取诊断信息失败');
    }
  };

  // 修复数据库
  const repairDatabase = async () => {
    try {
      setProcessing(true);
      
      // 显示确认对话框
      const confirmed = window.confirm(
        '⚠️ 修复数据库将删除现有数据库并重新创建所有表结构和种子数据。\n\n' +
        '这将清除所有现有数据！\n\n' +
        '确定要继续吗？'
      );
      
      if (!confirmed) {
        setProcessing(false);
        return;
      }
      
      message.loading({ content: '正在修复数据库结构...', key: 'repair', duration: 0 });
      
      const result = await InstallApi.repairDatabase();
      
      if (!result.success) {
        message.error({ content: `修复失败：${result.message}`, key: 'repair' });
        return;
      }
      
      message.success({ content: '数据库修复成功！', key: 'repair' });
      
      // 修复成功后，重新获取安装状态
      await fetchInstallStatus();
      
      // 如果修复成功，跳转到管理员创建步骤
      setTimeout(() => {
        setCurrentStep(2);
      }, 1500);
      
    } catch (error) {
      console.error('修复数据库失败:', error);
      message.destroy('repair');
      handleApiError(error, '修复数据库失败');
    } finally {
      setProcessing(false);
    }
  };

  // 管理员创建处理
  const handleCreateAdmin = async (adminInfo: CreateAdminDto) => {
    try {
      setProcessing(true);
      
      const result = await InstallApi.createAdminUser(adminInfo);
      if (!result.success) {
        // 检查是否是表结构问题
        if (result.message.includes('表结构不完整') || result.message.includes('表不存在') || result.message.includes('Users表')) {
          message.error({
            content: (
              <div>
                <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#ff4d4f' }}>
                  创建管理员账户失败
                </div>
                <div style={{ marginBottom: 8 }}>{result.message}</div>
                <div style={{ fontSize: '12px', color: '#666', padding: '8px', backgroundColor: '#fff7e6', border: '1px solid #ffd591', borderRadius: '4px' }}>
                  💡 检测到数据库表结构问题，建议返回上一步使用"修复数据库"功能
                </div>
              </div>
            ),
            duration: 10
          });
        } else {
          // 使用统一的错误处理函数
          handleApiError({ 
            message: result.message, 
            errorCode: result.errorCode 
          }, '创建管理员账户失败');
        }
        return;
      }

      // 如果响应包含认证信息，自动设置认证状态
      if (result.accessToken && result.user) {
        // 将UserDto转换为User类型（添加status属性）
        const userForAuth = {
          ...result.user,
          status: UserStatus.Active // 新创建的管理员默认为激活状态
        };
        
        setAuth(result.accessToken, userForAuth);
        message.success({
          content: (
            <div>
              <div style={{ fontWeight: 'bold', color: '#52c41a', marginBottom: 4 }}>
                ✅ 管理员账户创建成功
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                您已自动登录，可以直接访问管理面板
              </div>
            </div>
          ),
          duration: 4
        });
        console.log('🎉 管理员创建成功并已自动登录:', result.user.username);
      } else {
        message.success('管理员账户创建成功');
      }

      setCurrentStep(3); // 进入完成步骤
      // 不调用fetchInstallStatus，避免步骤被重置
    } catch (error) {
      console.error('创建管理员账户失败:', error);
      message.error('创建管理员账户失败，请重试');
    } finally {
      setProcessing(false);
    }
  };

  // 完成安装处理
  const handleCompleteInstallation = async (siteConfig: SiteConfigDto) => {
    try {
      setProcessing(true);
      
      const result = await InstallApi.completeInstallation(siteConfig);
      if (!result.success) {
        message.error(result.message);
        return;
      }

      message.success('安装完成！系统正在重启...');
      
      // 启动服务重启监控
      startMonitoring();
      
      // 如果监控失败，兜底重定向机制
      setTimeout(() => {
        if (waitingForRestart) {
          message.warning('系统重启中，请稍候...');
          window.location.href = '/';
        }
      }, 15000); // 15秒兜底
    } catch (error) {
      console.error('完成安装失败:', error);
      message.error('完成安装失败，请重试');
    } finally {
      setProcessing(false);
    }
  };

  // 渲染当前步骤内容
  const renderStepContent = () => {
    if (!installStatus) return null;

    switch (currentStep) {
      case 0: // 数据库配置
        return (
          <DatabaseConfigStep
            onSubmit={handleDatabaseConfig}
            loading={processing}
          />
        );
      case 1: { // 数据库初始化
        const showDatabaseStatus = installStatus && !processing;
        const isConnected = installStatus?.databaseConnected ?? true;
        const hasConnectionIssue = showDatabaseStatus && !isConnected;
        
        return (
          <div className="step-content">
            <div className="step-description">
              <h3>数据库初始化</h3>
              {installStatus?.configExists ? (
                <p>检测到数据库配置已存在，将继续进行数据库初始化，创建必要的数据表和基础数据...</p>
              ) : (
                <p>正在初始化数据库，创建必要的数据表和基础数据...</p>
              )}
              
              {/* 显示配置摘要 */}
              {installStatus?.configExists && showDatabaseStatus && (
                <div style={{ 
                  background: '#f6ffed', 
                  border: '1px solid #b7eb8f', 
                  borderRadius: '6px', 
                  padding: '12px', 
                  marginTop: '12px',
                  fontSize: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: '#389e0d' }}>📋 当前配置状态</span>
                  </div>
                  <div style={{ color: '#666' }}>
                    • 配置文件: ✅ 已存在<br/>
                    • 数据库连接: {isConnected ? '✅ 正常' : '❌ 失败'}<br/>
                    • 数据库初始化: {installStatus.databaseInitialized ? '✅ 已完成' : '⏳ 待完成'}
                  </div>
                </div>
              )}
            </div>

            {/* 数据库连接状态提示 */}
            {showDatabaseStatus && hasConnectionIssue && (
              <Alert
                type="warning"
                message="数据库连接失败"
                description="检测到配置文件已存在，但无法连接到数据库。这可能是因为数据库服务未启动或网络问题。您可以选择重试初始化或修改数据库配置。"
                style={{ marginBottom: 20 }}
                showIcon
              />
            )}

            {/* 正常的初始化过程 */}
            {(processing || !showDatabaseStatus) && (
              <div style={{ padding: '32px 0', textAlign: 'center' }}>
                <SimpleLoading 
                  background="transparent"
                  size="small"
                  showLogo={false}
                  loadingType="dots"
                />
              </div>
            )}

            {/* 操作按钮区域 */}
            {showDatabaseStatus && !processing && (
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button 
                    type="primary" 
                    onClick={retryDatabaseInit}
                    disabled={processing}
                  >
                    {hasConnectionIssue ? '重试连接并初始化' : '重试初始化'}
                  </Button>
                  
                  {hasConnectionIssue && (
                    <Button 
                      onClick={() => setCurrentStep(0)}
                      disabled={processing}
                    >
                      修改数据库配置
                    </Button>
                  )}
                  
                  <Button 
                    onClick={showDatabaseDiagnosis}
                    disabled={processing}
                  >
                    查看诊断信息
                  </Button>
                  
                  <Button 
                    type="primary"
                    danger
                    onClick={repairDatabase}
                    disabled={processing}
                  >
                    修复数据库
                  </Button>
                </div>
                
                {hasConnectionIssue && (
                  <div style={{ marginTop: 16, fontSize: '14px', color: '#666' }}>
                    <p>💡 提示：请确保数据库服务已启动并且网络连接正常</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
      case 2: // 管理员设置
        return (
          <div className="step-content">
            {/* 显示进度恢复提示 */}
            {installStatus?.databaseInitialized && !installStatus?.hasAdminUser && (
              <Alert
                type="info"
                message="继续安装进程"
                description="数据库初始化已完成，现在请创建系统管理员账户。"
                style={{ marginBottom: 20 }}
                showIcon
              />
            )}
            
            <AdminSetupStep
              onSubmit={handleCreateAdmin}
              loading={processing}
            />
          </div>
        );
      case 3: // 完成安装
        return (
          <SiteConfigStep
            onSubmit={handleCompleteInstallation}
            loading={processing}
          />
        );
      default:
        return null;
    }
  };

  // 如果已安装，显示已完成页面
  if (installStatus?.isInstalled) {
    return (
      <div className="voxnest-gradient-bg" style={{ minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <Card style={{
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            textAlign: 'center',
            padding: '40px 20px'
          }}>
            <div style={{ 
              width: '100px', 
              height: '100px', 
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              color: 'white'
            }}>
              ✓
            </div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              marginBottom: '16px',
              color: 'var(--text-primary)'
            }}>
              VoxNest 安装完成！
            </h2>
            <p style={{ 
              fontSize: '16px', 
              color: 'var(--text-secondary)',
              marginBottom: '32px',
              lineHeight: '1.6'
            }}>
              系统已成功安装并配置完成，您可以正常使用论坛功能
            </p>
            <Button 
              type="primary" 
              size="large"
              onClick={() => window.location.href = '/'}
              style={{
                height: '48px',
                fontSize: '16px',
                fontWeight: '600',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                border: 'none',
                padding: '0 32px'
              }}
            >
              访问论坛首页
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <SimpleLoading 
        background="white"
        size="medium"
        showLogo={true}
        loadingType="dots"
      />
    );
  }

  return (
    <div className="voxnest-gradient-bg" style={{ minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Card style={{
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ 
              width: '100px', 
              height: '100px', 
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              color: 'white',
              fontWeight: 'bold'
            }}>
              V
            </div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              marginBottom: '12px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              VoxNest 安装向导
            </h1>
            <p style={{ 
              fontSize: '18px', 
              color: 'var(--text-secondary)',
              lineHeight: '1.6'
            }}>
              欢迎使用 VoxNest 论坛系统，请按照以下步骤完成系统安装
            </p>
          </div>

        <div style={{ marginBottom: '40px' }}>
          <Steps
            current={currentStep}
            style={{ 
              padding: '20px',
              background: 'var(--bg-secondary)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)'
            }}
            items={installSteps.map((step, index) => ({
              title: <span style={{ fontWeight: '600', fontSize: '16px' }}>{step.title}</span>,
              description: <span style={{ color: 'var(--text-secondary)' }}>{step.description}</span>,
              icon: index < currentStep ? <CheckCircleOutlined style={{ color: 'var(--success-color)' }} /> : undefined,
              status: index === currentStep && processing ? 'process' : undefined
            }))}
          />
        </div>

        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          minHeight: '400px',
          border: '1px solid var(--border-color)'
        }}>
          {renderStepContent()}
        </div>
        </Card>
      </div>
    </div>
  );
};

export default Install;
