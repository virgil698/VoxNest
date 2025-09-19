import React, { useState, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Modal,
  Form,
  message,
  Tooltip,
  Typography,
  Select,
  Popconfirm,
  ColorPicker,
  Switch,
  Row,
  Col,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  MergeCellsOutlined,
  ClearOutlined,
  TagsOutlined,
  FireOutlined,
  ClockCircleOutlined,
  UserOutlined,
  LockOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { AdminApi, type AdminTag, type AdminTagQuery, type CreateTag, type UpdateTag } from '../../api/admin';

const { Search } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

const TagManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'permanent' | 'dynamic'>('permanent');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [editingTag, setEditingTag] = useState<AdminTag | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isMergeModalVisible, setIsMergeModalVisible] = useState(false);
  const [mergeSourceId, setMergeSourceId] = useState<number | null>(null);

  const [form] = Form.useForm();
  const [mergeForm] = Form.useForm();
  const queryClient = useQueryClient();

  // 构建查询参数
  const buildQuery = useCallback((): AdminTagQuery => ({
    pageNumber: currentPage,
    pageSize,
    search: searchText || undefined,
    isPermanent: activeTab === 'permanent',
    sortBy: activeTab === 'permanent' ? 'priority' : 'useCount',
    sortDirection: activeTab === 'permanent' ? 'asc' : 'desc',
  }), [currentPage, pageSize, searchText, activeTab]);

  // 当切换标签页时重置分页
  const handleTabChange = (key: string) => {
    setActiveTab(key as 'permanent' | 'dynamic');
    setCurrentPage(1);
    setSelectedTags([]);
  };

  // 获取标签列表
  const { data: tagData, isLoading, refetch } = useQuery({
    queryKey: ['admin-tags', buildQuery()],
    queryFn: () => AdminApi.getTags(buildQuery()),
  });


  // 创建标签
  const createTagMutation = useMutation({
    mutationFn: (data: CreateTag) => AdminApi.createTag(data),
    onSuccess: () => {
      message.success('标签创建成功');
      setIsModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
    },
    onError: () => {
      message.error('标签创建失败');
    },
  });

  // 更新标签
  const updateTagMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTag }) => AdminApi.updateTag(id, data),
    onSuccess: () => {
      message.success('标签更新成功');
      setIsModalVisible(false);
      setEditingTag(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
    },
    onError: () => {
      message.error('标签更新失败');
    },
  });

  // 删除标签
  const deleteTagMutation = useMutation({
    mutationFn: (id: number) => AdminApi.deleteTag(id),
    onSuccess: () => {
      message.success('标签删除成功');
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
    },
    onError: () => {
      message.error('标签删除失败');
    },
  });

  // 合并标签
  const mergeTagsMutation = useMutation({
    mutationFn: ({ sourceId, targetId }: { sourceId: number; targetId: number }) => 
      AdminApi.mergeTags(sourceId, targetId),
    onSuccess: () => {
      message.success('标签合并成功');
      setIsMergeModalVisible(false);
      mergeForm.resetFields();
      setMergeSourceId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
    },
    onError: () => {
      message.error('标签合并失败');
    },
  });

  // 清理无用标签
  const cleanupTagsMutation = useMutation({
    mutationFn: () => AdminApi.cleanupUnusedTags(),
    onSuccess: (count) => {
      message.success(`已清理 ${count} 个无用标签`);
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
    },
    onError: () => {
      message.error('清理标签失败');
    },
  });

  // 更新标签优先级
  const updatePriorityMutation = useMutation({
    mutationFn: ({ tagId, priority }: { tagId: number; priority: number }) => 
      AdminApi.updateTagPriority(tagId, priority),
    onSuccess: () => {
      message.success('优先级更新成功');
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
    },
    onError: () => {
      message.error('优先级更新失败');
    },
  });

  // 批量删除标签
  const batchDeleteMutation = useMutation({
    mutationFn: (tagIds: number[]) => AdminApi.batchDeleteTags(tagIds),
    onSuccess: (count) => {
      message.success(`已删除 ${count} 个标签`);
      setSelectedTags([]);
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
    },
    onError: () => {
      message.error('批量删除失败');
    },
  });

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  // 打开创建/编辑模态框
  const openModal = (tag?: AdminTag) => {
    if (tag) {
      setEditingTag(tag);
      form.setFieldsValue({
        name: tag.name,
        color: tag.color || '#1890ff', // ColorPicker 需要一个默认颜色值
        isPermanent: tag.isPermanent,
        ...(tag.isPermanent && { priority: tag.priority }),
      });
    } else {
      setEditingTag(null);
      form.resetFields();
      // 为新建标签设置默认值
      const defaultPriority = activeTab === 'permanent' ? 
        ((tagData?.data || []).length > 0 ? 
          Math.max(...(tagData?.data || []).map((t: AdminTag) => t.priority || 0)) + 10 : 0) : 
        undefined;
      
      form.setFieldsValue({
        color: '#1890ff',
        isPermanent: activeTab === 'permanent',
        ...(activeTab === 'permanent' && { priority: defaultPriority }),
      });
    }
    setIsModalVisible(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 处理颜色值 - ColorPicker 返回的是对象，需要转换为字符串
      const colorValue = values.color ? 
        (typeof values.color === 'string' ? values.color : values.color.toHexString()) : 
        undefined;
      
      console.log('🔧 表单数据:', values);
      console.log('🔧 处理后的颜色值:', colorValue);
      
      if (editingTag) {
        const updateData = {
          id: editingTag.id,
          data: {
            name: values.name,
            color: colorValue,
            ...(editingTag.isPermanent && values.priority !== undefined && { priority: Number(values.priority) }),
          },
        };
        console.log('🔧 更新标签数据:', updateData);
        await updateTagMutation.mutateAsync(updateData);
      } else {
        const createData = {
          name: values.name,
          color: colorValue,
          isPermanent: values.isPermanent || false,
          ...(values.isPermanent && values.priority !== undefined && { priority: Number(values.priority) }),
        };
        console.log('🔧 创建标签数据:', createData);
        await createTagMutation.mutateAsync(createData);
      }
    } catch (error) {
      // 表单验证失败
    }
  };

  // 打开合并模态框
  const openMergeModal = (sourceId: number) => {
    setMergeSourceId(sourceId);
    setIsMergeModalVisible(true);
  };

  // 处理合并
  const handleMerge = async () => {
    try {
      const values = await mergeForm.validateFields();
      if (mergeSourceId) {
        await mergeTagsMutation.mutateAsync({
          sourceId: mergeSourceId,
          targetId: values.targetId,
        });
      }
    } catch (error) {
      // 表单验证失败
    }
  };

  // 处理优先级调整
  const handlePriorityChange = (tagId: number, direction: 'up' | 'down') => {
    const currentTags = tagData?.data || [];
    const currentTag = currentTags.find((tag: AdminTag) => tag.id === tagId);
    if (!currentTag) return;

    let newPriority: number;
    if (direction === 'up') {
      // 向上移动，优先级减小
      const upperTag = currentTags.find((tag: AdminTag) => tag.priority < currentTag.priority);
      newPriority = upperTag ? upperTag.priority - 1 : currentTag.priority - 1;
    } else {
      // 向下移动，优先级增大
      const lowerTag = currentTags.find((tag: AdminTag) => tag.priority > currentTag.priority);
      newPriority = lowerTag ? lowerTag.priority + 1 : currentTag.priority + 1;
    }

    updatePriorityMutation.mutate({ tagId, priority: newPriority });
  };

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '标签名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: AdminTag) => (
        <Tag color={record.color || 'default'}>{name}</Tag>
      ),
    },
    ...(activeTab === 'permanent' ? [{
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      sorter: true,
      render: (priority: number, record: AdminTag) => (
        <Space>
          <Text strong>{priority}</Text>
          <Space.Compact>
            <Tooltip title="向上移动">
              <Button
                type="text"
                size="small"
                icon={<ArrowUpOutlined />}
                onClick={() => handlePriorityChange(record.id, 'up')}
                disabled={updatePriorityMutation.isPending}
              />
            </Tooltip>
            <Tooltip title="向下移动">
              <Button
                type="text"
                size="small"
                icon={<ArrowDownOutlined />}
                onClick={() => handlePriorityChange(record.id, 'down')}
                disabled={updatePriorityMutation.isPending}
              />
            </Tooltip>
          </Space.Compact>
        </Space>
      ),
    }] : []),
    {
      title: '使用次数',
      dataIndex: 'useCount',
      key: 'useCount',
      width: 100,
      sorter: true,
      render: (count: number) => (
        <Space>
          <Text strong>{count}</Text>
          {count > 10 && <FireOutlined style={{ color: '#ff4d4f' }} />}
        </Space>
      ),
    },
    {
      title: '创建者',
      dataIndex: 'creatorName',
      key: 'creatorName',
      width: 120,
      render: (name: string, record: AdminTag) => (
        record.isPermanent ? (
          <Text type="secondary">管理员</Text>
        ) : (
          <Space>
            <UserOutlined />
            {name || '未知'}
          </Space>
        )
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('YYYY-MM-DD HH:mm:ss')}>
          <Space>
            <ClockCircleOutlined />
            {dayjs(date).fromNow()}
          </Space>
        </Tooltip>
      ),
    },
    {
      title: '最后使用',
      dataIndex: 'lastUsedAt',
      key: 'lastUsedAt',
      width: 180,
      render: (date: string) => (
        date ? (
          <Tooltip title={dayjs(date).format('YYYY-MM-DD HH:mm:ss')}>
            {dayjs(date).fromNow()}
          </Tooltip>
        ) : (
          <Text type="secondary">从未使用</Text>
        )
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: AdminTag) => (
        <Space>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openModal(record)}
            />
          </Tooltip>
          <Tooltip title="合并到其他标签">
            <Button
              type="text"
              icon={<MergeCellsOutlined />}
              onClick={() => openMergeModal(record.id)}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除此标签吗？"
            description="删除后不可恢复，请谨慎操作。"
            onConfirm={() => deleteTagMutation.mutate(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                disabled={record.useCount > 0}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 渲染标签管理内容
  const renderTagManagement = () => (
    <Card>
      {/* 工具栏 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Search
            placeholder="搜索标签名称"
            onSearch={handleSearch}
            style={{ width: 250 }}
            enterButton="搜索"
          />
        </Col>
        <Col>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal()}
            >
              新建{activeTab === 'permanent' ? '类别' : '标签'}
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              loading={isLoading}
            >
              刷新
            </Button>
            {activeTab === 'dynamic' && (
              <Popconfirm
                title="清理无用标签"
                description="将清理无引用的标签，确定继续吗？"
                onConfirm={() => cleanupTagsMutation.mutate()}
              >
                <Button
                  icon={<ClearOutlined />}
                  loading={cleanupTagsMutation.isPending}
                >
                  清理无用标签
                </Button>
              </Popconfirm>
            )}
            {selectedTags.length > 0 && (
              <Popconfirm
                title={`批量删除 ${selectedTags.length} 个标签`}
                description="删除后不可恢复，请谨慎操作。"
                onConfirm={() => batchDeleteMutation.mutate(selectedTags)}
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  loading={batchDeleteMutation.isPending}
                >
                  批量删除
                </Button>
              </Popconfirm>
            )}
          </Space>
        </Col>
      </Row>

      {/* 标签表格 */}
      <Table
        columns={columns}
        dataSource={tagData?.data || []}
        loading={isLoading}
        rowKey="id"
        rowSelection={{
          selectedRowKeys: selectedTags,
          onChange: (selectedRowKeys) => setSelectedTags(selectedRowKeys as number[]),
          getCheckboxProps: (record) => ({
            disabled: record.useCount > 0, // 有使用的标签不能批量删除
          }),
        }}
        pagination={{
          current: currentPage,
          pageSize,
          total: tagData?.totalCount || 0,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size || 20);
          },
        }}
      />
    </Card>
  );

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <TagsOutlined /> 类别与标签管理
      </Title>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: 'permanent',
            label: (
              <Space>
                <LockOutlined />
                类别
              </Space>
            ),
            children: renderTagManagement(),
          },
          {
            key: 'dynamic',
            label: (
              <Space>
                <FireOutlined />
                标签
              </Space>
            ),
            children: renderTagManagement(),
          },
        ]}
      />

      {/* 创建/编辑模态框 */}
      <Modal
        title={editingTag ? '编辑标签' : '新建标签'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingTag(null);
          form.resetFields();
        }}
        confirmLoading={createTagMutation.isPending || updateTagMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="标签名称"
            rules={[
              { required: true, message: '请输入标签名称' },
              { max: 50, message: '标签名称不能超过50个字符' },
            ]}
          >
            <Input placeholder="请输入标签名称" />
          </Form.Item>
          <Form.Item 
            name="color" 
            label="标签颜色"
            initialValue="#1890ff"
          >
            <ColorPicker showText />
          </Form.Item>
          {((editingTag && editingTag.isPermanent) || (!editingTag && activeTab === 'permanent')) && (
            <Form.Item
              name="priority"
              label="优先级"
              rules={[
                { required: true, message: '请输入优先级' },
                { type: 'number', min: 0, message: '优先级不能小于0' },
              ]}
              tooltip="数字越小，显示越靠前"
            >
              <Input 
                type="number" 
                placeholder="请输入优先级（数字越小越靠前）" 
                min={0}
              />
            </Form.Item>
          )}
          {!editingTag && (
            <Form.Item
              name="isPermanent"
              label="标签类型"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="类别"
                unCheckedChildren="标签"
                disabled={true}
              />
            </Form.Item>
          )}
          {editingTag && (
            <Form.Item label="标签类型">
              <Tag color={editingTag.isPermanent ? 'green' : 'blue'}>
                {editingTag.isPermanent ? '类别' : '标签'}
              </Tag>
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* 合并标签模态框 */}
      <Modal
        title="合并标签"
        open={isMergeModalVisible}
        onOk={handleMerge}
        onCancel={() => {
          setIsMergeModalVisible(false);
          setMergeSourceId(null);
          mergeForm.resetFields();
        }}
        confirmLoading={mergeTagsMutation.isPending}
      >
        <Form form={mergeForm} layout="vertical">
          <Form.Item label="源标签">
            <Input
              value={tagData?.data?.find(t => t.id === mergeSourceId)?.name}
              disabled
            />
          </Form.Item>
          <Form.Item
            name="targetId"
            label="目标标签"
            rules={[{ required: true, message: '请选择目标标签' }]}
          >
            <Select
              placeholder="请选择要合并到的目标标签"
              showSearch
              filterOption={(input, option) => {
                const children = option?.children as any;
                if (children && typeof children === 'string') {
                  return children.toLowerCase().includes(input.toLowerCase());
                }
                return false;
              }}
            >
              {tagData?.data
                ?.filter(t => t.id !== mergeSourceId)
                .map(tag => (
                  <Option key={tag.id} value={tag.id}>
                    {tag.name} ({tag.useCount} 次使用)
                  </Option>
                ))}
            </Select>
          </Form.Item>
          <Text type="secondary">
            合并后，源标签的所有帖子关联将转移到目标标签，源标签将被删除。
          </Text>
        </Form>
      </Modal>
    </div>
  );
};

export default TagManagement;
