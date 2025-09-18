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
  Modal,
  Form,
  Tooltip,
  Popconfirm,
  Avatar,
  Row,
  Col,
  Divider,
  Typography,
  Empty
} from 'antd';
import {
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EyeOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  MailOutlined
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/lib/table';
import { adminApi, UserStatus } from '../../api/admin';
import type { AdminUser, AdminUserQuery, CreateUser, UpdateUser, PagedResult } from '../../api/admin';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // 表单相关状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // 查询参数
  const [queryParams, setQueryParams] = useState<AdminUserQuery>({
    pageNumber: 1,
    pageSize: 20,
    sortBy: 'CreatedAt',
    sortDirection: 'desc'
  });

  // 获取用户状态文本和颜色
  const getUserStatusTag = (status: UserStatus) => {
    switch (status) {
      case UserStatus.Pending:
        return <Tag color="orange">待验证</Tag>;
      case UserStatus.Active:
        return <Tag color="green">正常</Tag>;
      case UserStatus.Disabled:
        return <Tag color="red">已禁用</Tag>;
      case UserStatus.Deleted:
        return <Tag color="gray">已删除</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  // 加载用户列表
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result: PagedResult<AdminUser> = await adminApi.getUsers(queryParams);
      setUsers(result.data);
      setTotal(result.totalCount);
    } catch (error) {
      message.error('加载用户列表失败');
      console.error('❌ 加载用户错误:', error);
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // 处理搜索
  const handleSearch = (value: string) => {
    setQueryParams(prev => ({
      ...prev,
      pageNumber: 1,
      search: value
    }));
  };

  // 处理表格变化（分页、排序等）
  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: any,
    sorter: any
  ) => {
    setQueryParams(prev => ({
      ...prev,
      pageNumber: pagination.current || 1,
      pageSize: pagination.pageSize || 20,
      sortBy: sorter.field || 'CreatedAt',
      sortDirection: sorter.order === 'ascend' ? 'asc' : 'desc'
    }));
  };

  // 创建用户
  const handleCreateUser = async (values: CreateUser) => {
    try {
      await adminApi.createUser(values);
      message.success('用户创建成功');
      setCreateModalVisible(false);
      createForm.resetFields();
      loadUsers();
    } catch (error: any) {
      message.error(error.response?.data?.message || '创建用户失败');
    }
  };

  // 更新用户
  const handleUpdateUser = async (values: UpdateUser) => {
    if (!currentUser) return;
    
    try {
      await adminApi.updateUser(currentUser.id, values);
      message.success('用户更新成功');
      setEditModalVisible(false);
      editForm.resetFields();
      setCurrentUser(null);
      loadUsers();
    } catch (error: any) {
      message.error(error.response?.data?.message || '更新用户失败');
    }
  };

  // 更新用户状态
  const handleUpdateUserStatus = async (userId: number, status: UserStatus) => {
    try {
      await adminApi.updateUserStatus(userId, { status });
      message.success('用户状态更新成功');
      loadUsers();
    } catch (error) {
      message.error('更新用户状态失败');
    }
  };

  // 删除用户
  const handleDeleteUser = async (userId: number) => {
    try {
      await adminApi.deleteUser(userId);
      message.success('用户删除成功');
      loadUsers();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除用户失败');
    }
  };

  // 查看用户详情
  const handleViewUser = async (userId: number) => {
    try {
      const user = await adminApi.getUser(userId);
      setCurrentUser(user);
      setDetailModalVisible(true);
    } catch (error) {
      message.error('获取用户详情失败');
    }
  };

  // 编辑用户
  const handleEditUser = async (userId: number) => {
    try {
      const user = await adminApi.getUser(userId);
      setCurrentUser(user);
      editForm.setFieldsValue({
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        status: user.status,
        roleIds: [] // 需要从后端获取角色列表
      });
      setEditModalVisible(true);
    } catch (error) {
      message.error('获取用户信息失败');
    }
  };

  // 批量操作：批量更新用户状态
  const handleBatchUpdateStatus = async (status: UserStatus) => {
    const statusText = status === UserStatus.Active ? '激活' : '禁用';
    
    Modal.confirm({
      title: `批量${statusText}用户`,
      content: `确定要${statusText} ${selectedRowKeys.length} 个用户吗？`,
      icon: <ExclamationCircleOutlined />,
      onOk: async () => {
        try {
          const updatePromises = selectedRowKeys.map(userId =>
            adminApi.updateUserStatus(userId as number, { status })
          );
          
          await Promise.all(updatePromises);
          message.success(`批量${statusText}成功！`);
          setSelectedRowKeys([]);
          loadUsers();
        } catch (error) {
          message.error(`批量${statusText}失败`);
        }
      },
    });
  };

  // 批量操作：批量删除用户
  const handleBatchDelete = async () => {
    Modal.confirm({
      title: '批量删除用户',
      content: (
        <div>
          <p>确定要删除 {selectedRowKeys.length} 个用户吗？</p>
          <p style={{ color: '#ff4d4f', fontSize: '14px' }}>
            ⚠️ 此操作不可恢复，请谨慎操作！
          </p>
        </div>
      ),
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const deletePromises = selectedRowKeys.map(userId =>
            adminApi.deleteUser(userId as number)
          );
          
          await Promise.all(deletePromises);
          message.success('批量删除成功！');
          setSelectedRowKeys([]);
          loadUsers();
        } catch (error) {
          message.error('批量删除失败');
        }
      },
    });
  };

  // 表格列定义
  const columns: ColumnsType<AdminUser> = [
    {
      title: '用户信息',
      key: 'userInfo',
      width: 280,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            src={record.avatar}
            size={40}
            icon={<UserOutlined />}
            style={{ 
              backgroundColor: '#1890ff',
              flexShrink: 0
            }}
          >
            {record.displayName?.[0] || record.username[0]}
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Text strong style={{ fontSize: 14 }}>
                {record.displayName || record.username}
              </Text>
              {getUserStatusTag(record.status)}
            </div>
            <div style={{ marginBottom: 2 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <MailOutlined style={{ marginRight: 4, color: '#1890ff' }} />
                {record.email}
              </Text>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                @{record.username}
              </Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      width: 150,
      render: (roles: string[]) => (
        <div>
          {roles.length > 0 ? (
            roles.slice(0, 2).map(role => (
              <Tag key={role} color="blue" style={{ fontSize: 11, margin: '0 4px 4px 0' }}>
                {role}
              </Tag>
            ))
          ) : (
            <Text type="secondary" style={{ fontSize: 11 }}>
              暂无角色
            </Text>
          )}
          {roles.length > 2 && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              +{roles.length - 2}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: '统计信息',
      key: 'stats',
      width: 120,
      render: (_, record) => (
        <div>
          {record.stats ? (
            <>
              <div style={{ marginBottom: 2 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  帖子: {record.stats.postCount}
                </Text>
              </div>
              <div style={{ marginBottom: 2 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  评论: {record.stats.commentCount}
                </Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  等级: {record.stats.level}
                </Text>
              </div>
            </>
          ) : (
            <Text type="secondary" style={{ fontSize: 11 }}>
              暂无数据
            </Text>
          )}
        </div>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 100,
      sorter: true,
      render: (date: string) => (
        <div>
          <div>
            <Text style={{ fontSize: 12 }}>
              {dayjs(date).format('YYYY-MM-DD')}
            </Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {dayjs(date).format('HH:mm')}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 100,
      render: (date: string) => (
        <div>
          {date ? (
            <>
              <div>
                <Text style={{ fontSize: 12 }}>
                  {dayjs(date).format('MM-DD')}
                </Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {dayjs(date).fromNow()}
                </Text>
              </div>
            </>
          ) : (
            <Text type="secondary" style={{ fontSize: 11 }}>
              从未登录
            </Text>
          )}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewUser(record.id)}
            />
          </Tooltip>
          <Tooltip title="编辑用户">
            <Button
              size="small"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => handleEditUser(record.id)}
            />
          </Tooltip>
          {record.status === UserStatus.Active ? (
            <Tooltip title="禁用用户">
              <Popconfirm
                title="确定要禁用此用户吗？"
                onConfirm={() => handleUpdateUserStatus(record.id, UserStatus.Disabled)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  size="small"
                  danger
                  icon={<StopOutlined />}
                />
              </Popconfirm>
            </Tooltip>
          ) : (
            <Tooltip title="激活用户">
              <Popconfirm
                title="确定要激活此用户吗？"
                onConfirm={() => handleUpdateUserStatus(record.id, UserStatus.Active)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                />
              </Popconfirm>
            </Tooltip>
          )}
          <Tooltip title="删除用户">
            <Popconfirm
              title="确定要删除此用户吗？此操作不可恢复！"
              onConfirm={() => handleDeleteUser(record.id)}
              okText="确定"
              cancelText="取消"
              icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>用户管理</Title>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
          管理系统用户，包括创建、编辑、删除和状态管理
        </p>
      </div>

      {/* 工具栏 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Space>
            <Search
              placeholder="搜索用户名、邮箱或显示名"
              allowClear
              enterButton="搜索"
              style={{ width: 320 }}
              onSearch={handleSearch}
              onChange={(e) => {
                // 实时搜索：当输入为空时，清空搜索
                if (!e.target.value.trim()) {
                  handleSearch('');
                }
              }}
              suffix={
                queryParams.search ? (
                  <Tooltip title={`搜索："${queryParams.search}"`}>
                    <span style={{ color: '#1890ff', fontSize: '12px' }}>
                      {users.length} 结果
                    </span>
                  </Tooltip>
                ) : null
              }
            />
            <Select
              placeholder="用户状态"
              allowClear
              style={{ width: 120 }}
              onChange={(value) => setQueryParams(prev => ({ ...prev, status: value, pageNumber: 1 }))}
            >
              <Option value={UserStatus.Pending}>待验证</Option>
              <Option value={UserStatus.Active}>正常</Option>
              <Option value={UserStatus.Disabled}>已禁用</Option>
              <Option value={UserStatus.Deleted}>已删除</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={loadUsers}>
              刷新
            </Button>
            {(queryParams.search || queryParams.status) && (
              <Button
                onClick={() => {
                  setQueryParams({
                    pageNumber: 1,
                    pageSize: 20,
                    sortBy: 'CreatedAt',
                    sortDirection: 'desc'
                  });
                }}
              >
                清除筛选
              </Button>
            )}
          </Space>
        </Col>
        <Col flex="none">
          <Space>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              创建用户
            </Button>
          </Space>
        </Col>
      </Row>

      {/* 批量操作工具栏 */}
      {selectedRowKeys.length > 0 && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            background: '#f0f6ff',
            border: '1px solid #d6e4ff',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ color: '#1890ff', fontWeight: 500 }}>
            已选择 {selectedRowKeys.length} 个用户
          </span>
          <Space>
            <Button
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleBatchUpdateStatus(UserStatus.Active)}
            >
              批量激活
            </Button>
            <Button
              size="small"
              icon={<StopOutlined />}
              onClick={() => handleBatchUpdateStatus(UserStatus.Disabled)}
            >
              批量禁用
            </Button>
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={handleBatchDelete}
            >
              批量删除
            </Button>
            <Button
              size="small"
              onClick={() => setSelectedRowKeys([])}
            >
              取消选择
            </Button>
          </Space>
        </div>
      )}

      {/* 搜索结果状态 */}
      {(queryParams.search || queryParams.status) && (
        <div
          style={{
            marginBottom: 16,
            padding: '8px 12px',
            background: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: 6,
            fontSize: '14px',
            color: '#52c41a'
          }}
        >
          <Space>
            <span>当前筛选条件：</span>
            {queryParams.search && (
              <Tag color="blue">
                搜索：{queryParams.search}
              </Tag>
            )}
            {queryParams.status !== undefined && (
              <Tag color="green">
                状态：{
                  queryParams.status === UserStatus.Pending ? '待验证' :
                  queryParams.status === UserStatus.Active ? '正常' :
                  queryParams.status === UserStatus.Disabled ? '已禁用' :
                  queryParams.status === UserStatus.Deleted ? '已删除' : '未知'
                }
              </Tag>
            )}
            <span>找到 {total} 个用户</span>
          </Space>
        </div>
      )}

      {/* 用户表格 */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={users}
        loading={loading}
        scroll={{ x: 1200 }}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        pagination={{
          current: queryParams.pageNumber,
          pageSize: queryParams.pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `第 ${range[0]}-${range[1]} 项，共 ${total} 项`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        onChange={handleTableChange}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无用户数据"
            />
          ),
        }}
      />

      {/* 创建用户模态框 */}
      <Modal
        title="创建用户"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateUser}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, max: 50, message: '用户名长度为3-50个字符' },
              { pattern: /^[a-zA-Z0-9_-]+$/, message: '用户名只能包含字母、数字、下划线和短横线' }
            ]}
          >
            <Input placeholder="输入用户名" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="输入邮箱地址" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码长度至少6个字符' }
            ]}
          >
            <Input.Password placeholder="输入密码" />
          </Form.Item>

          <Form.Item
            name="displayName"
            label="显示名称"
          >
            <Input placeholder="输入显示名称（可选）" />
          </Form.Item>

          <Form.Item
            name="avatar"
            label="头像URL"
          >
            <Input placeholder="输入头像URL（可选）" />
          </Form.Item>

          <Form.Item
            name="status"
            label="用户状态"
            initialValue={UserStatus.Active}
          >
            <Select>
              <Option value={UserStatus.Pending}>待验证</Option>
              <Option value={UserStatus.Active}>正常</Option>
              <Option value={UserStatus.Disabled}>已禁用</Option>
              <Option value={UserStatus.Deleted}>已删除</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="roleIds"
            label="用户角色"
            initialValue={[]}
          >
            <Select mode="multiple" placeholder="选择用户角色">
              {/* TODO: 从后端获取角色列表 */}
              <Option value={1}>普通用户</Option>
              <Option value={2}>版主</Option>
              <Option value={3}>管理员</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
              <Button onClick={() => {
                setCreateModalVisible(false);
                createForm.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑用户模态框 */}
      <Modal
        title="编辑用户"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          editForm.resetFields();
          setCurrentUser(null);
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateUser}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, max: 50, message: '用户名长度为3-50个字符' },
              { pattern: /^[a-zA-Z0-9_-]+$/, message: '用户名只能包含字母、数字、下划线和短横线' }
            ]}
          >
            <Input placeholder="输入用户名" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="输入邮箱地址" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="新密码"
            help="留空则不修改密码"
          >
            <Input.Password placeholder="输入新密码（可选）" />
          </Form.Item>

          <Form.Item
            name="displayName"
            label="显示名称"
          >
            <Input placeholder="输入显示名称（可选）" />
          </Form.Item>

          <Form.Item
            name="avatar"
            label="头像URL"
          >
            <Input placeholder="输入头像URL（可选）" />
          </Form.Item>

          <Form.Item
            name="status"
            label="用户状态"
          >
            <Select>
              <Option value={UserStatus.Pending}>待验证</Option>
              <Option value={UserStatus.Active}>正常</Option>
              <Option value={UserStatus.Disabled}>已禁用</Option>
              <Option value={UserStatus.Deleted}>已删除</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="roleIds"
            label="用户角色"
          >
            <Select mode="multiple" placeholder="选择用户角色">
              {/* TODO: 从后端获取角色列表 */}
              <Option value={1}>普通用户</Option>
              <Option value={2}>版主</Option>
              <Option value={3}>管理员</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                更新
              </Button>
              <Button onClick={() => {
                setEditModalVisible(false);
                editForm.resetFields();
                setCurrentUser(null);
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 用户详情模态框 */}
      <Modal
        title="用户详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setCurrentUser(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setDetailModalVisible(false);
            setCurrentUser(null);
          }}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {currentUser && (
          <div>
            <Row gutter={16}>
              <Col span={6}>
                <Avatar size={64} src={currentUser.avatar}>
                  {currentUser.displayName?.[0] || currentUser.username[0]}
                </Avatar>
              </Col>
              <Col span={18}>
                <h3>{currentUser.displayName || currentUser.username}</h3>
                <p style={{ color: '#666' }}>@{currentUser.username}</p>
                <Space>
                  {getUserStatusTag(currentUser.status)}
                  {currentUser.roles.map(role => (
                    <Tag key={role} color="blue">{role}</Tag>
                  ))}
                </Space>
              </Col>
            </Row>
            
            <Divider />
            
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div>
                  <strong>邮箱：</strong>
                  <br />
                  {currentUser.email}
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <strong>注册时间：</strong>
                  <br />
                  {dayjs(currentUser.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <strong>最后登录：</strong>
                  <br />
                  {currentUser.lastLoginAt 
                    ? dayjs(currentUser.lastLoginAt).format('YYYY-MM-DD HH:mm:ss')
                    : '从未登录'
                  }
                </div>
              </Col>
              {currentUser.stats && (
                <Col span={12}>
                  <div>
                    <strong>用户统计：</strong>
                    <br />
                    等级 {currentUser.stats.level} | 积分 {currentUser.stats.score}
                    <br />
                    帖子 {currentUser.stats.postCount} | 评论 {currentUser.stats.commentCount}
                  </div>
                </Col>
              )}
            </Row>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default UserManagement;
