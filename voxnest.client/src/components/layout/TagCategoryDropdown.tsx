import React from 'react';
import { Button, Space } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface TagCategoryDropdownProps {
  className?: string;
  style?: React.CSSProperties;
}

const TagCategoryDropdown: React.FC<TagCategoryDropdownProps> = ({ className, style }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/tags');
  };

  return (
    <div className={className} style={style}>
      <Button
        type="text"
        onClick={handleClick}
        style={{ 
          color: '#262626',
          fontSize: '15px',
          fontWeight: '500',
          height: '32px',
          border: 'none',
          background: 'transparent'
        }}
      >
        <Space size={4}>
          <AppstoreOutlined />
          分类
        </Space>
      </Button>
    </div>
  );
};

export default TagCategoryDropdown;
