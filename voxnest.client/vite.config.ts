import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { env } from 'process';

const baseFolder =
    env.APPDATA !== undefined && env.APPDATA !== ''
        ? `${env.APPDATA}/ASP.NET/https`
        : `${env.HOME}/.aspnet/https`;

const certificateName = "voxnest.client";
const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

if (!fs.existsSync(baseFolder)) {
    fs.mkdirSync(baseFolder, { recursive: true });
}

if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
    if (0 !== child_process.spawnSync('dotnet', [
        'dev-certs',
        'https',
        '--export-path',
        certFilePath,
        '--format',
        'Pem',
        '--no-password',
    ], { stdio: 'inherit', }).status) {
        throw new Error("Could not create certificate.");
    }
}

// const target = env.ASPNETCORE_HTTPS_PORT ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}` :
//     env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(';')[0] : 'http://localhost:5000';

// 创建自定义插件来处理extensions目录
function extensionsPlugin() {
    return {
        name: 'extensions-middleware',
        configureServer(server: any) {
            server.middlewares.use('/extensions', (req: any, res: any, next: any) => {
                try {
                    // 将 /extensions 请求重定向到项目的 extensions 目录
                    const projectRoot = fileURLToPath(new URL('.', import.meta.url));
                    const extensionPath = path.join(projectRoot, 'extensions');
                    
                    // 清理请求URL，移除查询参数
                    let requestPath = req.url.split('?')[0];
                    
                    // 处理扩展ID到目录名的映射（解决大小写问题）
                    const extensionMappings: Record<string, string> = {
                        'cookie-consent': 'CookieConsent',
                        'dark-mode-theme': 'DarkModeTheme', 
                        'back-to-top': 'BackToTop'
                    };
                    
                    // 检查是否是扩展目录请求
                    const urlParts = requestPath.split('/').filter(Boolean);
                    if (urlParts.length >= 1) {
                        const extensionId = urlParts[0];
                        if (extensionMappings[extensionId]) {
                            // 替换URL中的扩展ID为实际目录名
                            urlParts[0] = extensionMappings[extensionId];
                            requestPath = '/' + urlParts.join('/');
                        }
                    }
                    
                    const filePath = path.join(extensionPath, requestPath);
                    
                    if (fs.existsSync(filePath)) {
                        const ext = path.extname(filePath);
                        
                        // 设置正确的MIME类型
                        if (ext === '.json') {
                            res.setHeader('Content-Type', 'application/json');
                        } else if (ext === '.tsx' || ext === '.ts') {
                            res.setHeader('Content-Type', 'application/javascript');
                            // TSX文件内容会触发fallback模块，这是预期的行为
                        } else if (ext === '.css') {
                            res.setHeader('Content-Type', 'text/css');
                        }
                        
                        const content = fs.readFileSync(filePath);
                        res.end(content);
                        return;
                    }
                } catch (error) {
                    console.error('Extensions middleware error:', error);
                }
                next();
            });
        }
    };
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [plugin(), extensionsPlugin()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        proxy: {
            '^/api': {
                target: env.VITE_API_BASE_URL || 'http://localhost:5201',
                secure: false,
                changeOrigin: true,
                rewrite: (path) => path
            }
        },
        port: parseInt(env.DEV_SERVER_PORT || '54976'),
        host: true,
        fs: {
            // 允许访问项目根目录以外的文件
            allow: ['..']
        }
    }
})
