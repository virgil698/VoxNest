import React, { useEffect, useState } from 'react';
import { 
  Input,
  Card,
  Typography,
  Space,
  Select,
  Button,
  Row,
  Col,
  Checkbox,
  DatePicker,
  List,
  Avatar,
  Tag,
  Spin,
  Empty,
  Divider
} from 'antd';
import { 
  SearchOutlined,
  FilterOutlined,
  UserOutlined,
  DownOutlined,
  UpOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSearchState, useSearch, useSearchableCategories, useSearchHighlight } from '../hooks/useSearch';
import dayjs from 'dayjs';
import '../styles/pages/Search.css';

const { Title, Text } = Typography;
const { Option } = Select;

const Search: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const {
    searchQuery,
    setSearchQuery,
    filters,
    updateFilter
  } = useSearchState();
  
  const { data: searchData, isLoading, error } = useSearch(searchQuery, filters, {
    enabled: !!searchQuery.trim()
  }) as { data: any; isLoading: boolean; error: any };
  
  const { data: categories } = useSearchableCategories();
  const { highlightText } = useSearchHighlight();

  // 从URL参数获取搜索查询
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q && q !== searchQuery) {
      setSearchQuery(q);
    }
  }, [location.search, searchQuery, setSearchQuery]);


  const renderSearchResult = (item: any) => (
    <List.Item 
      key={item.id}
      style={{ 
        padding: '16px 0',
        borderBottom: '1px solid #f0f0f0'
      }}
    >
      <List.Item.Meta
        avatar={
          <Avatar 
            src={item.author.avatar} 
            icon={<UserOutlined />}
            size={40}
          />
        }
        title={
          <div>
            <a 
              href={`/posts/${item.id}`}
              style={{ 
                fontSize: '16px', 
                fontWeight: '500',
                color: '#1890ff',
                textDecoration: 'none'
              }}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/posts/${item.id}`);
              }}
            >
              {highlightText(item.title, searchQuery)}
            </a>
            <div style={{ marginTop: '4px' }}>
              {item.category && (
                <Tag color={item.category.color} style={{ marginRight: '8px' }}>
                  {item.category.name}
                </Tag>
              )}
              {item.tags?.map((tag: any) => (
                <Tag key={typeof tag === 'string' ? tag : tag.name} style={{ marginRight: '4px' }}>
                  {highlightText(typeof tag === 'string' ? tag : tag.name, searchQuery)}
                </Tag>
              ))}
            </div>
          </div>
        }
        description={
          <div>
            <div style={{ color: '#666', marginBottom: '8px' }}>
              {highlightText(item.content || item.excerpt || '', searchQuery)}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#999',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span>@{item.author.username}</span>
              <span>{dayjs(item.createdAt).format('YYYY年MM月DD日')}</span>
              {item.replyCount !== undefined && (
                <span>{item.replyCount} 回复</span>
              )}
              {item.viewCount !== undefined && (
                <span>{item.viewCount} 查看</span>
              )}
              {item.likeCount !== undefined && (
                <span>{item.likeCount} 点赞</span>
              )}
            </div>
          </div>
        }
      />
    </List.Item>
  );

  return (
    <div className="search-page-container">
      <div className="search-page-content">
        {/* 页面标题 */}
        <div className="search-page-header">
          <Title level={2} className="search-page-title">
            <SearchOutlined /> 搜索
          </Title>
        </div>

        {/* 搜索控制区域 */}
        <Card className="search-control-card">
          <div className="search-control-container">
            <div className="search-control-info">
              <Text type="secondary">
                使用上方搜索框输入关键词，或使用下方高级筛选器精确搜索
              </Text>
            </div>
            <div className="search-control-options">
              <Space size="middle">
                <div className="search-type-wrapper">
                  <Text className="search-type-label">搜索范围：</Text>
                  <Select
                    value={filters.searchIn}
                    onChange={(value) => updateFilter('searchIn', value)}
                    className="search-type-select"
                    size="middle"
                    suffixIcon={<DownOutlined />}
                  >
                    <Option value="topics_posts">话题/帖子</Option>
                    <Option value="categories_tags">类别/标签</Option>
                    <Option value="users">用户</Option>
                  </Select>
                </div>
                <Button
                  type={showAdvancedFilters ? "default" : "primary"}
                  icon={<FilterOutlined />}
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="toggle-filters-btn"
                >
                  {showAdvancedFilters ? '收起筛选器' : '展开高级筛选器'}
                  {showAdvancedFilters ? <UpOutlined /> : <DownOutlined />}
                </Button>
              </Space>
            </div>
          </div>
        </Card>

        {/* 高级筛选器 */}
        {showAdvancedFilters && (
          <Card className="search-filters-card">
            <div className="search-filters-header">
              <Title level={4} className="search-filters-title">
                <FilterOutlined /> 高级筛选器
              </Title>
            </div>
            
            <Row gutter={[24, 16]}>
              {/* 左列 */}
              <Col xs={24} md={12}>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  {/* 类别筛选 */}
                  <div className="filter-group">
                    <Text className="filter-label">类别</Text>
                    <Select
                      placeholder="所有类别"
                      style={{ width: '100%' }}
                      allowClear
                      value={filters.category}
                      onChange={(value) => updateFilter('category', value)}
                      className="filter-select"
                    >
                      {categories
                        ?.sort((a, b) => (a.priority || 0) - (b.priority || 0)) // 按优先级排序，数字越小越靠前
                        ?.map(category => (
                        <Option key={category.id} value={category.id}>
                          {category.name}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  {/* 标签筛选 */}
                  <div className="filter-group">
                    <Text className="filter-label">标签或标签组</Text>
                    <Select
                      mode="multiple"
                      placeholder="选择..."
                      style={{ width: '100%' }}
                      allowClear
                      value={filters.tags}
                      onChange={(value) => updateFilter('tags', value)}
                      className="filter-select"
                    >
                      {/* 这里应该从API获取标签列表 */}
                      <Option value="javascript">JavaScript</Option>
                      <Option value="react">React</Option>
                      <Option value="nodejs">Node.js</Option>
                      <Option value="typescript">TypeScript</Option>
                    </Select>
                  </div>

                  {/* 发帖人筛选 */}
                  <div className="filter-group">
                    <Text className="filter-label">发帖人</Text>
                    <Input
                      placeholder="选择..."
                      value={filters.author}
                      onChange={(e) => updateFilter('author', e.target.value)}
                      className="filter-input"
                      prefix={<UserOutlined />}
                    />
                  </div>
                </Space>
              </Col>

              {/* 右列 */}
              <Col xs={24} md={12}>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  {/* 发布时间 */}
                  <div className="filter-group">
                    <Text className="filter-label">发布时间</Text>
                    <Select
                      placeholder="早于"
                      style={{ width: '100%' }}
                      allowClear
                      className="filter-select"
                    >
                      <Option value="1">1天前</Option>
                      <Option value="7">1周前</Option>
                      <Option value="30">1个月前</Option>
                      <Option value="90">3个月前</Option>
                      <Option value="365">1年前</Option>
                    </Select>
                    <DatePicker
                      style={{ width: '100%', marginTop: '8px' }}
                      placeholder="yyyy/mm/dd"
                      format="YYYY/MM/DD"
                    />
                  </div>

                  {/* 搜索选项 */}
                  <div className="filter-group">
                    <Text className="filter-label">仅在话题/帖子中搜索...</Text>
                    <div className="filter-checkboxes">
                      <Checkbox>仅在标题中搜索</Checkbox>
                      <Checkbox>我赞过</Checkbox>
                      <Checkbox>在我看过的话题中</Checkbox>
                      <Checkbox>我赞过</Checkbox>
                    </div>
                  </div>

                  {/* 在意选择 */}
                  <div className="filter-group">
                    <Text className="filter-label">在意</Text>
                    <Select
                      placeholder="任意"
                      style={{ width: '100%' }}
                      allowClear
                      className="filter-select"
                    >
                      <Option value="watching">关注</Option>
                      <Option value="tracking">跟踪</Option>
                      <Option value="normal">普通</Option>
                      <Option value="muted">静音</Option>
                    </Select>
                  </div>
                </Space>
              </Col>
            </Row>

            <Divider />

            {/* 底部选项 */}
            <div className="search-bottom-options">
              <Checkbox>
                🧠 按"搜索"开始使用 AI 搜索结果
              </Checkbox>
              <Text type="secondary" style={{ marginLeft: '8px', fontSize: '12px' }}>
                启用后将使用AI技术优化搜索结果
              </Text>
            </div>
          </Card>
        )}

        {/* 搜索结果统计 */}
        {searchQuery && (
          <div className="search-results-header">
            <Title level={4} style={{ margin: 0 }}>
              {isLoading ? '搜索中...' : `${searchData?.totalCount || 0}+ 条与"${searchQuery}"有关的结果`}
            </Title>
            <Select
              value={filters.sortBy}
              onChange={(value) => updateFilter('sortBy', value)}
              style={{ width: 140 }}
              className="search-sort-select"
            >
              <Option value="relevance">相关性</Option>
              <Option value="latest_post">最新回复</Option>
              <Option value="latest_topic">最新话题</Option>
              <Option value="most_liked">最多点赞</Option>
              <Option value="most_viewed">最多查看</Option>
            </Select>
          </div>
        )}

        {/* 搜索结果 */}
        <Card className="search-results-card">
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px', color: '#666' }}>正在搜索...</div>
            </div>
          ) : error ? (
            <Empty 
              description="搜索时发生错误，请稍后重试"
              style={{ padding: '60px' }}
            />
          ) : searchData?.results && searchData.results.length > 0 ? (
            <List
              dataSource={searchData.results}
              renderItem={renderSearchResult}
              style={{ border: 'none' }}
              pagination={{
                total: searchData.totalCount,
                pageSize: 10,
                showSizeChanger: false,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} 共 ${total} 条`
              }}
            />
          ) : searchQuery ? (
            <Empty 
              description={`未找到与"${searchQuery}"相关的结果`}
              style={{ padding: '60px' }}
            />
          ) : (
            <div className="search-empty-state">
              <SearchOutlined />
              <div className="search-empty-text">输入关键词开始搜索</div>
              <div className="search-empty-hint">
                您可以搜索话题、帖子、用户或标签
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Search;
