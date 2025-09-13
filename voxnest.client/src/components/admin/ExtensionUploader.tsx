/**
 * 扩展上传器组件
 */

import React, { useState } from 'react';
import {
  Modal,
  Upload,
  Button,
  Form,
  Select,
  Switch,
  Input,
  Card,
  Alert,
  message,
  Descriptions,
  Tag,
  Steps,
  Space,
  Typography
} from 'antd';
import {
  UploadOutlined,
  CloudUploadOutlined,
  CheckCircleOutlined,
  FileZipOutlined,
  CodeOutlined,
  BgColorsOutlined
} from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload/interface';
import { extensionInstallerApi, type ExtensionUpload, type ExtensionPreview, type ExtensionInstallResult } from '../../api/unifiedExtension';
import { fileSystemExtensionApi } from '../../api/fileSystemExtension';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

interface ExtensionUploaderProps {
  visible: boolean;
  onClose: () => void;
  onInstallSuccess?: (result: ExtensionInstallResult) => void;
}

export const ExtensionUploader: React.FC<ExtensionUploaderProps> = ({
  visible,
  onClose,
  onInstallSuccess
}) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadFile, setUploadFile] = useState<RcFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<ExtensionPreview | null>(null);
  const [installResult, setInstallResult] = useState<ExtensionInstallResult | null>(null);

  // 重置状态
  const resetState = () => {
    setCurrentStep(0);
    setUploadFile(null);
    setUploading(false);
    setPreviewData(null);
    setInstallResult(null);
    form.resetFields();
  };

  // 处理文件选择
  const handleFileChange = (info: any) => {
    const { fileList } = info;
    if (fileList.length > 0) {
      const file = fileList[0].originFileObj as RcFile;
      setUploadFile(file);
    } else {
      setUploadFile(null);
    }
  };

  // 预览扩展
  const handlePreview = async () => {
    if (!uploadFile) {
      message.error('请选择扩展文件');
      return;
    }

    const extensionType = form.getFieldValue('extensionType');
    if (!extensionType) {
      message.error('请选择扩展类型');
      return;
    }

    setUploading(true);
    try {
      const result = await extensionInstallerApi.previewExtension(uploadFile, extensionType);
      if (result.isSuccess) {
        setPreviewData(result.data);
        setCurrentStep(1);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('预览失败:', error);
      message.error('预览失败');
    } finally {
      setUploading(false);
    }
  };

  // 安装扩展
  const handleInstall = async () => {
    if (!uploadFile || !previewData) {
      return;
    }

    const values = form.getFieldsValue();
    const uploadData: ExtensionUpload = {
      extensionFile: uploadFile,
      extensionType: values.extensionType,
      autoEnable: values.autoEnable || false,
      overrideExisting: values.overrideExisting || false,
      installNote: values.installNote
    };

    setUploading(true);
    try {
        // 使用文件系统API安装扩展
        const result = await fileSystemExtensionApi.installExtension(uploadData);
        if (result.isSuccess) {
          setInstallResult(result.data);
          setCurrentStep(2);
          onInstallSuccess?.(result.data);
        } else {
          message.error(result.message);
        }
    } catch (error) {
      console.error('安装失败:', error);
      message.error('安装失败');
    } finally {
      setUploading(false);
    }
  };

  // 处理关闭
  const handleClose = () => {
    resetState();
    onClose();
  };

  // 获取扩展类型图标
  const getTypeIcon = (type: string) => {
    return type === 'plugin' ? <CodeOutlined /> : <BgColorsOutlined />;
  };

  // 步骤内容
  const stepContent = () => {
    switch (currentStep) {
      case 0: // 文件上传
        return (
          <div>
            <Form form={form} layout="vertical">
              <Form.Item
                label="扩展类型"
                name="extensionType"
                rules={[{ required: true, message: '请选择扩展类型' }]}
              >
                <Select placeholder="选择要安装的扩展类型">
                  <Option value="plugin">
                    <Space>
                      <CodeOutlined />
                      插件
                    </Space>
                  </Option>
                  <Option value="theme">
                    <Space>
                      <BgColorsOutlined />
                      主题
                    </Space>
                  </Option>
                </Select>
              </Form.Item>

              <Form.Item label="扩展文件" required>
                <Upload
                  accept=".zip"
                  maxCount={1}
                  beforeUpload={() => false}
                  onChange={handleFileChange}
                  onRemove={() => setUploadFile(null)}
                >
                  <Button icon={<UploadOutlined />}>
                    选择ZIP文件
                  </Button>
                </Upload>
                <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                  请选择包含 manifest.json 的 ZIP 压缩包，文件大小不超过 50MB
                </Text>
              </Form.Item>

              <div style={{ textAlign: 'right' }}>
                <Space>
                  <Button onClick={handleClose}>
                    取消
                  </Button>
                  <Button 
                    type="primary" 
                    icon={<FileZipOutlined />}
                    loading={uploading}
                    onClick={handlePreview}
                  >
                    预览扩展
                  </Button>
                </Space>
              </div>
            </Form>
          </div>
        );

      case 1: // 扩展预览
        return (
          <div>
            {previewData && (
              <div>
                {/* 验证状态 */}
                {!previewData.isValid && (
                  <Alert
                    message="扩展验证失败"
                    description={
                      <ul>
                        {previewData.validationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    }
                    type="error"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}

                {previewData.alreadyExists && (
                  <Alert
                    message="扩展已存在"
                    description={`当前版本: ${previewData.existingVersion}，新版本: ${previewData.version}`}
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}

                {previewData.validationWarnings.length > 0 && (
                  <Alert
                    message="注意事项"
                    description={
                      <ul>
                        {previewData.validationWarnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    }
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}

                {/* 扩展信息 */}
                <Card>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                    {getTypeIcon(previewData.type)}
                    <Title level={4} style={{ margin: '0 0 0 8px' }}>
                      {previewData.name}
                    </Title>
                    <Tag color="blue" style={{ marginLeft: 'auto' }}>
                      v{previewData.version}
                    </Tag>
                  </div>

                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="扩展ID">
                      <Text code>{previewData.id}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="类型">
                      {previewData.type === 'plugin' ? '插件' : '主题'}
                    </Descriptions.Item>
                    <Descriptions.Item label="作者">{previewData.author}</Descriptions.Item>
                    <Descriptions.Item label="文件大小">
                      {(previewData.fileSize / 1024).toFixed(1)} KB
                    </Descriptions.Item>
                  </Descriptions>

                  {previewData.description && (
                    <div style={{ marginTop: 12 }}>
                      <Text strong>描述：</Text>
                      <Paragraph style={{ marginTop: 4 }}>{previewData.description}</Paragraph>
                    </div>
                  )}

                  {previewData.tags.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <Text strong>标签：</Text>
                      <div style={{ marginTop: 4 }}>
                        {previewData.tags.map(tag => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </div>
                    </div>
                  )}

                  {previewData.dependencies.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <Text strong>依赖：</Text>
                      <div style={{ marginTop: 4 }}>
                        {previewData.dependencies.map(dep => (
                          <Tag key={dep} color="orange">{dep}</Tag>
                        ))}
                      </div>
                    </div>
                  )}

                  {previewData.permissions.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <Text strong>权限要求：</Text>
                      <div style={{ marginTop: 4 }}>
                        {previewData.permissions.map(perm => (
                          <Tag key={perm} color="red">{perm}</Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>

                {/* 安装选项 */}
                <Card title="安装选项" style={{ marginTop: 16 }}>
                  <Form form={form} layout="vertical">
                    <Form.Item
                      label="自动启用"
                      name="autoEnable"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>

                    {previewData.alreadyExists && (
                      <Form.Item
                        label="覆盖现有版本"
                        name="overrideExisting"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    )}

                    <Form.Item
                      label="安装备注"
                      name="installNote"
                    >
                      <TextArea rows={3} placeholder="可选的安装备注信息" />
                    </Form.Item>
                  </Form>
                </Card>

                {/* 操作按钮 */}
                <div style={{ textAlign: 'right', marginTop: 16 }}>
                  <Space>
                    <Button onClick={() => setCurrentStep(0)}>
                      返回
                    </Button>
                    <Button onClick={handleClose}>
                      取消
                    </Button>
                    <Button 
                      type="primary" 
                      icon={<CloudUploadOutlined />}
                      loading={uploading}
                      disabled={!previewData.isValid}
                      onClick={handleInstall}
                    >
                      安装扩展
                    </Button>
                  </Space>
                </div>
              </div>
            )}
          </div>
        );

      case 2: // 安装结果
        return (
          <div>
            {installResult && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <CheckCircleOutlined 
                    style={{ fontSize: 64, color: installResult.success ? '#52c41a' : '#ff4d4f' }} 
                  />
                  <Title level={3} style={{ marginTop: 16 }}>
                    {installResult.success ? '安装成功！' : '安装失败'}
                  </Title>
                  <Text type="secondary">
                    {installResult.message}
                  </Text>
                </div>

                <Card>
                  <Descriptions column={2}>
                    <Descriptions.Item label="扩展名称">
                      {installResult.extensionName}
                    </Descriptions.Item>
                    <Descriptions.Item label="版本">
                      {installResult.version}
                    </Descriptions.Item>
                    <Descriptions.Item label="类型">
                      {installResult.type === 'plugin' ? '插件' : '主题'}
                    </Descriptions.Item>
                    <Descriptions.Item label="状态">
                      <Tag color={installResult.enabled ? 'success' : 'default'}>
                        {installResult.enabled ? '已启用' : '已安装'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="安装时间" span={2}>
                      {new Date(installResult.installedAt).toLocaleString()}
                    </Descriptions.Item>
                  </Descriptions>

                  {installResult.warnings.length > 0 && (
                    <Alert
                      message="安装警告"
                      description={
                        <ul>
                          {installResult.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      }
                      type="warning"
                      showIcon
                      style={{ marginTop: 16 }}
                    />
                  )}
                </Card>

                <div style={{ textAlign: 'right', marginTop: 16 }}>
                  <Space>
                    <Button onClick={handleClose} type="primary">
                      完成
                    </Button>
                  </Space>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CloudUploadOutlined style={{ marginRight: 8 }} />
          安装扩展
        </div>
      }
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={720}
      destroyOnClose
    >
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        <Step title="选择文件" icon={<UploadOutlined />} />
        <Step title="预览扩展" icon={<FileZipOutlined />} />
        <Step title="安装完成" icon={<CheckCircleOutlined />} />
      </Steps>

      {stepContent()}
    </Modal>
  );
};

export default ExtensionUploader;
