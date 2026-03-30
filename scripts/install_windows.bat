@echo off
setlocal enabledelayedexpansion

echo # Chat Finance - Windows Installation #
echo ---------------------------------------

set INSTALL_DIR="%APPDATA%\ChatFinance"
set EXE_PATH="%~dp0..\dist\ChatFinance.exe"
set ICON_PATH="%~dp0..\assets\icon.ico"

if not exist %EXE_PATH% (
    echo Error: dist\ChatFinance.exe binary not found. Please run 'python package_app.py' first.
    pause
    exit /b 1
)

echo Creating installation directory: !INSTALL_DIR!
if not exist !INSTALL_DIR! mkdir !INSTALL_DIR!

echo Copying application binary...
copy /Y %EXE_PATH% !INSTALL_DIR!\ChatFinance.exe >nul

:: Create Shortcut using a temporary VBScript
set "SCRIPT_FILE=%TEMP%\CreateShortcut.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%SCRIPT_FILE%"
echo sLinkFile = oWS.ExpandEnvironmentStrings("%USERPROFILE%\Desktop\Chat Finance.lnk") >> "%SCRIPT_FILE%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%SCRIPT_FILE%"
echo oLink.TargetPath = !INSTALL_DIR! ^& "\ChatFinance.exe" >> "%SCRIPT_FILE%"
echo oLink.WorkingDirectory = !INSTALL_DIR! >> "%SCRIPT_FILE%"
echo oLink.Description = "Powerful AI Financial Chatbot" >> "%SCRIPT_FILE%"
echo oLink.Save >> "%SCRIPT_FILE%"

echo Creating Desktop shortcut...
cscript /nologo "%SCRIPT_FILE%"
del "%SCRIPT_FILE%"

echo Installation complete! 
echo You can now find 'Chat Finance' on your Desktop.
pause
