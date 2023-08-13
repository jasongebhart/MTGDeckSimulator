# Set-Location -Path "$env:userprofile\Documents\MTGDeckSimulator"
Start-Process -FilePath "$env:programfiles\nodejs\node.exe" -ArgumentList "$PSScriptRoot\startapp.js"
Start-Process "firefox.exe" -ArgumentList "http://localhost:3000"