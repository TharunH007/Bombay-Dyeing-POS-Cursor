@echo off
echo ========================================
echo   Creating Desktop Shortcut
echo ========================================
echo.

REM Get current directory
set SCRIPT_DIR=%~dp0

REM Create VBScript to make shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > CreateShortcut.vbs
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\Bombay Dyeing POS.lnk" >> CreateShortcut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> CreateShortcut.vbs
echo oLink.TargetPath = "%SCRIPT_DIR%Bombay_Dyeing_POS.vbs" >> CreateShortcut.vbs
echo oLink.WorkingDirectory = "%SCRIPT_DIR%" >> CreateShortcut.vbs
echo oLink.Description = "Bombay Dyeing POS System" >> CreateShortcut.vbs
echo oLink.IconLocation = "%%SystemRoot%%\System32\SHELL32.dll,165" >> CreateShortcut.vbs
echo oLink.Save >> CreateShortcut.vbs

REM Run the VBScript
cscript //nologo CreateShortcut.vbs

REM Clean up
del CreateShortcut.vbs

echo.
echo ========================================
echo   SUCCESS!
echo ========================================
echo.
echo A shortcut named "Bombay Dyeing POS" 
echo has been created on your Desktop.
echo.
echo Double-click it to start the POS system!
echo.
pause
