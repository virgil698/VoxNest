import React, { useState, useEffect, useCallback } from 'react';
import { Form, Input, Button, Card, message, Space, Modal, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { Video } from 'lucide-react';
import { usePostStore } from '../../stores/postStore';
import type { CreatePostRequest } from '../../types/post';
import { MdEditor } from 'md-editor-rt';
import 'md-editor-rt/lib/style.css';
import { processVideoMarkdown } from '../../utils/videoEmbedConfig';
import PermanentTagSelector from '../../components/post/PermanentTagSelector';
import DynamicTagSelector, { type DynamicTagSelection } from '../../components/post/DynamicTagSelector';
import { tagApi } from '../../api/tag';
import '../../styles/components/Post.css';

const { TextArea } = Input;

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { createPost } = usePostStore();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [markdownContent, setMarkdownContent] = useState<string | undefined>('');
  
  // 视频插入模态框相关状态
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [videoForm] = Form.useForm();
  const [videoSource, setVideoSource] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');

  // 自定义视频插入工具栏组件
  const VideoToolbar: React.FC = () => {
    return (
      <button
        type="button"
        className="w-md-editor-toolbar-item"
        title="插入视频"
        aria-label="insert video"
        onClick={handleVideoInsert}
      >
        <Video size={14} />
      </button>
    );
  };

  // 优化MDEditor的onChange处理，避免循环引用
  const handleMarkdownChange = useCallback((val: string | undefined) => {
    // 在编辑器中保持原始的 [!video](url) 格式，不转换为 iframe
    // 只在预览时进行转换，确保存储的内容是安全的
    setMarkdownContent(val);
    // 使用异步更新避免循环引用
    setTimeout(() => {
      form.setFieldValue('content', val);
    }, 0);
  }, [form]);

  // 处理视频插入
  const handleVideoInsert = () => {
    setVideoModalVisible(true);
  };

  // 确认插入视频
  const handleVideoConfirm = () => {
    if (!videoSource || !videoUrl) {
      message.error('请选择视频源并填写视频地址');
      return;
    }

    let videoMarkdown = '';
    if (videoSource === 'youtube') {
      // 提取YouTube视频ID
      let videoId = '';
      try {
        const url = new URL(videoUrl);
        if (url.hostname.includes('youtube.com') && url.searchParams.has('v')) {
          videoId = url.searchParams.get('v') || '';
        } else if (url.hostname.includes('youtu.be')) {
          videoId = url.pathname.slice(1);
        } else if (url.pathname.includes('embed/')) {
          videoId = url.pathname.split('embed/')[1].split('?')[0];
        }
        
        if (videoId) {
          videoMarkdown = `[!video](https://www.youtube.com/embed/${videoId})`;
        } else {
          videoMarkdown = `[!video](${videoUrl})`;
        }
      } catch {
        videoMarkdown = `[!video](${videoUrl})`;
      }
    } else if (videoSource === 'bilibili') {
      videoMarkdown = `[!video](${videoUrl})`;
    }

    // 插入到编辑器中
    const currentContent = markdownContent || '';
    const newContent = currentContent + '\n\n' + videoMarkdown + '\n\n';
    setMarkdownContent(newContent);
    form.setFieldValue('content', newContent);

    // 关闭模态框并重置表单
    setVideoModalVisible(false);
    setVideoSource('');
    setVideoUrl('');
    videoForm.resetFields();
    message.success('视频已插入到编辑器中');
  };

  // 取消视频插入
  const handleVideoCancel = () => {
    setVideoModalVisible(false);
    setVideoSource('');
    setVideoUrl('');
    videoForm.resetFields();
  };

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
          else if (ariaLabel.includes('video')) tooltipText = '插入视频';
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

  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      
      // 处理标签选择
      let tagIds: number[] = [];
      
      // 必须选择一个类别
      if (!values.categoryId) {
        message.error('请选择一个类别');
        return;
      }
      
      tagIds.push(values.categoryId);
      
      // 处理标签选择
      if (values.dynamicTags) {
        const dynamicTagSelection = values.dynamicTags as DynamicTagSelection;
        
        // 添加现有的标签
        tagIds.push(...dynamicTagSelection.existingTagIds);
        
        // 处理新建的标签
        if (dynamicTagSelection.newDynamicTags.length > 0) {
          try {
            // 在 processPostTags 中必须包含类别，因为后端验证要求至少有一个类别
            const tagProcessResult = await tagApi.processPostTags({
              existingTagIds: [values.categoryId, ...dynamicTagSelection.existingTagIds], // 包含类别
              newDynamicTags: dynamicTagSelection.newDynamicTags,
            });
            // processPostTags 现在返回所有标签ID (现有的 + 新创建的)
            const processedTagIds = tagProcessResult.data.data || [];
            // 只添加新创建的标签ID（排除已经添加的类别和现有标签）
            const alreadyIncludedIds = [values.categoryId, ...dynamicTagSelection.existingTagIds];
            const newTagIds = processedTagIds.filter(id => !alreadyIncludedIds.includes(id));
            tagIds.push(...newTagIds);
          } catch (error) {
            console.error('创建新标签失败:', error);
            message.error('创建新标签失败，请稍后重试');
            return;
          }
        }
      }
      
      console.log('准备创建帖子，标签IDs:', tagIds);
      
      const createPostRequest: CreatePostRequest = {
        title: values.title,
        content: markdownContent || values.content || '',
        summary: values.summary,
        tagIds, // 只发送tagIds，不发送categoryId
      };
      
      const post = await createPost(createPostRequest);
      message.success('帖子发布成功！');
      navigate(`/posts/${post.id}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '发布帖子失败，请稍后重试';
      message.error(errorMessage);
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
              categoryId: undefined,
              dynamicTags: { existingTagIds: [], newDynamicTags: [] },
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
                onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
                  e.target.style.borderColor = 'var(--primary-color)';
                  e.target.style.boxShadow = '0 0 0 4px rgba(79, 70, 229, 0.1)';
                }}
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
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
                autoSize={{ minRows: 3, maxRows: 8 }}
                showCount
                maxLength={500}
                style={{
                  borderRadius: '12px',
                  fontSize: '15px',
                  border: '2px solid var(--border-color)',
                  transition: 'all 0.3s ease',
                  resize: 'none',
                  overflow: 'hidden'
                }}
                onFocus={(e: React.FocusEvent<HTMLTextAreaElement>) => {
                  e.target.style.borderColor = 'var(--primary-color)';
                  e.target.style.boxShadow = '0 0 0 4px rgba(79, 70, 229, 0.1)';
                }}
                onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => {
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
                <MdEditor
                  modelValue={markdownContent || ''}
                  onChange={handleMarkdownChange}
                  preview={true}
                  // 支持快捷键（通过内置功能）
                  onSave={() => {
                    // 可以添加保存逻辑
                    console.log('保存快捷键被触发');
                  }}
                  toolbars={[
                    'bold',
                    'underline', 
                    'italic',
                    'strikeThrough',
                    '-',
                    'title',
                    'sub',
                    'sup',
                    'quote',
                    'unorderedList',
                    'orderedList',
                    'task',
                    '-',
                    'codeRow',
                    'code',
                    'link',
                    'image',
                    'table',
                    0, // 自定义视频插入按钮
                    '-',
                    'revoke',
                    'next',
                    'save',
                    '=',
                    'pageFullscreen',
                    'fullscreen',
                    'preview',
                    'htmlPreview',
                    'catalog'
                  ]}
                  defToolbars={[<VideoToolbar key="video-toolbar" />]}
                  toolbarsExclude={['github']}
                  theme="light"
                  previewTheme="vuepress"
                  codeTheme="github"
                  language="zh-CN"
                  placeholder="支持 Markdown 语法和视频嵌入：

# 一级标题
## 二级标题

**粗体文字** *斜体文字*

- 无序列表
1. 有序列表

> 引用内容

[链接文字](URL)
![图片描述](图片URL)

```javascript
// 代码块
console.log('Hello World!');
```

🎬 支持视频嵌入：

B站视频：
<iframe src='//player.bilibili.com/player.html?isOutside=true&aid=883823306&bvid=BV1fK4y1s7Qf&cid=213186693&p=1' scrolling='no' border='0' frameborder='no' framespacing='0' allowfullscreen='true'></iframe>

YouTube视频：
<iframe width='560' height='315' src='https://www.youtube.com/embed/视频ID' title='YouTube video player' frameborder='0' allowfullscreen></iframe>

让你的帖子更精彩！"
                  style={{
                    backgroundColor: 'transparent',
                    height: '450px',
                    // 确保文本可以被选择
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    MozUserSelect: 'text',
                    msUserSelect: 'text'
                  }}
                  // 添加编辑器类名以便自定义样式
                  className="voxnest-editor"
                  onHtmlChanged={(html) => {
                    console.log('📝 [MdEditor] onHtmlChanged 被调用，HTML长度:', html.length);
                    // 在HTML生成后立即处理视频嵌入
                    const processedHtml = processVideoMarkdown(html);
                    console.log('📝 [MdEditor] 处理后HTML长度:', processedHtml.length);
                    return processedHtml;
                  }}
                  sanitize={(html) => {
                    console.log('🧹 [MdEditor] sanitize 被调用，HTML长度:', html.length);
                    // 在sanitize过程中处理视频嵌入，确保视频iframe不被过滤
                    const processedHtml = processVideoMarkdown(html);
                    console.log('🧹 [MdEditor] sanitize 处理后HTML长度:', processedHtml.length);
                    // 返回处理后的HTML，保留安全的视频嵌入
                    return processedHtml;
                  }}
                />
              </div>
            </Form.Item>

            {/* 分类和标签选择 */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
              <Form.Item
                name="categoryId"
                label={<span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>类别</span>}
                rules={[
                  { required: true, message: '请选择类别' }
                ]}
                style={{ flex: 1 }}
              >
                <PermanentTagSelector placeholder="请选择类别" />
              </Form.Item>

              <Form.Item
                name="dynamicTags"
                label={<span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>标签</span>}
                style={{ flex: 2 }}
              >
                <DynamicTagSelector placeholder="请选择标签（可选）" />
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
                <li>必须选择一个类别，方便其他用户发现</li>
                <li>可以选择多个标签，或创建新的标签</li>
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

      {/* 视频插入模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Video size={18} style={{ marginRight: '8px', color: 'var(--primary-color)' }} />
            插入视频
          </div>
        }
        open={videoModalVisible}
        onOk={handleVideoConfirm}
        onCancel={handleVideoCancel}
        okText="插入视频"
        cancelText="取消"
        width={600}
        destroyOnClose
      >
        <Form
          form={videoForm}
          layout="vertical"
          style={{ marginTop: '20px' }}
        >
          <Form.Item
            label="视频源"
            name="videoSource"
            rules={[{ required: true, message: '请选择视频源' }]}
          >
            <Select
              placeholder="请选择视频源"
              size="large"
              value={videoSource}
              onChange={setVideoSource}
              style={{ borderRadius: '8px' }}
            >
              <Select.Option value="youtube">YouTube</Select.Option>
              <Select.Option value="bilibili">BiliBili</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="视频地址"
            name="videoUrl"
            rules={[{ required: true, message: '请输入视频地址' }]}
          >
            <Input
              placeholder={
                videoSource === 'youtube' 
                  ? '请输入YouTube视频链接，例如：https://www.youtube.com/watch?v=VIDEO_ID'
                  : videoSource === 'bilibili'
                  ? '请输入BiliBili视频链接，例如：https://www.bilibili.com/video/BV1234567890'
                  : '请先选择视频源'
              }
              size="large"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          {videoSource && videoUrl && (
            <Form.Item label="预览">
              <div style={{
                background: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#495057'
              }}>
                {videoSource === 'youtube' ? (
                  <div>
                    <div style={{ marginBottom: '8px', fontWeight: '500' }}>Markdown代码：</div>
                    <div style={{ background: 'white', padding: '8px', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                      [!video]({(() => {
                        try {
                          const url = new URL(videoUrl);
                          let videoId = '';
                          if (url.hostname.includes('youtube.com') && url.searchParams.has('v')) {
                            videoId = url.searchParams.get('v') || '';
                          } else if (url.hostname.includes('youtu.be')) {
                            videoId = url.pathname.slice(1);
                          } else if (url.pathname.includes('embed/')) {
                            videoId = url.pathname.split('embed/')[1].split('?')[0];
                          }
                          return videoId ? `https://www.youtube.com/embed/${videoId}` : videoUrl;
                        } catch {
                          return videoUrl;
                        }
                      })()})
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: '8px', fontWeight: '500' }}>Markdown代码：</div>
                    <div style={{ background: 'white', padding: '8px', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                      [!video]({videoUrl})
                    </div>
                  </div>
                )}
              </div>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default CreatePost;
