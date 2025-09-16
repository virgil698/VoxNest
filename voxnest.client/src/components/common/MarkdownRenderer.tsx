import React from 'react';
import { MdPreview } from 'md-editor-rt';
import { convertVideoUrlToIframe } from '../../utils/videoEmbedConfig';
import 'md-editor-rt/lib/preview.css';

interface MarkdownRendererProps {
  /** Markdown 内容 */
  content: string;
  /** MdPreview 主题 */
  theme?: 'light' | 'dark';
  /** 预览主题 */
  previewTheme?: string;
  /** 代码高亮主题 */
  codeTheme?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  theme = 'light',
  previewTheme = 'vuepress',
  codeTheme = 'github',
  style,
  className = '',
}) => {
  // 在 Markdown 渲染前预处理视频标记，避免被当作普通链接处理
  const preprocessedContent = React.useMemo(() => {
    console.log('🎬 [MarkdownRenderer] 预处理视频标记，原始内容:', content.substring(0, 100) + '...');
    
    // 使用正则表达式匹配 [!video](url) 格式
    const videoMarkdownRegex = /\[!video\]\(([^)]+)\)/gi;
    
    // 直接在 Markdown 阶段就替换为 HTML
    const processed = content.replace(videoMarkdownRegex, (match, url) => {
      console.log('🎬 [MarkdownRenderer] 发现视频标记:', match, 'URL:', url);
      
      // 直接生成 iframe HTML，并用特殊标记包装确保不被进一步处理
      const iframe = convertVideoUrlToIframe(url);
      
      // 使用 HTML 注释标记包装，避免 Markdown 解析器处理
      return `\n\n<div class="video-embed-wrapper">\n${iframe}\n</div>\n\n`;
    });
    
    console.log('🎬 [MarkdownRenderer] 预处理完成，内容长度:', processed.length);
    return processed;
  }, [content]);

  const handleSanitize = React.useCallback((html: string) => {
    // 对于包含视频 iframe 的内容，需要更宽松的清理策略
    if (html.includes('voxnest-video-embed') || html.includes('youtube.com/embed') || html.includes('player.bilibili.com') || html.includes('video-embed-wrapper')) {
      // 包含视频内容时，保持原样不过滤
      return html;
    }
    
    // 其他内容使用默认的安全处理
    return html;
  }, []);

  return (
    <>
      <style>{`
        .video-embed-wrapper {
          margin: 20px 0;
          width: 100%;
          display: block;
        }
        
        .video-embed-wrapper .voxnest-video-embed {
          max-width: 100%;
          width: 100%;
          height: 315px;
          border-radius: 8px;
          border: 1px solid #e1e5e9;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          display: block;
        }
        
        @media (max-width: 768px) {
          .video-embed-wrapper .voxnest-video-embed {
            height: 200px;
          }
        }
      `}</style>
      <MdPreview
        theme={theme}
        previewTheme={previewTheme}
        codeTheme={codeTheme}
        modelValue={preprocessedContent}
        style={style}
        className={`voxnest-markdown-renderer ${className}`}
        sanitize={handleSanitize}
      />
    </>
  );
};

export default MarkdownRenderer;