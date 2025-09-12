/**
 * VoxNest 增强槽位管理器
 * 参考 Astro 的组件集成机制
 */

import React from 'react';
import type { ComponentRegistration, SlotManager, Logger } from './types';

export class EnhancedSlotManager implements SlotManager {
  private slots = new Map<string, ComponentRegistration[]>();
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

  hasComponents(slotId: string): boolean {
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

  render(slotId: string, props?: any): React.ReactNode {
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
        const componentProps = {
          key: `${slotId}-${reg.source}-${index}`,
          ...reg.props,
          ...props,
        };

        try {
          return React.createElement(reg.component, componentProps);
        } catch (error) {
          this.logger.error(`Error rendering component in slot "${slotId}" from source "${reg.source}":`, error);
          return React.createElement('div', 
            { key: componentProps.key, style: { color: 'red', fontSize: '12px' } },
            `Error: Failed to render component from ${reg.source}`
          );
        }
      })
    );
  }

  clear(slotId: string): void {
    if (this.slots.has(slotId)) {
      this.logger.debug(`Clearing all components from slot "${slotId}"`);
      this.slots.delete(slotId);
    }
  }

  // 调试和管理方法
  getAllSlots(): string[] {
    return Array.from(this.slots.keys());
  }

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
    this.slots.forEach((components, slotId) => {
      this.unregister(slotId, source);
    });
  }
}
