/**
 * VoxNest 增强槽位管理器
 * 参考 Astro 的组件集成机制
 */

import React from 'react';
import type { ComponentRegistration, SlotManager, Logger, StyleInjection } from './types';

export class EnhancedSlotManager implements SlotManager {
  private slots = new Map<string, ComponentRegistration[]>();
  private styles = new Map<string, StyleInjection>();
  private slotVisibility = new Map<string, boolean>();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger.createChild('SlotManager');
  }

  register(slotId: string, registration: ComponentRegistration): void {
    if (!this.slots.has(slotId)) {
      this.slots.set(slotId, []);
    }

    const existing = this.slots.get(slotId)!;
    
    // 检查是否已经存在相同源的注册
    const existingIndex = existing.findIndex(r => r.source === registration.source);
    if (existingIndex >= 0) {
      this.logger.debug(`Replacing existing registration for slot "${slotId}" from source "${registration.source}"`);
      existing[existingIndex] = registration;
    } else {
      this.logger.debug(`Registering component to slot "${slotId}" from source "${registration.source}"`);
      existing.push(registration);
    }

    // 按优先级排序（高优先级在前）
    existing.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  unregister(slotId: string, source: string): void {
    const components = this.slots.get(slotId);
    if (!components) return;

    const initialLength = components.length;
    const filtered = components.filter(r => r.source !== source);
    
    if (filtered.length !== initialLength) {
      this.slots.set(slotId, filtered);
      this.logger.debug(`Unregistered components from slot "${slotId}" for source "${source}"`);
    }
  }

  getComponents(slotId: string): ComponentRegistration[] {
    return this.slots.get(slotId)?.slice() || [];
  }


  clear(slotId: string): void {
    if (this.slots.has(slotId)) {
      this.logger.debug(`Clearing all components from slot "${slotId}"`);
      this.slots.delete(slotId);
    }
  }

  // 调试和管理方法

  getSlotStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.slots.forEach((components, slotId) => {
      stats[slotId] = components.length;
    });
    return stats;
  }

  clearAll(): void {
    this.logger.debug('Clearing all slots');
    this.slots.clear();
  }

  // 批量操作
  registerMany(registrations: Array<{ slotId: string; registration: ComponentRegistration }>): void {
    registrations.forEach(({ slotId, registration }) => {
      this.register(slotId, registration);
    });
  }

  unregisterBySource(source: string): void {
    this.logger.debug(`Unregistering all components from source "${source}"`);
    this.slots.forEach((_, slotId) => {
      this.unregister(slotId, source);
    });
    this.removeStylesBySource(source);
  }

  // ==================== 样式管理 ====================

  injectStyle(injection: StyleInjection): void {
    this.styles.set(injection.id, injection);
    this.logger.debug(`Injected style "${injection.id}" from source "${injection.source}"`);
    
    // 立即应用到 DOM
    this.applyStyleToDom(injection);
  }

  removeStyle(id: string): void {
    if (this.styles.has(id)) {
      this.styles.delete(id);
      this.logger.debug(`Removed style "${id}"`);
      
      // 从 DOM 中移除
      this.removeStyleFromDom(id);
    }
  }

  removeStylesBySource(source: string): void {
    const toRemove: string[] = [];
    this.styles.forEach((injection, id) => {
      if (injection.source === source) {
        toRemove.push(id);
      }
    });
    
    toRemove.forEach(id => this.removeStyle(id));
    this.logger.debug(`Removed ${toRemove.length} styles from source "${source}"`);
  }

  getAllStyles(): StyleInjection[] {
    return Array.from(this.styles.values());
  }

  private applyStyleToDom(injection: StyleInjection): void {
    // 检查是否已存在
    let styleElement = document.getElementById(injection.id) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = injection.id;
      styleElement.setAttribute('data-source', injection.source);
      if (injection.isTheme) {
        styleElement.setAttribute('data-theme', 'true');
      }
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = injection.content;
  }

  private removeStyleFromDom(id: string): void {
    const styleElement = document.getElementById(id);
    if (styleElement) {
      styleElement.remove();
    }
  }

  // ==================== 高级组件操作 ====================

  modifyComponent(slotId: string, source: string, updates: Partial<ComponentRegistration>): void {
    const components = this.slots.get(slotId);
    if (!components) return;

    const componentIndex = components.findIndex(r => r.source === source);
    if (componentIndex >= 0) {
      const existing = components[componentIndex];
      components[componentIndex] = { ...existing, ...updates };
      this.logger.debug(`Modified component in slot "${slotId}" from source "${source}"`);
    }
  }

  replaceComponent(slotId: string, oldSource: string, newRegistration: ComponentRegistration): void {
    this.unregister(slotId, oldSource);
    this.register(slotId, newRegistration);
    this.logger.debug(`Replaced component in slot "${slotId}" from "${oldSource}" to "${newRegistration.source}"`);
  }

  wrapComponent(slotId: string, source: string, wrapper: ComponentRegistration): void {
    const components = this.slots.get(slotId);
    if (!components) return;

    const componentIndex = components.findIndex(r => r.source === source);
    if (componentIndex >= 0) {
      const originalComponent = components[componentIndex];
      
      // 创建包装组件
      const wrappedComponent: ComponentRegistration = {
        ...wrapper,
        component: (props: Record<string, unknown>) => {
          return React.createElement(
            wrapper.component,
            { ...wrapper.props, ...props },
            React.createElement(originalComponent.component, { ...originalComponent.props, ...props })
          );
        }
      };
      
      components[componentIndex] = wrappedComponent;
      this.logger.debug(`Wrapped component in slot "${slotId}" from source "${source}"`);
    }
  }

  // ==================== 槽位可见性管理 ====================

  setSlotVisibility(slotId: string, visible: boolean): void {
    this.slotVisibility.set(slotId, visible);
    this.logger.debug(`Set slot "${slotId}" visibility to ${visible}`);
  }

  getSlotVisibility(slotId: string): boolean {
    return this.slotVisibility.get(slotId) ?? true; // 默认可见
  }

  // ==================== 更新的方法 ====================

  getAllSlots(): Record<string, ComponentRegistration[]> {
    const result: Record<string, ComponentRegistration[]> = {};
    this.slots.forEach((components, slotId) => {
      result[slotId] = components.slice();
    });
    return result;
  }

  getStats(): Record<string, number> {
    return this.getSlotStats();
  }

  hasComponents(slotId: string): boolean {
    if (!this.getSlotVisibility(slotId)) {
      return false; // 槽位不可见
    }

    const components = this.slots.get(slotId);
    if (!components || components.length === 0) return false;

    // 检查是否有满足条件的组件
    return components.some(reg => {
      if (reg.condition) {
        try {
          return reg.condition(reg.props);
        } catch (error) {
          this.logger.warn(`Error evaluating condition for component in slot "${slotId}":`, error);
          return false;
        }
      }
      return true;
    });
  }

  render(slotId: string, props?: Record<string, unknown>): React.ReactNode {
    if (!this.getSlotVisibility(slotId)) {
      return null; // 槽位不可见
    }

    const components = this.slots.get(slotId);
    if (!components || components.length === 0) {
      return null;
    }

    const validComponents = components.filter(reg => {
      if (reg.condition) {
        try {
          return reg.condition({ ...props, ...reg.props });
        } catch (error) {
          this.logger.warn(`Error evaluating condition for component in slot "${slotId}":`, error);
          return false;
        }
      }
      return true;
    });

    if (validComponents.length === 0) {
      return null;
    }

    this.logger.trace(`Rendering ${validComponents.length} component(s) in slot "${slotId}"`);

    return React.createElement(
      React.Fragment,
      null,
      ...validComponents.map((reg, index) => {
        const componentProps: Record<string, unknown> = {
          key: `${slotId}-${reg.source}-${index}`,
          ...reg.props,
          ...props,
        };

        // 应用自定义样式和类名
        if (reg.className || reg.styles) {
          const className = [componentProps.className as string, reg.className].filter(Boolean).join(' ');
          componentProps.className = className;
          
          if (reg.styles) {
            if (typeof reg.styles === 'string') {
              componentProps.style = { ...(componentProps.style as Record<string, unknown>), cssText: reg.styles };
            } else {
              componentProps.style = { ...(componentProps.style as Record<string, unknown>), ...reg.styles };
            }
          }
        }

        try {
          const element = React.createElement(reg.component, componentProps);
          
          // 如果有包装器配置，应用包装器
          if (reg.wrapper) {
            const wrapperProps: Record<string, unknown> = {
              key: `wrapper-${componentProps.key as string}`,
              className: reg.wrapper.className,
              style: reg.wrapper.styles
            };
            
            return React.createElement(
              reg.wrapper.element || 'div',
              wrapperProps,
              element
            );
          }
          
          return element;
        } catch (error) {
          this.logger.error(`Error rendering component in slot "${slotId}" from source "${reg.source}":`, error);
          return React.createElement('div', 
            { key: componentProps.key as string, style: { color: 'red', fontSize: '12px' } },
            `Error: Failed to render component from ${reg.source}`
          );
        }
      })
    );
  }

  // ==================== 调试和管理增强 ====================

  debug(): void {
    console.group('🎯 SlotManager Debug Info');
    console.log('Slots:', this.getAllSlots());
    console.log('Styles:', this.getAllStyles());
    console.log('Visibility:', Object.fromEntries(this.slotVisibility));
    console.log('Stats:', this.getStats());
    console.groupEnd();
  }
}
