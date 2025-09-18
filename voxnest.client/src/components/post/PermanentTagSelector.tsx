import React from 'react';
import { Select, Tag, Typography, Space } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { tagApi, type TagOption } from '../../api/tag';
import { TagsOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface PermanentTagSelectorProps {
  value?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  placeholder?: string;
}

const PermanentTagSelector: React.FC<PermanentTagSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = '请选择分类（常驻标签）',
}) => {
  // 获取常驻标签
  const { data: permanentTags = [], isLoading } = useQuery({
    queryKey: ['permanent-tags'],
    queryFn: async () => {
      const response = await tagApi.getPermanentTags();
      return response.data.data || [];
    },
  });

  // 渲染标签选项
  const renderTagOption = (tag: TagOption) => (
    <div key={tag.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Space>
        <Tag color={tag.color || 'green'}>
          {tag.name}
        </Tag>
        <Text type="secondary">({tag.useCount}次使用)</Text>
      </Space>
    </div>
  );

  return (
    <div>
      {/* 常驻标签选择器 */}
      <Select
        style={{ width: '100%' }}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        loading={isLoading}
        disabled={disabled}
        optionLabelProp="label"
        size="large"
        showSearch
        filterOption={(input, option) => {
          const tag = permanentTags.find(t => t.id === option?.value);
          return tag ? tag.name.toLowerCase().includes(input.toLowerCase()) : false;
        }}
      >
        {permanentTags.map(tag => (
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
      {value && (
        <div style={{ marginTop: 8 }}>
          {(() => {
            const selectedTag = permanentTags.find(t => t.id === value);
            if (!selectedTag) return null;
            return (
              <Tag
                color={selectedTag.color || 'green'}
                style={{ marginBottom: 4 }}
              >
                {selectedTag.name}
              </Tag>
            );
          })()}
        </div>
      )}

      {/* 说明文字 */}
      <div style={{ marginTop: 8 }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          <Space>
            <TagsOutlined />
            <Tag color="green">常驻标签</Tag>
            由管理员创建的分类标签，必须选择一个
          </Space>
        </Text>
      </div>
    </div>
  );
};

export default PermanentTagSelector;
