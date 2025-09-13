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
    'player.bilibili.com',
    'www.youtube.com',
    'youtube.com',
    'youtu.be',
    'player.vimeo.com',
    'vimeo.com'
  ];

  try {
    const url = new URL(src.startsWith('//') ? `https:${src}` : src);
    return safeHosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
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
 * 处理所有视频嵌入优化
 */
export const processAllVideoEmbeds = (content: string): string => {
  let processedContent = processVideoEmbeds(content);
  processedContent = optimizeBilibiliEmbed(processedContent);
  processedContent = optimizeYouTubeEmbed(processedContent);
  return processedContent;
};
