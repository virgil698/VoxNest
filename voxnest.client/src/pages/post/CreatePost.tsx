import React, { useState, useEffect, useCallback } from 'react';
import { Form, Input, Button, Card, message, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { usePostStore } from '../../stores/postStore';
import type { CreatePostRequest } from '../../types/post';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import rehypeSanitize from 'rehype-sanitize';
import { videoEmbedSchema, processAllVideoEmbeds } from '../../utils/videoEmbedConfig';
import '../../styles/components/Post.css';

const { TextArea } = Input;

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { createPost } = usePostStore();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [markdownContent, setMarkdownContent] = useState<string | undefined>('');

  // 优化MDEditor的onChange处理，避免循环引用
  const handleMarkdownChange = useCallback((val: string | undefined) => {
    // 处理视频嵌入优化
    const processedContent = val ? processAllVideoEmbeds(val) : val;
    setMarkdownContent(processedContent);
    // 使用异步更新避免循环引用
    setTimeout(() => {
      form.setFieldValue('content', processedContent);
    }, 0);
  }, [form]);


  // 设置工具栏按钮的中文提示（性能优化版本）
  useEffect(() => {
    const setToolbarTooltips = () => {
      const toolbar = document.querySelector('.w-md-editor-toolbar');
      if (!toolbar) return;
      
      // 强制隐藏所有标题下拉菜单
      const hideHeaderMenus = () => {
        const menus = document.querySelectorAll('.w-md-editor-toolbar-child-list');
        menus.forEach(menu => {
          (menu as HTMLElement).style.display = 'none';
          (menu as HTMLElement).style.visibility = 'hidden';
          (menu as HTMLElement).style.opacity = '0';
          (menu as HTMLElement).style.position = 'absolute';
          (menu as HTMLElement).style.left = '-10000px';
          (menu as HTMLElement).style.top = '-10000px';
          (menu as HTMLElement).style.pointerEvents = 'none';
          (menu as HTMLElement).style.zIndex = '-999';
          
          // 移除可能导致显示的事件监听器
          menu.removeEventListener('mouseenter', () => {});
          menu.removeEventListener('click', () => {});
        });
        
        // 禁用标题按钮的下拉功能
        const headerButtons = document.querySelectorAll('.w-md-editor-toolbar-child:first-child button');
        headerButtons.forEach(button => {
          button.removeAttribute('aria-expanded');
          button.removeAttribute('data-state');
          (button as HTMLElement).onclick = null; // 移除点击事件
        });
      };
      
      // 立即执行和延迟执行隐藏
      hideHeaderMenus();
      setTimeout(hideHeaderMenus, 100);
      
      // 使用更高效的选择器，避免过度查询
      const buttons = toolbar.querySelectorAll('button:not([data-tooltip-set])');
      
      buttons.forEach((button) => {
        let tooltipText = '';
        
        // 简化工具提示逻辑，优先处理常用按钮
        const ariaLabel = button.getAttribute('aria-label');
        if (ariaLabel) {
          if (ariaLabel.includes('bold')) tooltipText = '粗体';
          else if (ariaLabel.includes('italic')) tooltipText = '斜体';
          else if (ariaLabel.includes('header') || ariaLabel.includes('title')) tooltipText = '添加标题';
          else if (ariaLabel.includes('strikethrough')) tooltipText = '删除线';
          else if (ariaLabel.includes('hr')) tooltipText = '分割线';
          else if (ariaLabel.includes('unordered') || ariaLabel.includes('ul')) tooltipText = '无序列表';
          else if (ariaLabel.includes('ordered') || ariaLabel.includes('ol')) tooltipText = '有序列表';
          else if (ariaLabel.includes('link')) tooltipText = '添加链接';
          else if (ariaLabel.includes('quote')) tooltipText = '引用';
          else if (ariaLabel.includes('code')) tooltipText = ariaLabel.includes('block') ? '代码块' : '行内代码';
          else if (ariaLabel.includes('image')) tooltipText = '添加图片';
          else if (ariaLabel.includes('table')) tooltipText = '添加表格';
          else if (ariaLabel.includes('preview')) tooltipText = '预览模式（只显示渲染结果）';
          else if (ariaLabel.includes('edit')) tooltipText = '编辑模式（只显示Markdown源代码）';
          else if (ariaLabel.includes('live')) tooltipText = '分屏模式（左侧代码右侧预览）';
        }
        
        // 特殊处理预览模式按钮（简化版本）
        if (!tooltipText && button.closest('.w-md-editor-toolbar-child')) {
          const parentGroup = button.closest('.w-md-editor-toolbar-child');
          if (parentGroup) {
            const groupButtons = parentGroup.querySelectorAll('button');
            const buttonIndex = Array.from(groupButtons).indexOf(button as HTMLButtonElement);
            
            if (groupButtons.length === 3 && buttonIndex >= 0) {
              const previewModes = [
                '编辑模式（只显示Markdown源代码）',
                '分屏模式（左侧代码右侧预览）',
                '预览模式（只显示渲染结果）'
              ];
              tooltipText = previewModes[buttonIndex] || '';
            }
          }
        }
        
        if (tooltipText) {
          button.setAttribute('data-tooltip', tooltipText);
          button.setAttribute('title', tooltipText);
          button.setAttribute('data-tooltip-set', 'true'); // 标记已设置，避免重复处理
        }
      });
    };

    // 延迟执行以确保MDEditor已经完全渲染
    const timer = setTimeout(setToolbarTooltips, 200);
    
    // 使用更轻量的监听器，只在必要时重新设置提示
    const observer = new MutationObserver((mutations) => {
      // 只在工具栏变化时处理
      const hasToolbarChanges = mutations.some(mutation => {
        const target = mutation.target as Element;
        return target.classList?.contains('w-md-editor-toolbar') || 
               target.querySelector?.('.w-md-editor-toolbar') ||
               target.classList?.contains('w-md-editor-toolbar-child-list');
      });
      
      if (hasToolbarChanges) {
        // 使用requestAnimationFrame优化性能
        requestAnimationFrame(() => {
          setToolbarTooltips();
        });
      }
    });
    
    // 定时强制隐藏菜单（兜底机制）
    const forceHideInterval = setInterval(() => {
      const menus = document.querySelectorAll('.w-md-editor-toolbar-child-list');
      menus.forEach(menu => {
        if ((menu as HTMLElement).style.display !== 'none') {
          (menu as HTMLElement).style.display = 'none';
          (menu as HTMLElement).style.visibility = 'hidden';
          (menu as HTMLElement).style.opacity = '0';
          (menu as HTMLElement).style.position = 'absolute';
          (menu as HTMLElement).style.left = '-10000px';
          (menu as HTMLElement).style.pointerEvents = 'none';
        }
      });
    }, 500); // 每500ms检查一次
    
    const editorContainer = document.querySelector('.w-md-editor');
    if (editorContainer) {
      observer.observe(editorContainer, { 
        childList: true, 
        subtree: true, // 监听子树变化，捕获动态添加的菜单
        attributes: false // 不监听属性变化，减少触发频率
      });
    }

    return () => {
      clearTimeout(timer);
      clearInterval(forceHideInterval);
      observer.disconnect();
    };
  }, [markdownContent]);

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
                  onChange={handleMarkdownChange}
                  preview="edit"
                  hideToolbar={false}
                  height={450}
                  data-color-mode="light"
                  previewOptions={{
                    rehypePlugins: [[rehypeSanitize, videoEmbedSchema]]
                  }}
                  textareaProps={{
                    placeholder: '支持 Markdown 语法和视频嵌入：\n\n# 一级标题\n## 二级标题\n\n**粗体文字** *斜体文字*\n\n- 无序列表\n1. 有序列表\n\n> 引用内容\n\n[链接文字](URL)\n![图片描述](图片URL)\n\n```javascript\n// 代码块\nconsole.log("Hello World!");\n```\n\n🎬 支持视频嵌入：\n\nB站视频：\n<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=883823306&bvid=BV1fK4y1s7Qf&cid=213186693&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>\n\nYouTube视频：\n<iframe width="560" height="315" src="https://www.youtube.com/embed/视频ID" title="YouTube video player" frameborder="0" allowfullscreen></iframe>\n\n让你的帖子更精彩！',
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

            {/* 暂时隐藏分类和标签选择，待数据库中有相应数据后启用 */}
            {/*
            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
              <Form.Item
                name="categoryId"
                label={<span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>分类</span>}
                style={{ flex: 1 }}
              >
                <Select
                  placeholder="选择帖子分类（暂未启用）"
                  disabled
                  allowClear
                  size="large"
                  style={{
                    borderRadius: '12px'
                  }}
                >
                </Select>
              </Form.Item>

              <Form.Item
                name="tagIds"
                label={<span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>标签</span>}
                style={{ flex: 1 }}
              >
                <Select
                  mode="multiple"
                  placeholder="添加相关标签（暂未启用）"
                  disabled
                  allowClear
                  size="large"
                  style={{
                    borderRadius: '12px'
                  }}
                  maxTagCount={5}
                >
                </Select>
              </Form.Item>
            </div>
            */}

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
