@echo off
echo ========================================
echo       VoxNest 论坛系统停止脚本
echo ========================================
echo.

REM 设置颜色
color 0C

echo [信息] 正在停止 VoxNest 论坛系统...
echo.

REM 查找并终止 dotnet 进程（VoxNest.Server）
echo [信息] 停止后端服务器...
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq dotnet.exe" /fo csv ^| findstr /i "VoxNest.Server"') do (
    echo [信息] 终止后端进程 %%i
    taskkill /pid %%i /f >nul 2>&1
)

REM 停止所有 dotnet 进程（更激进的方法）
tasklist /fi "imagename eq dotnet.exe" | findstr dotnet >nul
if %errorlevel% equ 0 (
    echo [警告] 发现其他 dotnet 进程，是否全部停止？(Y/N)
    set /p choice=
    if /i "%choice%"=="Y" (
        taskkill /f /im dotnet.exe >nul 2>&1
        echo [信息] 所有 dotnet 进程已停止
    )
)

REM 查找并终止 Node.js 进程（前端开发服务器）
echo [信息] 停止前端开发服务器...
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo csv ^| findstr /i "vite\|webpack\|dev"') do (
    echo [信息] 终止前端进程 %%i
    taskkill /pid %%i /f >nul 2>&1
)

REM 停止 Vite 开发服务器（通过端口）
echo [信息] 检查并停止占用端口的进程...

REM 检查端口 5000 (后端)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo [信息] 停止占用端口 5000 的进程 %%a
    taskkill /pid %%a /f >nul 2>&1
)

REM 检查端口 54976 (前端)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :54976 ^| findstr LISTENING') do (
    echo [信息] 停止占用端口 54976 的进程 %%a
    taskkill /pid %%a /f >nul 2>&1
)

REM 检查常见的 Vite 端口
for %%p in (3000 4173 5173) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%%p ^| findstr LISTENING') do (
        echo [信息] 停止占用端口 %%p 的进程 %%a
        taskkill /pid %%a /f >nul 2>&1
    )
)

echo.
echo [成功] VoxNest 论坛系统已停止！
echo.
echo 按任意键关闭此窗口...
pause >nul
