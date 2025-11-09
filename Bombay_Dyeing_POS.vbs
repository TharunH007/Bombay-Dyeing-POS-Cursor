Set WshShell = CreateObject("WScript.Shell")
strCurrentDir = WshShell.CurrentDirectory

' Change to the script directory
Set fso = CreateObject("Scripting.FileSystemObject")
strScriptPath = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = strScriptPath

' Check if Node.js is installed
On Error Resume Next
WshShell.Run "node --version", 0, True
If Err.Number <> 0 Then
    MsgBox "Node.js is not installed!" & vbCrLf & vbCrLf & _
           "Please install Node.js from https://nodejs.org/" & vbCrLf & _
           "Then restart your computer and try again.", _
           vbExclamation, "Bombay Dyeing POS"
    WScript.Quit
End If
On Error GoTo 0

' Install dependencies if needed (first run)
If Not fso.FolderExists(strScriptPath & "\node_modules") Then
    MsgBox "First-time setup detected." & vbCrLf & vbCrLf & _
           "Installing dependencies... This may take a few minutes." & vbCrLf & _
           "Please wait for the next message.", _
           vbInformation, "Bombay Dyeing POS"
    
    WshShell.Run "cmd /c npm install", 1, True
    
    MsgBox "Setup complete! Starting POS system...", vbInformation, "Bombay Dyeing POS"
End If

' Start the server in a new window
WshShell.Run "cmd /c START /MIN npm start", 1, False

' Wait 3 seconds for server to start
WScript.Sleep 3000

' Open browser
WshShell.Run "http://localhost:5000"

' Show notification
MsgBox "POS System is now running!" & vbCrLf & vbCrLf & _
       "• Browser: http://localhost:5000" & vbCrLf & _
       "• Mobile access: http://YOUR_COMPUTER_IP:5000" & vbCrLf & vbCrLf & _
       "To stop: Close the command window or press Ctrl+C", _
       vbInformation, "Bombay Dyeing POS"
