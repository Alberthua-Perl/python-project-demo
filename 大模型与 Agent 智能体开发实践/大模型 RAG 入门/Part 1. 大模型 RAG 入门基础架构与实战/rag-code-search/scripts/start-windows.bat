@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ============================================
echo   RAG Code Search v2.0 - 一键启动脚本
echo ============================================
echo.

cd /d "%~dp0\.."

:: 检查 Python 是否安装
where python >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Python，请先安装 Python 3.10+
    pause
    exit /b 1
)

:: 检查 Node.js 是否安装
where node >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)

echo [信息] Python 版本:
python --version
echo [信息] Node.js 版本:
node --version
echo.

:: ========== 步骤 1: Python 虚拟环境 ==========
echo [步骤 1/4] 检查 Python 虚拟环境...
if not exist "backend\.venv" (
    echo [信息] 创建虚拟环境 backend\.venv ...
    python -m venv backend\.venv
    if errorlevel 1 (
        echo [错误] 创建虚拟环境失败
        pause
        exit /b 1
    )
    echo [成功] 虚拟环境创建完成
) else (
    echo [信息] 虚拟环境已存在
)

echo.
echo [步骤 2/4] 安装后端依赖...
call backend\.venv\Scripts\activate.bat
pip install -r backend\requirements.txt
if errorlevel 1 (
    echo [错误] 安装后端依赖失败
    pause
    exit /b 1
)
echo [成功] 后端依赖安装完成

:: ========== 步骤 3: 前端依赖 ==========
echo.
echo [步骤 3/4] 安装前端依赖...
cd frontend
if not exist "node_modules" (
    echo [信息] 首次安装，运行 npm install...
    call npm install
    if errorlevel 1 (
        echo [错误] 安装前端依赖失败
        pause
        exit /b 1
    )
) else (
    echo [信息] node_modules 已存在，跳过安装
)
cd ..
echo [成功] 前端依赖检查完成
echo.

:: ========== 步骤 4: 启动服务 ==========
echo [步骤 4/4] 启动服务...
echo.
echo   后端 API:  http://localhost:8000
echo   前端界面:  http://localhost:5173
echo   API 文档:  http://localhost:8000/docs
echo.
echo ============================================
echo   按 Ctrl+C 停止所有服务
echo ============================================
echo.

:: 启动后端（后台运行，记录 PID 以便退出时清理）
cd backend
start /b "" cmd /c ".venv\Scripts\activate.bat && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
cd ..

:: 等待后端启动，同时获取 uvicorn 进程 PID
echo [信息] 等待后端启动...
timeout /t 3 /nobreak >nul

:: 获取 uvicorn 进程 PID（用于退出时清理）
set BACKEND_PID=
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq python.exe" /fo list 2^>nul ^| findstr /i "PID"') do (
    set BACKEND_PID=%%a
)

:: 启动前端（前台运行，Ctrl+C 会终止此进程）
echo [信息] 启动前端服务...
cd frontend
call npm run dev

:: 前端退出后，自动清理后端进程
echo.
echo [信息] 正在停止后端服务...
if defined BACKEND_PID (
    taskkill /f /t /pid !BACKEND_PID! >nul 2>&1
)
:: 兜底：按端口清理残留的 uvicorn 进程
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%p >nul 2>&1
)
echo [成功] 所有服务已停止
pause
