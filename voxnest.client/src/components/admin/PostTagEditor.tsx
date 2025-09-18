import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  Tag,
  Space,
  Button,
  Typography,
  Alert,
  message,
  Spin,
} from 'antd';
import {
  TagsOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagApi } from '../../api/tag';
import { AdminApi } from '../../api/admin';

const { Text } = Typography;

interface PostTagEditorProps {
  visible: boolean;
  postId: number;
  postTitle: string;
  currentTags: Array<{ id: number; name: string; color?: string }>;
  onClose: () => void;
  onSuccess?: () => void;
}

const PostTagEditor: React.FC<PostTagEditorProps> = ({
  visible,
  postId,
  postTitle,
  currentTags,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const queryClient = useQueryClient();

  // 获取所有可用标签
  const { data: availableTags = [], isLoading: tagsLoading, refetch: refetchTags } = useQuery({
    queryKey: ['available-tags'],
    queryFn: async () => {
      const response = await tagApi.getAvailableTags();
      return response.data.data || [];
    },
    enabled: visible,
  });

  // 更新帖子标签
  const updateTagsMutation = useMutation({
    mutationFn: (tagIds: number[]) => AdminApi.updatePostTags(postId, tagIds),
    onSuccess: () => {
      message.success('帖子标签更新成功');
      onSuccess?.();
      onClose();
      // 更新相关查询缓存
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tag-stats'] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || '更新帖子标签失败';
      message.error(errorMessage);
    },
  });

  // 初始化选中的标签
  useEffect(() => {
    if (visible && currentTags) {
      const tagIds = currentTags.map(tag => tag.id);
      setSelectedTagIds(tagIds);
      form.setFieldsValue({ tagIds });
    }
  }, [visible, currentTags, form]);

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await updateTagsMutation.mutateAsync(values.tagIds || []);
    } catch (error) {
      // 表单验证失败
    }
  };

  // 处理取消
  const handleCancel = () => {
    form.resetFields();
    setSelectedTagIds([]);
    onClose();
  };

  // 分类标签
  const permanentTags = availableTags.filter(tag => tag.isPermanent);
  const dynamicTags = availableTags.filter(tag => !tag.isPermanent);

  // 验证标签选择
  const validateTags = (_: any, value: number[]) => {
    if (!value || value.length === 0) {
      return Promise.reject(new Error('请至少选择一个标签'));
    }
    
    const selectedPermanentTags = permanentTags.filter(tag => value.includes(tag.id));
    if (selectedPermanentTags.length === 0) {
      return Promise.reject(new Error('必须至少选择一个常驻标签'));
    }
    
    return Promise.resolve();
  };

  return (
    <Modal
      title={
        <Space>
          <TagsOutlined />
          编辑帖子标签
        </Space>
      }
      open={visible}
      width={600}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={updateTagsMutation.isPending}
      okText="保存"
      cancelText="取消"
    >
      <div style={{ marginBottom: 16 }}>
        <Text strong>帖子标题：</Text>
        <Text>{postTitle}</Text>
      </div>

      {tagsLoading ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            tagIds: selectedTagIds,
          }}
        >
          <Form.Item
            name="tagIds"
            label={
              <Space>
                <TagsOutlined />
                <span>选择标签</span>
                <Button
                  type="text"
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={() => refetchTags()}
                  title="刷新标签列表"
                />
              </Space>
            }
            rules={[{ validator: validateTags }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择标签"
              style={{ width: '100%' }}
              optionLabelProp="label"
              onChange={setSelectedTagIds}
            >
              {/* 常驻标签组 */}
              {permanentTags.length > 0 && (
                <Select.OptGroup label="🔒 常驻标签">
                  {permanentTags.map(tag => (
                    <Select.Option
                      key={tag.id}
                      value={tag.id}
                      label={tag.name}
                    >
                      <Space>
                        <Tag color={tag.color || 'green'}>{tag.name}</Tag>
                        <Text type="secondary">({tag.useCount}次使用)</Text>
                      </Space>
                    </Select.Option>
                  ))}
                </Select.OptGroup>
              )}
              
              {/* 动态标签组 */}
              {dynamicTags.length > 0 && (
                <Select.OptGroup label="🏷️ 动态标签">
                  {dynamicTags.map(tag => (
                    <Select.Option
                      key={tag.id}
                      value={tag.id}
                      label={tag.name}
                    >
                      <Space>
                        <Tag color={tag.color || 'blue'}>{tag.name}</Tag>
                        <Text type="secondary">({tag.useCount}次使用)</Text>
                      </Space>
                    </Select.Option>
                  ))}
                </Select.OptGroup>
              )}
            </Select>
          </Form.Item>

          {/* 当前标签预览 */}
          <div style={{ marginTop: 16 }}>
            <Text strong>当前选择的标签：</Text>
            <div style={{ marginTop: 8 }}>
              <Space wrap>
                {selectedTagIds.map(tagId => {
                  const tag = availableTags.find(t => t.id === tagId);
                  if (!tag) return null;
                  
                  return (
                    <Tag
                      key={tag.id}
                      color={tag.color || (tag.isPermanent ? 'green' : 'blue')}
                    >
                      {tag.name}
                      {tag.isPermanent && ' (常驻)'}
                    </Tag>
                  );
                })}
                {selectedTagIds.length === 0 && (
                  <Text type="secondary">暂未选择标签</Text>
                )}
              </Space>
            </div>
          </div>

          {/* 标签选择提示 */}
          <Alert
            message="标签选择规则"
            description={
              <div>
                <div>• 必须至少选择一个常驻标签</div>
                <div>• 可以选择任意数量的动态标签</div>
                <div>• 常驻标签由管理员创建和维护</div>
                <div>• 动态标签由用户创建，无引用时会自动清理</div>
              </div>
            }
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />

          {/* 统计信息 */}
          <div style={{ marginTop: 16, fontSize: '12px', color: '#666' }}>
            <Text type="secondary">
              可用标签: 常驻 {permanentTags.length} 个，动态 {dynamicTags.length} 个
            </Text>
          </div>
        </Form>
      )}
    </Modal>
  );
};

export default PostTagEditor;
