/**
 * VoxNest 插件安全管理器
 * 负责插件的安全验证、权限控制和风险评估
 */

import type {
  IPluginSecurity,
  IPermissionManager,
  SecurityValidationResult,
  IPlugin,
  PluginModule,
  PluginPermission
} from './types';
import { EventEmitter } from 'events';

export class PluginSecurity implements IPluginSecurity {
  private static _instance: PluginSecurity | null = null;
  
  // 危险API模式
  private readonly DANGEROUS_PATTERNS = [
    /eval\s*\(/,
    /Function\s*\(/,
    /document\.write/,
    /innerHTML\s*=/,
    /outerHTML\s*=/,
    /document\.cookie/,
    /localStorage\.clear/,
    /sessionStorage\.clear/,
    /window\.open/,
    /location\.href\s*=/,
    /XMLHttpRequest/,
    /fetch\s*\(/,
    /import\s*\(/,
    /require\s*\(/,
    /<script[^>]*>/i,
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i
  ];

  // 可疑行为模式
  private readonly SUSPICIOUS_PATTERNS = [
    /crypto/i,
    /bitcoin/i,
    /mining/i,
    /password/i,
    /token/i,
    /secret/i,
    /private.*key/i,
    /base64/i,
    /btoa\(/,
    /atob\(/,
    /encode/i,
    /decode/i
  ];

  // 内置权限定义
  private readonly BUILT_IN_PERMISSIONS = new Map<string, PluginPermission>([
    ['storage.read', {
      name: 'storage.read',
      description: '读取本地存储数据',
      required: false,
      level: 'medium'
    }],
    ['storage.write', {
      name: 'storage.write',
      description: '写入本地存储数据',
      required: false,
      level: 'medium'
    }],
    ['network.request', {
      name: 'network.request',
      description: '发送网络请求',
      required: false,
      level: 'high'
    }],
    ['dom.modify', {
      name: 'dom.modify',
      description: '修改DOM结构',
      required: false,
      level: 'high'
    }],
    ['script.execute', {
      name: 'script.execute',
      description: '执行动态脚本',
      required: false,
      level: 'critical'
    }],
    ['user.data', {
      name: 'user.data',
      description: '访问用户数据',
      required: false,
      level: 'critical'
    }],
    ['system.admin', {
      name: 'system.admin',
      description: '系统管理权限',
      required: false,
      level: 'critical'
    }]
  ]);

  private constructor() {}

  public static getInstance(): PluginSecurity {
    if (!PluginSecurity._instance) {
      PluginSecurity._instance = new PluginSecurity();
    }
    return PluginSecurity._instance;
  }

  // ===========================================
  // 插件安全验证
  // ===========================================

  /**
   * 验证插件安全性
   */
  public validatePlugin(plugin: IPlugin | PluginModule): SecurityValidationResult {
    const errors: string[] = [];
    const risks: SecurityValidationResult['risks'] = [];

    try {
      // 验证插件元数据
      this.validateMetadata(plugin, errors, risks);

      // 验证插件代码
      if ('plugin' in plugin) {
        this.validatePluginInstance(plugin.plugin, errors, risks);
      } else {
        this.validatePluginInstance(plugin, errors, risks);
      }

      // 验证脚本内容
      if ('scripts' in plugin && plugin.scripts) {
        const codeResult = this.validateCode(plugin.scripts);
        errors.push(...codeResult.errors);
        risks.push(...codeResult.risks);
      }

      // 验证样式内容
      if ('styles' in plugin && plugin.styles) {
        this.validateStyles(plugin.styles, errors, risks);
      }

      // 评估安全等级
      const securityLevel = this.determineSecurityLevel(risks);

      return {
        valid: errors.length === 0,
        errors,
        securityLevel,
        risks
      };

    } catch (error) {
      return {
        valid: false,
        errors: [`验证过程失败: ${error instanceof Error ? error.message : '未知错误'}`],
        securityLevel: 'critical',
        risks: [{
          type: 'validation_error',
          severity: 'critical',
          description: '插件验证过程中发生错误'
        }]
      };
    }
  }

  /**
   * 验证插件代码
   */
  public validateCode(code: string): SecurityValidationResult {
    const errors: string[] = [];
    const risks: SecurityValidationResult['risks'] = [];

    // 检查危险模式
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(code)) {
        const risk = {
          type: 'dangerous_code',
          severity: 'high' as const,
          description: `检测到危险代码模式: ${pattern.source}`
        };
        risks.push(risk);
        errors.push(risk.description);
      }
    }

    // 检查可疑模式
    for (const pattern of this.SUSPICIOUS_PATTERNS) {
      if (pattern.test(code)) {
        risks.push({
          type: 'suspicious_code',
          severity: 'medium',
          description: `检测到可疑代码模式: ${pattern.source}`
        });
      }
    }

    // 检查代码长度
    if (code.length > 100000) {
      risks.push({
        type: 'large_code',
        severity: 'low',
        description: '代码体积过大，可能影响性能'
      });
    }

    // 检查混淆代码
    if (this.isObfuscatedCode(code)) {
      risks.push({
        type: 'obfuscated_code',
        severity: 'high',
        description: '检测到混淆代码，可能隐藏恶意行为'
      });
      errors.push('不允许使用混淆代码');
    }

    const securityLevel = this.determineSecurityLevel(risks);

    return {
      valid: errors.length === 0,
      errors,
      securityLevel,
      risks
    };
  }

  /**
   * 验证插件权限
   */
  public validatePermissions(pluginId: string, permissions: string[]): boolean {
    for (const permission of permissions) {
      if (!this.isValidPermission(permission)) {
        console.warn(`插件 ${pluginId} 请求了无效权限: ${permission}`);
        return false;
      }

      const permissionDef = this.BUILT_IN_PERMISSIONS.get(permission);
      if (permissionDef?.level === 'critical') {
        console.warn(`插件 ${pluginId} 请求了高危权限: ${permission}`);
        // 在实际应用中，这里应该要求用户确认
      }
    }

    return true;
  }

  /**
   * 清理危险代码
   */
  public sanitizeCode(code: string): string {
    let sanitized = code;

    // 移除危险函数调用
    sanitized = sanitized.replace(/eval\s*\([^)]*\)/g, '/* eval removed */');
    sanitized = sanitized.replace(/Function\s*\([^)]*\)/g, '/* Function removed */');
    sanitized = sanitized.replace(/document\.write\s*\([^)]*\)/g, '/* document.write removed */');

    // 移除内联脚本
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gis, '/* script removed */');

    // 移除危险属性
    sanitized = sanitized.replace(/innerHTML\s*=\s*[^;]+/g, '/* innerHTML removed */');
    sanitized = sanitized.replace(/outerHTML\s*=\s*[^;]+/g, '/* outerHTML removed */');

    return sanitized;
  }

  /**
   * 检查恶意行为
   */
  public detectMaliciousBehavior(plugin: IPlugin): boolean {
    try {
      // 检查插件名称和描述中的可疑内容
      const metadata = plugin.metadata;
      const suspiciousTexts = [
        metadata.name.toLowerCase(),
        metadata.description?.toLowerCase() || '',
        metadata.author?.toLowerCase() || ''
      ];

      const maliciousKeywords = [
        'hack', 'crack', 'exploit', 'backdoor', 'trojan',
        'keylogger', 'spyware', 'malware', 'virus'
      ];

      for (const text of suspiciousTexts) {
        for (const keyword of maliciousKeywords) {
          if (text.includes(keyword)) {
            console.warn(`检测到可疑关键词: ${keyword}`);
            return true;
          }
        }
      }

      // 检查插件是否尝试访问敏感API
      const pluginStr = plugin.toString();
      const sensitiveAPIs = [
        'localStorage.clear',
        'sessionStorage.clear',
        'document.cookie',
        'location.href',
        'window.open',
        'XMLHttpRequest',
        'fetch'
      ];

      for (const api of sensitiveAPIs) {
        if (pluginStr.includes(api)) {
          console.warn(`插件尝试访问敏感API: ${api}`);
          // 不一定是恶意的，但需要权限验证
        }
      }

      return false;

    } catch (error) {
      console.error('恶意行为检测失败:', error);
      return true; // 出错时保守处理
    }
  }

  /**
   * 获取插件风险评级
   */
  public getRiskRating(_pluginId: string): number {
    // 这里应该根据插件的历史行为、权限使用等计算风险评级
    // 返回0-100的风险分数，0为最安全，100为最危险
    
    // 暂时返回默认值
    return 0;
  }

  // ===========================================
  // 私有方法
  // ===========================================

  /**
   * 验证插件元数据
   */
  private validateMetadata(
    plugin: IPlugin | PluginModule, 
    errors: string[], 
    risks: SecurityValidationResult['risks']
  ): void {
    const metadata = plugin.metadata;

    if (!metadata) {
      errors.push('缺少插件元数据');
      return;
    }

    // 验证必需字段
    if (!metadata.id) {
      errors.push('缺少插件ID');
    }

    if (!metadata.name) {
      errors.push('缺少插件名称');
    }

    if (!metadata.version) {
      errors.push('缺少插件版本');
    }

    if (!metadata.author) {
      risks.push({
        type: 'missing_author',
        severity: 'medium',
        description: '缺少作者信息'
      });
    }

    // 验证ID格式
    if (metadata.id && !/^[a-z0-9-_]+$/.test(metadata.id)) {
      errors.push('插件ID格式无效');
    }

    // 验证版本格式
    if (metadata.version && !/^\d+\.\d+\.\d+/.test(metadata.version)) {
      risks.push({
        type: 'invalid_version',
        severity: 'low',
        description: '版本号格式不规范'
      });
    }
  }

  /**
   * 验证插件实例
   */
  private validatePluginInstance(
    plugin: IPlugin, 
    errors: string[], 
    risks: SecurityValidationResult['risks']
  ): void {
    // 检查必需方法
    if (typeof plugin.initialize === 'function') {
      // 验证初始化方法
      const initStr = plugin.initialize.toString();
      if (this.containsDangerousCode(initStr)) {
        errors.push('初始化方法包含危险代码');
      }
    }

    // 检查权限要求
    if (typeof plugin.getPermissions === 'function') {
      const permissions = plugin.getPermissions();
      for (const permission of permissions) {
        if (permission.level === 'critical' && !permission.required) {
          risks.push({
            type: 'high_risk_permission',
            severity: 'high',
            description: `请求高危权限: ${permission.name}`
          });
        }
      }
    }
  }

  /**
   * 验证样式内容
   */
  private validateStyles(
    styles: string, 
    _errors: string[], 
    risks: SecurityValidationResult['risks']
  ): void {
    // 检查危险CSS
    const dangerousCSS = [
      'javascript:',
      'expression(',
      'behavior:',
      '@import',
      'url('
    ];

    for (const dangerous of dangerousCSS) {
      if (styles.includes(dangerous)) {
        risks.push({
          type: 'dangerous_css',
          severity: 'medium',
          description: `检测到危险CSS: ${dangerous}`
        });
      }
    }
  }

  /**
   * 检查是否为混淆代码
   */
  private isObfuscatedCode(code: string): boolean {
    // 检查代码特征
    const lines = code.split('\n');
    let suspiciousLines = 0;

    for (const line of lines.slice(0, 50)) { // 只检查前50行
      const trimmed = line.trim();
      
      // 检查极长的行
      if (trimmed.length > 200) {
        suspiciousLines++;
      }

      // 检查大量特殊字符
      const specialChars = (trimmed.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/g) || []).length;
      if (specialChars > trimmed.length * 0.3) {
        suspiciousLines++;
      }

      // 检查hex编码
      if (/\\x[0-9a-fA-F]{2}/.test(trimmed)) {
        suspiciousLines++;
      }
    }

    return suspiciousLines > lines.length * 0.2;
  }

