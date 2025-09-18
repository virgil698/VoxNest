import React, { useState, useEffect, useRef } from 'react';
import {
  Select,
  Tag,
  Input,
  Button,
  Space,
  Typography,
  message,
} from 'antd';
import {
  PlusOutlined,
  TagsOutlined,
  CloseOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { tagApi, type TagOption } from '../../api/tag';

const { Text } = Typography;

export interface DynamicTagSelection {
  existingTagIds: number[];
  newDynamicTags: string[];
}

interface DynamicTagSelectorProps {
  value?: DynamicTagSelection;
  onChange?: (value: DynamicTagSelection) => void;
  disabled?: boolean;
  placeholder?: string;
}

const DynamicTagSelector: React.FC<DynamicTagSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = '请选择标签（可选）',
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [isAddingNewTag, setIsAddingNewTag] = useState(false);
  const [selectedTags, setSelectedTags] = useState<TagOption[]>([]);
  const [newDynamicTags, setNewDynamicTags] = useState<string[]>([]);
  
  const inputRef = useRef<any>(null);

  // 获取动态标签
  const { data: dynamicTags = [], isLoading } = useQuery({
    queryKey: ['dynamic-tags'],
    queryFn: async () => {
      const response = await tagApi.getDynamicTags();
      return response.data.data || [];
    },
  });

  // 搜索动态标签
  const { data: searchResults = [] } = useQuery({
    queryKey: ['search-dynamic-tags', searchValue],
    queryFn: async () => {
      if (!searchValue.trim()) return [];
      const response = await tagApi.searchTags(searchValue, 20);
      // 只返回动态标签
      return (response.data.data || []).filter(tag => !tag.isPermanent);
    },
    enabled: !!searchValue.trim(),
  });

  // 当前可选择的标签（搜索结果或全部动态标签）
  const displayTags = searchValue ? searchResults : dynamicTags;

  // 更新选中状态
  useEffect(() => {
    if (value) {
      const existingTags = dynamicTags.filter(tag => 
        value.existingTagIds.includes(tag.id)
      );
      setSelectedTags(existingTags);
      setNewDynamicTags(value.newDynamicTags);
    }
  }, [value, dynamicTags]);

  // 处理标签选择
  const handleTagSelect = (tagId: number) => {
    const tag = displayTags.find(t => t.id === tagId);
    if (!tag) return;

    const isSelected = selectedTags.some(t => t.id === tagId);
    
    let newSelectedTags: TagOption[];
    if (isSelected) {
      newSelectedTags = selectedTags.filter(t => t.id !== tagId);
    } else {
      newSelectedTags = [...selectedTags, tag];
    }
    
    setSelectedTags(newSelectedTags);
    updateValue(newSelectedTags, newDynamicTags);
  };

  // 添加新的动态标签
  const handleAddNewTag = async () => {
    if (!newTagName.trim()) return;

    const tagName = newTagName.trim();
    
    // 检查标签名称长度
    if (tagName.length > 50) {
      message.error('标签名称不能超过50个字符');
      return;
    }

    // 检查标签名称格式（简单验证）
    if (!/^[\u4e00-\u9fa5a-zA-Z0-9\-_]+$/.test(tagName)) {
      message.error('标签名称只能包含中文、英文、数字、短横线和下划线');
      return;
    }

    // 检查标签是否已存在于已选列表中
    if (selectedTags.some(tag => tag.name === tagName)) {
      message.error('标签已在选择列表中');
      return;
    }

    // 检查是否已经在新标签列表中
    if (newDynamicTags.includes(tagName)) {
      message.error('标签已在新建列表中');
      return;
    }

    // 检查是否与现有标签重名
    if (dynamicTags.some(tag => tag.name === tagName)) {
      message.error('标签已存在，请直接选择');
      return;
    }

    const updatedNewTags = [...newDynamicTags, tagName];
    setNewDynamicTags(updatedNewTags);
    setNewTagName('');
    setIsAddingNewTag(false);
    updateValue(selectedTags, updatedNewTags);
    
    message.success('新标签已添加');
  };

  // 删除新动态标签
  const handleRemoveNewTag = (tagName: string) => {
    const updatedNewTags = newDynamicTags.filter(name => name !== tagName);
    setNewDynamicTags(updatedNewTags);
    updateValue(selectedTags, updatedNewTags);
  };

  // 更新值
  const updateValue = (tags: TagOption[], newTags: string[]) => {
    const newValue: DynamicTagSelection = {
      existingTagIds: tags.map(t => t.id),
      newDynamicTags: newTags,
    };
    onChange?.(newValue);
  };

  // 渲染标签选项
  const renderTagOption = (tag: TagOption) => (
    <div key={tag.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Space>
        <Tag color={tag.color || 'blue'}>
          {tag.name}
        </Tag>
        <Text type="secondary">({tag.useCount}次使用)</Text>
      </Space>
    </div>
  );

  return (
    <div>
      {/* 动态标签选择器 */}
      <Select
        mode="multiple"
        style={{ width: '100%' }}
        placeholder={placeholder}
        value={selectedTags.map(t => t.id)}
        onSelect={handleTagSelect}
        onDeselect={handleTagSelect}
        loading={isLoading}
        disabled={disabled}
        onSearch={setSearchValue}
        searchValue={searchValue}
        filterOption={false}
        optionLabelProp="label"
        size="large"
      >
        {displayTags.map(tag => (
          <Select.Option
            key={tag.id}
            value={tag.id}
            label={tag.name}
          >
            {renderTagOption(tag)}
          </Select.Option>
        ))}
      </Select>

      {/* 已选择的标签显示 */}
      <div style={{ marginTop: 8 }}>
        <Space wrap>
          {selectedTags.map(tag => (
            <Tag
              key={tag.id}
              color={tag.color || 'blue'}
              closable={!disabled}
              onClose={() => handleTagSelect(tag.id)}
            >
              {tag.name}
            </Tag>
          ))}
          {newDynamicTags.map(tagName => (
            <Tag
              key={tagName}
              color="orange"
              closable={!disabled}
              onClose={() => handleRemoveNewTag(tagName)}
            >
              {tagName} (新建)
            </Tag>
          ))}
        </Space>
      </div>

      {/* 添加新标签 */}
      {!disabled && (
        <div style={{ marginTop: 12 }}>
          {isAddingNewTag ? (
            <Space>
              <Input
                ref={inputRef}
                size="small"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onPressEnter={handleAddNewTag}
                placeholder="输入新标签名称"
                maxLength={50}
              />
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined />}
                onClick={handleAddNewTag}
                disabled={!newTagName.trim()}
              />
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => {
                  setIsAddingNewTag(false);
                  setNewTagName('');
                }}
              />
            </Space>
          ) : (
            <Button
              type="dashed"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                setIsAddingNewTag(true);
                setTimeout(() => inputRef.current?.focus(), 100);
              }}
            >
              添加新标签
            </Button>
          )}
        </div>
      )}

      {/* 标签类型说明 */}
      <div style={{ marginTop: 12 }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          <Space>
            <TagsOutlined />
            <Tag color="blue">动态标签</Tag>
            用户创建的标签，可选择多个（可选）
          </Space>
        </Text>
        <br />
        <Text type="secondary" style={{ fontSize: '12px' }}>
          <Space>
            <TagsOutlined />
            <Tag color="orange">新建标签</Tag>
            创建帖子时新建的动态标签
          </Space>
        </Text>
      </div>

      {/* 统计信息 */}
      {dynamicTags.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            可用动态标签: {dynamicTags.length} 个
          </Text>
        </div>
      )}
    </div>
  );
};

export default DynamicTagSelector;
