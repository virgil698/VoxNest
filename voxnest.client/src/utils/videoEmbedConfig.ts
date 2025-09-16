import { defaultSchema } from 'rehype-sanitize';
import type { Options } from 'rehype-sanitize';

/**
 * 自定义的sanitize配置，支持视频嵌入
 */
export const videoEmbedSchema: Options = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    iframe: [
      'src',
      'width',
      'height',
      'frameBorder',
      'allowFullScreen',
      'title',
      'allow',
      'referrerPolicy',
      'scrolling',
      'border',
      'frameSpacing'
    ]
  },
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'iframe'
  ],
  protocols: {
    ...defaultSchema.protocols,
    src: [
      'https',
      'http',
      // 支持B站
      'bilibili',
      // 支持YouTube
      'youtube'
    ]
  },
  clobber: ['name', 'id'],
  clobberPrefix: 'user-content-'
};

/**
 * 检查iframe源是否安全
 */
export const isSafeVideoSource = (src: string): boolean => {
  const safeHosts = [
    // BiliBili 相关域名
    'player.bilibili.com',
    'www.bilibili.com',
    'bilibili.com',
    // YouTube 相关域名  
    'www.youtube.com',
    'youtube.com',
    'youtu.be',
    // Vimeo 相关域名
    'player.vimeo.com',
    'vimeo.com'
  ];

  try {
    const url = new URL(src.startsWith('//') ? `https:${src}` : src);
    const isAllowed = safeHosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`));
    console.log('🔒 [VideoSecurity] 安全检查:', {
      url: src,
      hostname: url.hostname,
      isAllowed: isAllowed,
      safeHosts: safeHosts
    });
    return isAllowed;
  } catch (error) {
    console.log('🔒 [VideoSecurity] URL解析失败:', src, error);
    return false;
  }
};

/**
 * 处理视频嵌入的预处理器
 */
export const processVideoEmbeds = (content: string): string => {
  // 匹配iframe标签
  const iframeRegex = /<iframe[^>]*>/gi;
  
  return content.replace(iframeRegex, (match) => {
    // 提取src属性
    const srcMatch = match.match(/src=["']([^"']+)["']/i);
    if (!srcMatch) return match;
    
    const src = srcMatch[1];
    
    // 检查是否为安全的视频源
    if (!isSafeVideoSource(src)) {
      return `<!-- 不安全的视频源已被过滤: ${src} -->`;
    }
    
    // 检查是否已经有voxnest-video-embed类，避免重复添加
    if (match.includes('voxnest-video-embed')) {
      return match;
    }
    
    // 为视频iframe添加响应式样式类
    if (match.includes('class=')) {
      return match.replace(/class=["']([^"']*)["']/i, 'class="$1 voxnest-video-embed"');
    } else {
      return match.replace('<iframe', '<iframe class="voxnest-video-embed"');
    }
  });
};

/**
 * 优化B站iframe嵌入
 */
export const optimizeBilibiliEmbed = (content: string): string => {
  const bilibiliRegex = /<iframe[^>]*player\.bilibili\.com[^>]*>/gi;
  
  return content.replace(bilibiliRegex, (match) => {
    // 确保B站视频有合适的默认尺寸
    if (!match.includes('width=')) {
      match = match.replace('<iframe', '<iframe width="100%"');
    }
    if (!match.includes('height=')) {
      match = match.replace('<iframe', '<iframe height="315"');
    }
    
    // 添加B站特定的属性
    if (!match.includes('allowfullscreen')) {
      match = match.replace('<iframe', '<iframe allowfullscreen="true"');
    }
    if (!match.includes('scrolling')) {
      match = match.replace('<iframe', '<iframe scrolling="no"');
    }
    if (!match.includes('border=')) {
      match = match.replace('<iframe', '<iframe border="0"');
    }
    if (!match.includes('frameborder')) {
      match = match.replace('<iframe', '<iframe frameborder="no"');
    }
    
    return match;
  });
};

/**
 * 优化YouTube iframe嵌入
 */
export const optimizeYouTubeEmbed = (content: string): string => {
  const youtubeRegex = /<iframe[^>]*youtube\.com[^>]*>/gi;
  
  return content.replace(youtubeRegex, (match) => {
    // 确保YouTube视频有合适的默认尺寸
    if (!match.includes('width=')) {
      match = match.replace('<iframe', '<iframe width="100%"');
    }
    if (!match.includes('height=')) {
      match = match.replace('<iframe', '<iframe height="315"');
    }
    
    // 添加YouTube特定的属性
    if (!match.includes('allowfullscreen')) {
      match = match.replace('<iframe', '<iframe allowfullscreen');
    }
    if (!match.includes('allow=')) {
      match = match.replace('<iframe', '<iframe allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"');
    }
    if (!match.includes('referrerpolicy')) {
      match = match.replace('<iframe', '<iframe referrerpolicy="strict-origin-when-cross-origin"');
    }
    
    return match;
  });
};

/**
 * 处理 [!video](url) 格式的视频嵌入
 * 支持Markdown格式和转换后的HTML链接格式
 */
export const processVideoMarkdown = (content: string): string => {
  console.log('🎬 [VideoEmbed] 开始处理视频嵌入，内容长度:', content.length);
  console.log('🎬 [VideoEmbed] 输入内容:', content.substring(0, 200) + (content.length > 200 ? '...' : ''));
  
  // 先处理原始Markdown格式 [!video](url)
  const videoMarkdownRegex = /\[!video\]\(([^)]+)\)/gi;
  
  const processedContent = content.replace(videoMarkdownRegex, (match, url) => {
    console.log('🎬 [VideoEmbed] 发现Markdown格式视频:', match);
    console.log('🎬 [VideoEmbed] 提取的URL:', url);
    const iframe = convertVideoUrlToIframe(url);
    console.log('🎬 [VideoEmbed] 生成的iframe:', iframe.substring(0, 100) + '...');
    return iframe;
  });
  
  // 再处理转换后的HTML链接格式 <a href="url">!video</a>
  const videoHtmlRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>!video<\/a>/gi;
  
  const finalContent = processedContent.replace(videoHtmlRegex, (match, url) => {
    console.log('🎬 [VideoEmbed] 发现HTML格式视频:', match);
    console.log('🎬 [VideoEmbed] 提取的URL:', url);
    const iframe = convertVideoUrlToIframe(url);
    console.log('🎬 [VideoEmbed] 生成的iframe:', iframe.substring(0, 100) + '...');
    return iframe;
  });
  
  console.log('🎬 [VideoEmbed] 处理完成，输出长度:', finalContent.length);
  console.log('🎬 [VideoEmbed] 输出内容:', finalContent.substring(0, 200) + (finalContent.length > 200 ? '...' : ''));
  
  return finalContent;
};

/**
 * 将视频URL转换为iframe
 */
export const convertVideoUrlToIframe = (url: string): string => {
    if (!url) return '';
    
    const trimmedUrl = url.trim();
    
    // 检查是否为安全的视频源
    if (!isSafeVideoSource(trimmedUrl)) {
      return `<!-- 不安全的视频源已被过滤: ${trimmedUrl} -->`;
    }
    
    try {
      const urlObj = new URL(trimmedUrl.startsWith('//') ? `https:${trimmedUrl}` : trimmedUrl);
      
      // YouTube 视频处理
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        let videoId = '';
        
        if (urlObj.hostname.includes('youtube.com')) {
          if (urlObj.pathname.includes('/embed/')) {
            videoId = urlObj.pathname.split('/embed/')[1].split('?')[0];
          } else {
            videoId = urlObj.searchParams.get('v') || '';
          }
        } else if (urlObj.hostname.includes('youtu.be')) {
          videoId = urlObj.pathname.slice(1);
        }
        
        if (videoId) {
          return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen class="voxnest-video-embed"></iframe>`;
        }
      }
      
      // BiliBili 视频处理
      if (urlObj.hostname.includes('bilibili.com')) {
        console.log('📺 [BiliBili] 开始处理BiliBili视频:', {
          hostname: urlObj.hostname,
          pathname: urlObj.pathname,
          searchParams: Object.fromEntries(urlObj.searchParams)
        });
        
        // 如果是完整的B站视频链接，需要转换为播放器嵌入链接
        if (urlObj.pathname.includes('/video/')) {
          // 提取BVID，处理URL参数和路径分隔符
          let bvid = urlObj.pathname.split('/video/')[1];
          // 移除可能的路径参数和查询参数
          bvid = bvid.split('/')[0].split('?')[0];
          
          // 如果URL查询参数中也有bvid，优先使用查询参数中的
          const urlBvid = urlObj.searchParams.get('bvid');
          if (urlBvid) {
            bvid = urlBvid;
          }
          
          console.log('📺 [BiliBili] 提取的BVID:', bvid);
          
          const iframe = `<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=${bvid}&page=1&autoplay=0" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" width="100%" height="315" class="voxnest-video-embed"></iframe>`;
          
          console.log('📺 [BiliBili] 生成的iframe:', iframe);
          
          // 使用标准的BiliBili嵌入格式，包含必需的isOutside参数
          return iframe;
        }
      }
      
      // 如果是其他支持的嵌入链接，直接使用
      if (urlObj.hostname.includes('player.bilibili.com')) {
        return `<iframe src="${trimmedUrl}" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" width="100%" height="315" class="voxnest-video-embed"></iframe>`;
      }
      
      if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.includes('/embed/')) {
        return `<iframe width="560" height="315" src="${trimmedUrl}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen class="voxnest-video-embed"></iframe>`;
      }
      
    } catch (error) {
      console.warn('Failed to process video URL:', trimmedUrl, error);
    }
    
    // 如果无法处理，返回错误提示
    return `<!-- 不支持的视频源: ${trimmedUrl} -->`;
};

/**
 * 处理所有视频嵌入优化
 */
export const processAllVideoEmbeds = (content: string): string => {
  let processedContent = processVideoMarkdown(content);
  processedContent = processVideoEmbeds(processedContent);
  processedContent = optimizeBilibiliEmbed(processedContent);
  processedContent = optimizeYouTubeEmbed(processedContent);
  return processedContent;
};