  /**
   * 检查是否包含危险代码
   */
  private containsDangerousCode(code: string): boolean {
    return this.DANGEROUS_PATTERNS.some(pattern => pattern.test(code));
  }

  /**
   * 确定安全等级
   */
  private determineSecurityLevel(risks: SecurityValidationResult['risks']): SecurityValidationResult['securityLevel'] {
    const criticalRisks = risks.filter(r => r.severity === 'critical');
    const highRisks = risks.filter(r => r.severity === 'high');
    const mediumRisks = risks.filter(r => r.severity === 'medium');

    if (criticalRisks.length > 0) return 'critical';
    if (highRisks.length > 2) return 'danger';
    if (highRisks.length > 0 || mediumRisks.length > 3) return 'warning';
    return 'safe';
  }

  /**
   * 检查权限是否有效
   */
  private isValidPermission(permission: string): boolean {
    return this.BUILT_IN_PERMISSIONS.has(permission);
  }
}

/**
 * 权限管理器
 */
export class PermissionManager implements IPermissionManager {
  private static _instance: PermissionManager | null = null;
  private _pluginPermissions = new Map<string, Set<string>>();
  private _eventEmitter = new EventEmitter();

  private constructor() {}

  public static getInstance(): PermissionManager {
    if (!PermissionManager._instance) {
      PermissionManager._instance = new PermissionManager();
    }
    return PermissionManager._instance;
  }

