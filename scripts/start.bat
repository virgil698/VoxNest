@echo off
echo ========================================
echo       VoxNest 论坛系统启动脚本
echo ========================================
echo.

REM 设置颜色
color 0A

REM 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

REM 检查.NET是否安装
dotnet --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 .NET，请先安装 .NET 9.0 SDK
    pause
    exit /b 1
)

echo [信息] 正在启动 VoxNest 论坛系统...
echo.

REM 获取当前脚本目录的上级目录
set PROJECT_ROOT=%~dp0..

REM 启动后端服务器（在新窗口中）
echo [信息] 启动后端服务器...
start "VoxNest Backend" cmd /c "cd /d "%PROJECT_ROOT%\VoxNest.Server" && echo [后端] 正在启动 .NET 服务器... && dotnet run --urls "http://localhost:5000" && pause"

REM 等待后端启动
echo [信息] 等待后端服务器启动...
timeout /t 5 /nobreak >nul

REM 启动前端开发服务器（在新窗口中）
echo [信息] 启动前端开发服务器...
start "VoxNest Frontend" cmd /c "cd /d "%PROJECT_ROOT%\voxnest.client" && echo [前端] 正在安装依赖... && npm install && echo [前端] 正在启动开发服务器... && npm run dev && pause"

echo.
echo [成功] VoxNest 论坛系统启动完成！
echo.
echo 服务地址：
echo   前端: http://localhost:54976 （或 npm run dev 显示的端口）
echo   后端: http://localhost:5000
echo   API文档: http://localhost:5000/swagger
echo.
echo 按任意键关闭此窗口...
pause >nul
