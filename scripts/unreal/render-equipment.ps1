param([string]$Editor = 'D:\EpicGames\UE_5.8\Engine\Binaries\Win64\UnrealEditor-Cmd.exe')
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$renderOutput = Join-Path $projectRoot 'output\unreal'
$projectFile = Join-Path $projectRoot 'unreal\PHAEquipment\PHAEquipment.uproject'
New-Item -ItemType Directory -Path $renderOutput -Force | Out-Null
if (!(Test-Path -LiteralPath $Editor)) { throw "Unreal Editor not found: $Editor" }
if (!(Test-Path -LiteralPath (Join-Path $renderOutput 'exports.json'))) { throw 'Run export-equipment.py through Blender first.' }
$existing = Get-CimInstance Win32_Process -Filter "Name = 'UnrealEditor-Cmd.exe'" | Where-Object { $_.CommandLine -like '*PHAEquipment.uproject*' }
if ($existing) { throw 'The PHA equipment renderer is already running.' }
$renderArgs = @(
    ('"' + $projectFile + '"'),
    ('-ExecutePythonScript="' + (Join-Path $PSScriptRoot 'render-equipment.py') + '"'),
    '-unattended', '-nop4', '-nosplash', '-nosound', '-RenderOffscreen',
    '-windowed', '-ResX=1600', '-ResY=900', '-stdout', '-FullStdOutLogOutput'
)
$renderProcess = Start-Process -FilePath $Editor -ArgumentList $renderArgs -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $renderOutput 'render.log') -RedirectStandardError (Join-Path $renderOutput 'render-stderr.log') -PassThru
Write-Output "Unreal PHA render PID: $($renderProcess.Id). Results: $renderOutput"