  /**
   * 检查权限
   */
  public hasPermission(pluginId: string, permission: string): boolean {
    const permissions = this._pluginPermissions.get(pluginId);
    return permissions?.has(permission) ?? false;
  }

  /**
   * 授予权限
   */
  public grantPermission(pluginId: string, permission: string): void {
    if (!this._pluginPermissions.has(pluginId)) {
      this._pluginPermissions.set(pluginId, new Set());
    }

    const permissions = this._pluginPermissions.get(pluginId)!;
    permissions.add(permission);

    this._eventEmitter.emit('permission-change', pluginId, permission, true);
    console.log(`权限授予: ${pluginId} -> ${permission}`);
  }

  /**
   * 撤销权限
   */
  public revokePermission(pluginId: string, permission: string): void {
    const permissions = this._pluginPermissions.get(pluginId);
    if (permissions?.delete(permission)) {
      this._eventEmitter.emit('permission-change', pluginId, permission, false);
      console.log(`权限撤销: ${pluginId} -> ${permission}`);
    }
  }

  /**
   * 获取插件权限
   */
  public getPluginPermissions(pluginId: string): string[] {
    const permissions = this._pluginPermissions.get(pluginId);
    return permissions ? Array.from(permissions) : [];
  }

  /**
   * 获取所有权限
   */
  public getAllPermissions(): string[] {
    const security = PluginSecurity.getInstance();
    return Array.from((security as any).BUILT_IN_PERMISSIONS.keys());
  }

  /**
   * 请求权限
   */
  public async requestPermission(pluginId: string, permission: string): Promise<boolean> {
    // 这里应该显示权限请求对话框
    // 暂时自动授予权限
    this.grantPermission(pluginId, permission);
    return true;
  }

  /**
   * 权限变化事件
   */
  public onPermissionChange(
    listener: (pluginId: string, permission: string, granted: boolean) => void
  ): () => void {
    this._eventEmitter.on('permission-change', listener);
    
    return () => {
      this._eventEmitter.off('permission-change', listener);
    };
  }
}

// 导出单例实例
export const pluginSecurity = PluginSecurity.getInstance();
export const permissionManager = PermissionManager.getInstance();
