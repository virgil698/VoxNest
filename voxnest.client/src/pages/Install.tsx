import React, { useState, useEffect } from 'react';
import { Card, Steps, Button, Result, Spin, message } from 'antd';
import { CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { InstallApi, InstallStep } from '../api/install';
import type { InstallStatusDto, DatabaseConfigDto, CreateAdminDto, SiteConfigDto } from '../api/install';
import DatabaseConfigStep from '../components/install/DatabaseConfigStep';
import AdminSetupStep from '../components/install/AdminSetupStep';
import SiteConfigStep from '../components/install/SiteConfigStep';
import '../styles/pages/Install.css';

const Install: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [installStatus, setInstallStatus] = useState<InstallStatusDto | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [dbInitStarted, setDbInitStarted] = useState(false);
  const [dbInitCompleted, setDbInitCompleted] = useState(false);

  // 安装步骤配置
  const installSteps = [
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
  ];

  // 获取安装状态
  const fetchInstallStatus = async () => {
    try {
      setLoading(true);
      const status = await InstallApi.getInstallStatus();
      setInstallStatus(status);
      
      // 根据安装状态设置当前步骤
      const stepIndex = installSteps.findIndex(step => step.step === status.currentStep);
      setCurrentStep(stepIndex >= 0 ? stepIndex : 0);
    } catch (error) {
      console.error('获取安装状态失败:', error);
      message.error('获取安装状态失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstallStatus();
  }, []);

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
          
          const result = await InstallApi.initializeDatabase();
          if (!result.success) {
            message.error({ content: result.message, key: 'dbInit' });
            setDbInitStarted(false); // 重置状态以允许重试
            return;
          }

          // 显示成功消息
          message.success({ content: '数据库初始化成功！', key: 'dbInit' });
          setDbInitCompleted(true);
          
          // 等待1秒让用户看到成功消息
          setTimeout(() => {
            setCurrentStep(2); // 进入管理员设置步骤
          }, 1500);
          
        } catch (error) {
          console.error('数据库初始化失败:', error);
          message.error({ content: '数据库初始化失败，请重试', key: 'dbInit' });
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
  const retryDatabaseInit = () => {
    setDbInitStarted(false);
    setDbInitCompleted(false);
    // 触发useEffect重新执行初始化
  };

  // 管理员创建处理
  const handleCreateAdmin = async (adminInfo: CreateAdminDto) => {
    try {
      setProcessing(true);
      
      const result = await InstallApi.createAdminUser(adminInfo);
      if (!result.success) {
        message.error(result.message);
        return;
      }

      message.success('管理员账户创建成功');
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

      message.success('安装完成！系统即将重启...');
      
      // 延迟后重定向到首页
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
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
      case 1: // 数据库初始化
        return (
          <div className="step-content">
            <div className="step-description">
              <h3>数据库初始化</h3>
              <p>正在初始化数据库，创建必要的数据表和基础数据...</p>
            </div>
            <div className="step-loading">
              <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
              <p>{processing ? '正在执行数据库初始化...' : '准备初始化数据库...'}</p>
            </div>
            {/* 初始化失败时的重试按钮 */}
            {!processing && dbInitStarted && !dbInitCompleted && (
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <Button 
                  type="primary" 
                  onClick={retryDatabaseInit}
                >
                  重试初始化
                </Button>
              </div>
            )}
          </div>
        );
      case 2: // 管理员设置
        return (
          <AdminSetupStep
            onSubmit={handleCreateAdmin}
            loading={processing}
          />
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
      <div className="install-container">
        <Card className="install-card">
          <Result
            status="success"
            title="VoxNest 已安装完成"
            subTitle="系统已成功安装并配置完成，您可以正常使用论坛功能。"
            extra={
              <Button type="primary" onClick={() => window.location.href = '/'}>
                访问论坛首页
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="install-container">
        <div className="install-loading">
          <Spin size="large" />
          <p>正在检查安装状态...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="install-container">
      <Card className="install-card">
        <div className="install-header">
          <h1>VoxNest 论坛安装向导</h1>
          <p>欢迎使用 VoxNest 论坛系统，请按照以下步骤完成系统安装。</p>
        </div>

        <Steps
          current={currentStep}
          className="install-steps"
          items={installSteps.map((step, index) => ({
            title: step.title,
            description: step.description,
            icon: index < currentStep ? <CheckCircleOutlined /> : undefined,
            status: index === currentStep && processing ? 'process' : undefined
          }))}
        />

        <div className="install-content">
          {renderStepContent()}
        </div>
      </Card>
    </div>
  );
};

export default Install;
