import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Select, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { usePostStore } from '../../stores/postStore';
import type { CreatePostRequest } from '../../types/post';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import rehypeSanitize from 'rehype-sanitize';

const { TextArea } = Input;

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { createPost } = usePostStore();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [markdownContent, setMarkdownContent] = useState<string | undefined>('');

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
    <div className="voxnest-gradient-bg" style={{ minHeight: '100vh', padding: '24px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        {/* 顶部操作栏 */}
        <div style={{ 
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '16px 24px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
          style={{
            height: '40px',
            borderRadius: '10px',
            padding: '0 20px',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          返回
        </Button>
        
        <Space>
          <Button 
            onClick={handleBack}
            style={{
              height: '40px',
              borderRadius: '10px',
              padding: '0 20px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            取消
          </Button>
          <Button 
            type="primary" 
            icon={<SaveOutlined />}
            loading={isSubmitting}
            onClick={() => form.submit()}
            style={{
              height: '40px',
              borderRadius: '10px',
              padding: '0 20px',
              fontSize: '14px',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              border: 'none',
              boxShadow: '0 4px 16px rgba(79, 70, 229, 0.3)'
            }}
          >
            发布帖子
          </Button>
        </Space>
      </div>

        {/* 页面标题 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            borderRadius: '20px',
            color: 'white',
            fontSize: '18px',
            fontWeight: '600',
            boxShadow: '0 4px 20px rgba(79, 70, 229, 0.3)'
          }}>
            <SaveOutlined style={{ marginRight: '8px', fontSize: '20px' }} />
            发布新帖子
          </div>
        </div>

        {/* 发帖表单 */}
        <Card className="voxnest-post-card" style={{ 
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          backdropFilter: 'blur(20px)',
          background: 'rgba(255, 255, 255, 0.98)'
        }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              tagIds: [],
            }}
            style={{ padding: '8px' }}
          >
            <Form.Item
              name="title"
              label={<span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>标题</span>}
              rules={[
                { required: true, message: '请输入帖子标题' },
                { max: 200, message: '标题长度不能超过200个字符' },
              ]}
            >
              <Input 
                placeholder="请输入一个吸引人的标题..."
                size="large"
                showCount
                maxLength={200}
                style={{
                  height: '52px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  border: '2px solid var(--border-color)',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary-color)';
                  e.target.style.boxShadow = '0 0 0 4px rgba(79, 70, 229, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-color)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </Form.Item>

            <Form.Item
              name="summary"
              label={<span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>摘要</span>}
              rules={[
                { max: 500, message: '摘要长度不能超过500个字符' },
              ]}
            >
              <TextArea
                placeholder="请输入帖子摘要，让读者快速了解内容要点（可选）"
                rows={3}
                showCount
                maxLength={500}
                style={{
                  borderRadius: '12px',
                  fontSize: '15px',
                  border: '2px solid var(--border-color)',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary-color)';
                  e.target.style.boxShadow = '0 0 0 4px rgba(79, 70, 229, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-color)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </Form.Item>

            <Form.Item
              name="content"
              label={<span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>内容</span>}
              rules={[
                { required: true, message: '请输入帖子内容' },
              ]}
            >
              <div style={{
                border: '2px solid var(--border-color)',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                background: 'white'
              }}>
                <MDEditor
                  value={markdownContent}
                  onChange={(val) => {
                    setMarkdownContent(val);
                    form.setFieldValue('content', val);
                  }}
                  preview="edit"
                  hideToolbar={false}
                  height={450}
                  data-color-mode="light"
                  previewOptions={{
                    rehypePlugins: [[rehypeSanitize]]
                  }}
                  textareaProps={{
                    placeholder: '支持 Markdown 语法：\n\n# 一级标题\n## 二级标题\n\n**粗体文字** *斜体文字*\n\n- 无序列表\n1. 有序列表\n\n> 引用内容\n\n[链接文字](URL)\n![图片描述](图片URL)\n\n```javascript\n// 代码块\nconsole.log("Hello World!");\n```\n\n让你的帖子更精彩！',
                    style: {
                      fontSize: '15px',
                      lineHeight: '1.6',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }
                  }}
                  style={{
                    backgroundColor: 'transparent'
                  }}
                />
              </div>
            </Form.Item>

            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
              <Form.Item
                name="categoryId"
                label={<span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>分类</span>}
                style={{ flex: 1 }}
              >
                <Select
                  placeholder="选择帖子分类"
                  allowClear
                  size="large"
                  style={{
                    borderRadius: '12px'
                  }}
                >
                  <Select.Option value="tech">💻 技术讨论</Select.Option>
                  <Select.Option value="general">💬 综合讨论</Select.Option>
                  <Select.Option value="news">📰 新闻资讯</Select.Option>
                  <Select.Option value="qa">❓ 问答求助</Select.Option>
                  <Select.Option value="share">📚 经验分享</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="tagIds"
                label={<span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>标签</span>}
                style={{ flex: 1 }}
              >
                <Select
                  mode="multiple"
                  placeholder="添加相关标签"
                  allowClear
                  size="large"
                  style={{
                    borderRadius: '12px'
                  }}
                  maxTagCount={5}
                >
                  <Select.Option value="javascript">JavaScript</Select.Option>
                  <Select.Option value="react">React</Select.Option>
                  <Select.Option value="nodejs">Node.js</Select.Option>
                  <Select.Option value="css">CSS</Select.Option>
                  <Select.Option value="html">HTML</Select.Option>
                  <Select.Option value="python">Python</Select.Option>
                  <Select.Option value="java">Java</Select.Option>
                  <Select.Option value="csharp">C#</Select.Option>
                  <Select.Option value="frontend">前端开发</Select.Option>
                  <Select.Option value="backend">后端开发</Select.Option>
                  <Select.Option value="mobile">移动开发</Select.Option>
                  <Select.Option value="database">数据库</Select.Option>
                  <Select.Option value="devops">DevOps</Select.Option>
                  <Select.Option value="ai">人工智能</Select.Option>
                  <Select.Option value="ml">机器学习</Select.Option>
                </Select>
              </Form.Item>
            </div>

            {/* 发布提示 */}
            <div style={{
              background: 'linear-gradient(135deg, #EBF8FF 0%, #F0FDF4 100%)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '18px', marginRight: '8px' }}>💡</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>发帖小贴士</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                <li>写一个清晰、有吸引力的标题</li>
                <li>使用合适的分类和标签，方便其他用户发现</li>
                <li>内容支持 Markdown 语法，让排版更美观</li>
                <li>保持友善和尊重，共建和谐的交流环境</li>
              </ul>
            </div>

            {/* 隐藏的提交按钮，由顶部按钮触发 */}
            <Form.Item style={{ display: 'none' }}>
              <Button htmlType="submit" />
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default CreatePost;
