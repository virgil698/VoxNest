# VoxNest 配置生成脚本
# 用于自动生成安全的JWT密钥和配置文件

param(
    [string]$Environment = "Development",
    [switch]$Force = $false,
    [switch]$ValidateOnly = $false
)

# 设置错误处理
$ErrorActionPreference = "Stop"

# 获取脚本目录和项目根目录
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$ServerDir = Join-Path $ProjectRoot "VoxNest.Server"

Write-Host "🔧 VoxNest 配置生成工具" -ForegroundColor Cyan
Write-Host "环境: $Environment" -ForegroundColor Yellow

# 检查.NET项目是否存在
if (-not (Test-Path (Join-Path $ServerDir "VoxNest.Server.csproj"))) {
    Write-Error "错误：未找到VoxNest.Server项目文件"
    exit 1
}

# 切换到服务器目录
Push-Location $ServerDir

try {
    if ($ValidateOnly) {
        Write-Host "🔍 验证现有配置..." -ForegroundColor Blue
        dotnet run --no-build -- --validate-config
    } else {
        Write-Host "🔑 生成安全配置..." -ForegroundColor Green
        
        if ($Force) {
            dotnet run --no-build -- --generate-config
        } else {
            # 检查配置文件是否已存在
            $envFile = Join-Path $ServerDir ".env"
            $localConfigFile = Join-Path $ServerDir "Configuration" "appsettings.Local.json"
            
            $filesExist = @()
            if (Test-Path $envFile) { $filesExist += ".env" }
            if (Test-Path $localConfigFile) { $filesExist += "appsettings.Local.json" }
            
            if ($filesExist.Count -gt 0) {
                Write-Warning "以下配置文件已存在："
                $filesExist | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
                Write-Host ""
                
                $response = Read-Host "是否覆盖现有文件？(y/N)"
                if ($response -eq 'y' -or $response -eq 'Y') {
                    dotnet run --no-build -- --generate-config
                } else {
                    Write-Host "操作已取消" -ForegroundColor Yellow
                }
            } else {
                dotnet run --no-build -- --generate-config
            }
        }
    }
} catch {
    Write-Error "执行失败: $_"
    exit 1
} finally {
    Pop-Location
}

if (-not $ValidateOnly) {
    Write-Host ""
    Write-Host "📖 使用说明：" -ForegroundColor Cyan
    Write-Host "1. 检查生成的配置文件，特别是数据库连接字符串" -ForegroundColor White
    Write-Host "2. 如需要，可以手动编辑 .env 或 appsettings.Local.json" -ForegroundColor White
    Write-Host "3. 确保敏感配置文件不被提交到版本控制" -ForegroundColor White
    Write-Host "4. 重启应用程序以使新配置生效" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 提示：使用 -ValidateOnly 参数可以验证配置安全性" -ForegroundColor Green
}

Write-Host "✅ 完成!" -ForegroundColor Green
