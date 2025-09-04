@echo off
REM 设置GBK编码以正确显示中文（适用于老版本Windows）
chcp 936 >nul

echo ========================================
echo       VoxNest 论坛系统启动脚本
echo ========================================
echo.

REM 设置颜色
color 0A

REM 检查.NET是否安装
dotnet --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 .NET，请先安装 .NET 9.0 SDK
    pause
    exit /b 1
)

REM 检查Node.js是否安装  
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

REM 显示版本信息
echo [信息] 运行环境检查:
for /f "tokens=*" %%i in ('dotnet --version') do echo   .NET: %%i
for /f "tokens=*" %%i in ('node --version') do echo   Node.js: %%i
echo.

echo [信息] 正在启动 VoxNest 论坛系统...
echo.

REM 获取当前脚本目录的上级目录
set PROJECT_ROOT=%~dp0..

REM 检查前端依赖是否已安装
set FRONTEND_PATH=%PROJECT_ROOT%\voxnest.client
if not exist "%FRONTEND_PATH%\node_modules" (
    echo [信息] 正在安装前端依赖...
    cd /d "%FRONTEND_PATH%" || (
        echo [错误] 无法进入前端目录: %FRONTEND_PATH%
        pause
        exit /b 1
    )
    npm install || (
        echo [错误] 安装前端依赖失败
        pause
        exit /b 1
    )
)

REM 启动后端服务器（会自动启动前端）
echo [信息] 启动后端服务器（前端将自动启动）...
cd /d "%PROJECT_ROOT%\VoxNest.Server" || (
    echo [错误] 无法进入后端目录: %PROJECT_ROOT%\VoxNest.Server
    pause
    exit /b 1
)

echo.
echo [成功] 服务地址:
echo   前端: http://localhost:54977 (SPA代理自动启动)
echo   后端: http://localhost:5000  
echo   API文档: http://localhost:5000/swagger
echo.
echo [信息] 按 Ctrl+C 停止服务
echo.

REM 启动服务
dotnet run --urls "http://localhost:5000"

REM 如果dotnet run退出，显示提示
echo.
echo [信息] 服务已停止
pause
