import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Select, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { usePostStore } from '../../stores/postStore';
import type { CreatePostRequest } from '../../types/post';

const { TextArea } = Input;

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { createPost } = usePostStore();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: CreatePostRequest) => {
    try {
      setIsSubmitting(true);
      const post = await createPost(values);
      message.success('帖子发布成功！');
      navigate(`/posts/${post.id}`);
    } catch (error: any) {
      message.error(error.message || '发布帖子失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div>
      {/* 顶部操作栏 */}
      <div style={{ 
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
        >
          返回
        </Button>
        
        <Space>
          <Button onClick={handleBack}>
            取消
          </Button>
          <Button 
            type="primary" 
            icon={<SaveOutlined />}
            loading={isSubmitting}
            onClick={() => form.submit()}
          >
            发布帖子
          </Button>
        </Space>
      </div>

      {/* 发帖表单 */}
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            tagIds: [],
          }}
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[
              { required: true, message: '请输入帖子标题' },
              { max: 200, message: '标题长度不能超过200个字符' },
            ]}
          >
            <Input 
              placeholder="请输入帖子标题"
              size="large"
              showCount
              maxLength={200}
            />
          </Form.Item>

          <Form.Item
            name="summary"
            label="摘要"
            rules={[
              { max: 500, message: '摘要长度不能超过500个字符' },
            ]}
          >
            <TextArea
              placeholder="请输入帖子摘要（可选）"
              rows={3}
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            name="content"
            label="内容"
            rules={[
              { required: true, message: '请输入帖子内容' },
            ]}
          >
            <TextArea
              placeholder="请输入帖子内容"
              rows={12}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="categoryId"
            label="分类"
          >
            <Select
              placeholder="请选择分类（可选）"
              allowClear
            >
              {/* 这里可以添加分类选项，暂时留空 */}
            </Select>
          </Form.Item>

          <Form.Item
            name="tagIds"
            label="标签"
          >
            <Select
              mode="multiple"
              placeholder="请选择标签（可选）"
              allowClear
            >
              {/* 这里可以添加标签选项，暂时留空 */}
            </Select>
          </Form.Item>

          {/* 隐藏的提交按钮，由顶部按钮触发 */}
          <Form.Item style={{ display: 'none' }}>
            <Button htmlType="submit" />
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreatePost;
