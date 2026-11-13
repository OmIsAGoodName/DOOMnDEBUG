<#
.SYNOPSIS
  VoxFable Audio Preparation Script (Windows PowerShell)
.DESCRIPTION
  Trims, normalises loudness (-16 LUFS), and converts sound effects and music loops
  into compact 96-128 kbps MP3 files for the VoxFable engine.
#>

param (
    [string]$InputDir = ".\raw_audio",
    [string]$OutputDir = ".\audio"
)

# Find FFmpeg in PATH or WinGet packages
$ffmpeg = Get-Command "ffmpeg" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
if (-not $ffmpeg) {
    $wingetMatches = Get-ChildItem -Path "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Filter "ffmpeg.exe" -Recurse -ErrorAction SilentlyContinue
    if ($wingetMatches) {
        $ffmpeg = $wingetMatches[0].FullName
    }
}

if (-not $ffmpeg) {
    Write-Error "FFmpeg not found! Please install via 'winget install Gyan.FFmpeg' or add ffmpeg.exe to PATH."
    exit 1
}

Write-Host "Using FFmpeg: $ffmpeg"

# Ensure output directories exist
New-Item -ItemType Directory -Force -Path "$OutputDir\sfx" | Out-Null
New-Item -ItemType Directory -Force -Path "$OutputDir\music" | Out-Null

# Convert SFX (mono, 96k, trimmed)
Write-Host "Processing SFX..."
Get-ChildItem -Path "$InputDir\sfx" -Filter "*.*" -ErrorAction SilentlyContinue | ForEach-Object {
    $outPath = Join-Path "$OutputDir\sfx" "$($_.BaseName).mp3"
    Write-Host "Converting $($_.Name) -> $outPath"
    & $ffmpeg -y -i $_.FullName -vn -ar 44100 -ac 1 -b:a 96k -af "loudnorm=I=-16:TP=-1.5:LRA=11" $outPath
}

# Convert Music (stereo, 128k, loopable)
Write-Host "Processing Music loops..."
Get-ChildItem -Path "$InputDir\music" -Filter "*.*" -ErrorAction SilentlyContinue | ForEach-Object {
    $outPath = Join-Path "$OutputDir\music" "$($_.BaseName).mp3"
    Write-Host "Converting $($_.Name) -> $outPath"
    & $ffmpeg -y -i $_.FullName -vn -ar 44100 -ac 2 -b:a 128k -af "loudnorm=I=-18:TP=-1.5:LRA=14" $outPath
}

Write-Host "Audio preparation complete."
