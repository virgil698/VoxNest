/**
 * VoxNest 内置集成
 * 参考 Astro 内置集成，提供核心功能
 */

import type { Integration } from '../core/types';

// ==================== React 集成 ====================

export function createReactIntegration(): Integration {
  return {
    name: 'voxnest:react',
    hooks: {
      'framework:ready': (context) => {
        context.logger.info('React integration: Framework ready');
        
        // 注册 React 组件渲染器相关逻辑
        // 这里可以添加 React 特定的初始化逻辑
      },

      'components:ready': (context) => {
        context.logger.info('React integration: Component system ready');
        
        // 注册一些基础的 React 特定槽位
        const reactSlots = [
          'react:error-boundary',
          'react:suspense-fallback',
          'react:dev-tools',
        ];

        reactSlots.forEach(slotId => {
          context.logger.debug(`Initializing React slot: ${slotId}`);
        });
      },

      'app:start': (context) => {
        context.logger.debug('React integration: App starting');
      },

      'app:started': (context) => {
        context.logger.debug('React integration: App started');
      },

      'app:destroy': (context) => {
        context.logger.debug('React integration: App destroying');
      },
    },
  };
}

// ==================== 开发工具集成 ====================

export function createDevToolsIntegration(): Integration {
  return {
    name: 'voxnest:dev-tools',
    hooks: {
      'framework:ready': (context) => {
        if (process.env.NODE_ENV !== 'development') {
          return;
        }

        context.logger.info('Dev Tools integration: Framework ready');

        // 注册开发工具到各个槽位
        const devToolsComponents = [
          {
            slotId: 'dev:debug-panel',
            component: () => null, // 实际的调试面板组件
          },
          {
            slotId: 'dev:performance-monitor',
            component: () => null, // 性能监控组件
          },
        ];

        // 在实际应用中，这里会注册真实的开发工具组件
        context.logger.debug(`Prepared ${devToolsComponents.length} dev tool components`);
      },

      'components:ready': (context) => {
        if (process.env.NODE_ENV !== 'development') {
          return;
        }

        context.logger.info('Dev Tools integration: Component system ready');

        // 添加键盘快捷键监听
        if (typeof window !== 'undefined') {
          const handleKeyDown = (event: KeyboardEvent) => {
            // Ctrl+Shift+D: 打开调试面板
            if (event.ctrlKey && event.shiftKey && event.key === 'D') {
              context.logger.debug('Debug panel shortcut triggered');
              // 这里可以触发调试面板显示
            }
            
            // Ctrl+Shift+S: 打开状态面板
            if (event.ctrlKey && event.shiftKey && event.key === 'S') {
              context.logger.debug('Status panel shortcut triggered');
              const stats = context.framework.getStats();
              context.logger.info('Framework Stats:', stats);
            }
          };

          window.addEventListener('keydown', handleKeyDown);
          
          // 注册清理函数（需要在实际实现中处理）
          context.logger.debug('Dev tools keyboard shortcuts registered');
        }
      },
    },
  };
}

// ==================== 布局集成 ====================

export function createLayoutIntegration(): Integration {
  return {
    name: 'voxnest:layout',
    hooks: {
      'components:ready': (context) => {
        context.logger.info('Layout integration: Component system ready');

        // 注册标准布局槽位
        const layoutSlots = [
          'layout:header',
          'layout:header.left',
          'layout:header.center', 
          'layout:header.right',
          'layout:sidebar',
          'layout:sidebar.top',
          'layout:sidebar.bottom',
          'layout:content',
          'layout:content.before',
          'layout:content.after',
          'layout:footer',
          'layout:footer.left',
          'layout:footer.center',
          'layout:footer.right',
        ];

        context.logger.debug(`Initialized ${layoutSlots.length} layout slots`);

        // 可以在这里注册一些默认的布局组件
        layoutSlots.forEach(slotId => {
          context.logger.trace(`Layout slot available: ${slotId}`);
        });
      },
    },
  };
}

// ==================== 样式集成 ====================

export function createStyleIntegration(): Integration {
  return {
    name: 'voxnest:style',
    hooks: {
      'framework:ready': (context) => {
        context.logger.info('Style integration: Framework ready');

        // 注入基础 CSS 变量
        if (typeof document !== 'undefined') {
          const style = document.createElement('style');
          style.textContent = `
            :root {
              --voxnest-primary: #1890ff;
              --voxnest-success: #52c41a;
              --voxnest-warning: #faad14;
              --voxnest-error: #f5222d;
              --voxnest-bg: #ffffff;
              --voxnest-text: #333333;
              --voxnest-border: #d9d9d9;
              --voxnest-radius: 6px;
              --voxnest-shadow: 0 2px 8px rgba(0,0,0,0.15);
            }

            [data-slot] {
              position: relative;
            }

            [data-slot]:empty {
              display: none;
            }
          `;
          
          document.head.appendChild(style);
          context.logger.debug('Base CSS variables injected');
        }
      },

      'components:ready': (context) => {
        context.logger.info('Style integration: Component system ready');
        
        // 注册样式相关的槽位
        const styleSlots = [
          'style:head',
          'style:variables',
          'style:custom-css',
        ];

        styleSlots.forEach(slotId => {
          context.logger.debug(`Style slot available: ${slotId}`);
        });
      },
    },
  };
}

// ==================== 路由集成 ====================

export function createRouterIntegration(): Integration {
  return {
    name: 'voxnest:router',
    hooks: {
      'app:start': (context) => {
        context.logger.info('Router integration: App starting');

        // 注册路由相关的槽位
        const routerSlots = [
          'router:before-route-change',
          'router:after-route-change',
          'router:route-error',
        ];

        routerSlots.forEach(slotId => {
          context.logger.debug(`Router slot available: ${slotId}`);
        });

        // 如果在浏览器环境中，监听路由变化
        if (typeof window !== 'undefined') {
          const handleRouteChange = () => {
            context.logger.debug('Route changed:', window.location.pathname);
            // 这里可以触发路由变化相关的钩子
          };

          // 监听 popstate 事件（用户点击前进/后退）
          window.addEventListener('popstate', handleRouteChange);
          
          context.logger.debug('Router event listeners registered');
        }
      },
    },
  };
}

// ==================== 内置集成组合 ====================

export function getBuiltinIntegrations(): Integration[] {
  return [
    createReactIntegration(),
    createDevToolsIntegration(),
    createLayoutIntegration(),
    createStyleIntegration(),
    createRouterIntegration(),
  ];
}

// ==================== 集成工厂函数 ====================

export function createCustomIntegration(
  name: string,
  hooks: Integration['hooks'] = {}
): Integration {
  return {
    name: `custom:${name}`,
    hooks,
  };
}

// ==================== 集成助手 ====================

export function createSimpleIntegration(
  name: string,
  onReady?: (context: any) => void | Promise<void>
): Integration {
  return {
    name,
    hooks: {
      'framework:ready': onReady,
    },
  };
}

export function createComponentIntegration(
  name: string,
  components: Array<{
    slotId: string;
    component: React.ComponentType<any>;
    priority?: number;
  }>
): Integration {
  return {
    name,
    hooks: {
      'components:ready': (context) => {
        components.forEach(({ slotId, component, priority = 0 }) => {
          context.slots.register(slotId, {
            component,
            source: name,
            priority,
            name: `${name}:${slotId}`,
          });
        });
        
        context.logger.info(`${name}: Registered ${components.length} components`);
      },
      
      'app:destroy': (context) => {
        // 清理注册的组件
        context.slots.unregisterBySource(name);
        context.logger.debug(`${name}: Cleaned up components`);
      },
    },
  };
}
