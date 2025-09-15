import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Space,
  Button,
  Select,
  Input,
  DatePicker,
  Tag,
  Modal,
  Statistic,
  Row,
  Col,
  message,
  Tooltip,
  Popconfirm
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EyeOutlined,
  ClearOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { LogApi, LogLevel, LogCategory } from '../../api/log';
import type { LogEntry, LogQueryParams, LogStats } from '../../api/log';
import type { TableProps } from 'antd';
import { useLogger } from '../../hooks/useLogger';
import dayjs, { type Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const LogManagement: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number) => `共 ${total} 条记录`
  });

  // 查询参数
  const [queryParams, setQueryParams] = useState<LogQueryParams>({
    pageNumber: 1,
    pageSize: 20,
    sortBy: 'CreatedAt',
    sortDirection: 'desc'
  });

  const logger = useLogger('LogManagement');

  // 日志级别颜色映射
  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.Debug: return 'default';
      case LogLevel.Info: return 'blue';
      case LogLevel.Warning: return 'orange';
      case LogLevel.Error: return 'red';
      case LogLevel.Fatal: return 'magenta';
      default: return 'default';
    }
  };

  // 日志分类颜色映射
  const getCategoryColor = (category: LogCategory) => {
    switch (category) {
      case LogCategory.System: return 'geekblue';
      case LogCategory.Authentication: return 'green';
      case LogCategory.Api: return 'cyan';
      case LogCategory.Database: return 'purple';
      case LogCategory.UserAction: return 'blue';
      case LogCategory.Error: return 'red';
      case LogCategory.Performance: return 'orange';
      case LogCategory.Security: return 'volcano';
      case LogCategory.Frontend: return 'lime';
      default: return 'default';
    }
  };

  // 加载日志列表
  const loadLogs = useCallback(async (params?: LogQueryParams) => {
    setLoading(true);
    try {
      const finalParams = { ...queryParams, ...params };
      const result = await LogApi.getLogs(finalParams);
      
      setLogs(result.items);
      setPagination(prev => ({
        ...prev,
        current: result.pageNumber,
        pageSize: result.pageSize,
        total: result.totalCount
      }));

      logger.debug('Loaded logs', `Loaded ${result.items.length} logs`);
    } catch (error) {
      message.error('加载日志列表失败');
      logger.error('Failed to load logs', error as Error);
    } finally {
      setLoading(false);
    }
  }, [queryParams, logger]);

  // 加载统计信息
  const loadStats = useCallback(async () => {
    try {
      const result = await LogApi.getLogStats();
      setStats(result);
    } catch (error) {
      message.error('加载统计信息失败');
      logger.error('Failed to load log stats', error as Error);
    }
  }, [logger]);

  // 初始化加载（避免频繁重载）
  useEffect(() => {
    // 只在日志列表为空时加载
    if (logs.length === 0) {
      loadLogs();
      loadStats();
    }
  }, []); // 移除依赖，避免循环加载

  // 处理查询参数变化
  const handleQueryChange = (key: keyof LogQueryParams, value: string | number | [string, string] | undefined) => {
    const newParams = { ...queryParams, [key]: value, pageNumber: 1 };
    setQueryParams(newParams);
    loadLogs(newParams);
  };

  // 处理表格变化
  const handleTableChange = (pagination: TableProps<LogEntry>['pagination'], _filters: Record<string, unknown>, _sorter: unknown) => {
    const newParams = {
      ...queryParams,
      pageNumber: pagination && typeof pagination === 'object' ? (pagination as { current?: number }).current || 1 : 1,
      pageSize: pagination && typeof pagination === 'object' ? (pagination as { pageSize?: number }).pageSize || 20 : 20
    };

    if (_sorter && typeof _sorter === 'object' && _sorter !== null && 'field' in _sorter) {
      const sorter = _sorter as { field?: string; order?: 'ascend' | 'descend' };
      newParams.sortBy = sorter.field;
      newParams.sortDirection = sorter.order === 'ascend' ? 'asc' : 'desc';
    }

    setQueryParams(newParams);
    loadLogs(newParams);
  };

  // 查看日志详情
  const viewLogDetail = async (log: LogEntry) => {
    try {
      const detail = await LogApi.getLogById(log.id);
      setSelectedLog(detail);
      setDetailModalVisible(true);
      logger.logUserAction('View log detail', `Log ID: ${log.id}`);
    } catch (error) {
      message.error('获取日志详情失败');
      logger.error('Failed to get log detail', error as Error);
    }
  };

  // 批量删除日志
  const batchDeleteLogs = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的日志');
      return;
    }

    try {
      const ids = selectedRowKeys.map(key => Number(key));
      const deletedCount = await LogApi.deleteLogs(ids);
      message.success(`成功删除 ${deletedCount} 条日志`);
      setSelectedRowKeys([]);
      loadLogs();
      loadStats();
      logger.logUserAction('Batch delete logs', `Deleted ${deletedCount} logs`);
    } catch (error) {
      message.error('删除日志失败');
      logger.error('Failed to delete logs', error as Error);
    }
  };

  // 清理过期日志
  const cleanupLogs = async (days: number) => {
    try {
      const deletedCount = await LogApi.cleanupLogs(days);
      message.success(`成功清理 ${deletedCount} 条过期日志`);
      loadLogs();
      loadStats();
      logger.logUserAction('Cleanup logs', `Cleaned up logs older than ${days} days`);
    } catch (error) {
      message.error('清理日志失败');
      logger.error('Failed to cleanup logs', error as Error);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      sorter: true,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '级别',
      dataIndex: 'levelName',
      key: 'level',
      width: 80,
      sorter: true,
      render: (text: string, record: LogEntry) => (
        <Tag color={getLevelColor(record.level)}>{text}</Tag>
      )
    },
    {
      title: '分类',
      dataIndex: 'categoryName',
      key: 'category',
      width: 100,
      sorter: true,
      render: (text: string, record: LogEntry) => (
        <Tag color={getCategoryColor(record.category)}>{text}</Tag>
      )
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      )
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 120,
      ellipsis: true
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      width: 100,
      ellipsis: true
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 120
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_text: unknown, record: LogEntry) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />}
          onClick={() => viewLogDetail(record)}
        >
          详情
        </Button>
      )
    }
  ];

  return (
    <div>
      {/* 统计信息 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic title="总日志数" value={stats.totalCount} prefix={<BarChartOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="今日日志" value={stats.todayCount} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="错误日志" 
                value={stats.levelCounts[LogLevel.Error] || 0} 
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="警告日志" 
                value={stats.levelCounts[LogLevel.Warning] || 0}
                valueStyle={{ color: '#d48806' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 查询和操作区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Select
              placeholder="选择日志级别"
              allowClear
              style={{ width: '100%' }}
              onChange={(value: string) => handleQueryChange('level', value)}
            >
              <Option value={LogLevel.Debug}>Debug</Option>
              <Option value={LogLevel.Info}>Info</Option>
              <Option value={LogLevel.Warning}>Warning</Option>
              <Option value={LogLevel.Error}>Error</Option>
              <Option value={LogLevel.Fatal}>Fatal</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Select
              placeholder="选择日志分类"
              allowClear
              style={{ width: '100%' }}
              onChange={(value: string) => handleQueryChange('category', value)}
            >
              <Option value={LogCategory.System}>System</Option>
              <Option value={LogCategory.Authentication}>Authentication</Option>
              <Option value={LogCategory.Api}>API</Option>
              <Option value={LogCategory.Database}>Database</Option>
              <Option value={LogCategory.UserAction}>UserAction</Option>
              <Option value={LogCategory.Error}>Error</Option>
              <Option value={LogCategory.Performance}>Performance</Option>
              <Option value={LogCategory.Security}>Security</Option>
              <Option value={LogCategory.Frontend}>Frontend</Option>
            </Select>
          </Col>
          <Col span={6}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={(dates: [Dayjs | null, Dayjs | null] | null) => {
                if (dates && dates.length === 2) {
                  handleQueryChange('startDate', dates[0]?.toISOString());
                  handleQueryChange('endDate', dates[1]?.toISOString());
                } else {
                  handleQueryChange('startDate', undefined);
                  handleQueryChange('endDate', undefined);
                }
              }}
            />
          </Col>
          <Col span={6}>
            <Input
              placeholder="搜索日志内容"
              allowClear
              suffix={<SearchOutlined />}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQueryChange('search', e.target.value)}
              onPressEnter={() => loadLogs(queryParams)}
            />
          </Col>
        </Row>
        
        <Space style={{ marginTop: 16 }}>
          <Button icon={<ReloadOutlined />} onClick={() => loadLogs()}>
            刷新
          </Button>
          <Popconfirm
            title="确定要删除选中的日志吗？"
            onConfirm={batchDeleteLogs}
            disabled={selectedRowKeys.length === 0}
          >
            <Button 
              icon={<DeleteOutlined />} 
              danger
              disabled={selectedRowKeys.length === 0}
            >
              批量删除
            </Button>
          </Popconfirm>
          <Popconfirm
            title="确定要清理30天前的日志吗？"
            onConfirm={() => cleanupLogs(30)}
          >
            <Button icon={<ClearOutlined />}>
              清理过期日志
            </Button>
          </Popconfirm>
        </Space>
      </Card>

      {/* 日志表格 */}
      <Card>
        <Table
          dataSource={logs}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys
          }}
          size="small"
        />
      </Card>

      {/* 日志详情模态框 */}
      <Modal
        title="日志详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedLog && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <p><strong>ID:</strong> {selectedLog.id}</p>
                <p><strong>级别:</strong> <Tag color={getLevelColor(selectedLog.level)}>{selectedLog.levelName}</Tag></p>
                <p><strong>分类:</strong> <Tag color={getCategoryColor(selectedLog.category)}>{selectedLog.categoryName}</Tag></p>
                <p><strong>时间:</strong> {dayjs(selectedLog.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
              </Col>
              <Col span={12}>
                <p><strong>来源:</strong> {selectedLog.source || 'N/A'}</p>
                <p><strong>用户:</strong> {selectedLog.username || 'N/A'}</p>
                <p><strong>IP地址:</strong> {selectedLog.ipAddress || 'N/A'}</p>
                <p><strong>状态码:</strong> {selectedLog.statusCode || 'N/A'}</p>
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              <p><strong>消息:</strong></p>
              <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                {selectedLog.message}
              </div>
            </div>
            {selectedLog.details && (
              <div style={{ marginTop: 16 }}>
                <p><strong>详细信息:</strong></p>
                <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, maxHeight: 200, overflow: 'auto' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{selectedLog.details}</pre>
                </div>
              </div>
            )}
            {selectedLog.exception && (
              <div style={{ marginTop: 16 }}>
                <p><strong>异常信息:</strong></p>
                <div style={{ background: '#fff2f0', padding: 8, borderRadius: 4, maxHeight: 300, overflow: 'auto' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#a8071a' }}>{selectedLog.exception}</pre>
                </div>
              </div>
            )}
            {selectedLog.metadata && (
              <div style={{ marginTop: 16 }}>
                <p><strong>元数据:</strong></p>
                <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, maxHeight: 200, overflow: 'auto' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{selectedLog.metadata}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LogManagement;
