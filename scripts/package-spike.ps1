# Kịch bản đóng gói NesCode Compatibility Spike thành file .vsix
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$rootDir = Split-Path -Parent $PSScriptRoot
$sourceDir = Join-Path $rootDir "tests\compatibility\spike-extension"
$buildDir = Join-Path $rootDir "build"
$staging = Join-Path $buildDir "staging-spike"
$vsixPath = Join-Path $buildDir "nescode-spike-0.1.0.vsix"
$zipPath = Join-Path $buildDir "nescode-spike-0.1.0.zip"

Write-Host "[NesCode] Bắt đầu đóng gói Compatibility Spike..."

if (-not (Test-Path $buildDir)) {
    New-Item -ItemType Directory -Path $buildDir -Force | Out-Null
}

if (Test-Path $staging) {
    Remove-Item -Recurse -Force $staging
}

New-Item -ItemType Directory -Path (Join-Path $staging "extension\media") -Force | Out-Null

Copy-Item (Join-Path $sourceDir "package.json") (Join-Path $staging "extension\")
Copy-Item (Join-Path $sourceDir "extension.js") (Join-Path $staging "extension\")
Copy-Item (Join-Path $sourceDir "README.md") (Join-Path $staging "extension\")
Copy-Item (Join-Path $sourceDir "media\icon.svg") (Join-Path $staging "extension\media\")

$contentTypes = '<?xml version="1.0" encoding="utf-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="json" ContentType="application/json"/><Default Extension="js" ContentType="application/javascript"/><Default Extension="md" ContentType="text/markdown"/><Default Extension="svg" ContentType="image/svg+xml"/><Default Extension="vsixmanifest" ContentType="text/xml"/></Types>'
[System.IO.File]::WriteAllText((Join-Path $staging "[Content_Types].xml"), $contentTypes)

$manifest = '<?xml version="1.0" encoding="utf-8"?><PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011" xmlns:d="http://schemas.microsoft.com/developer/vsx-schema-design/2011"><Metadata><Identity Id="nescode-spike" Version="0.1.0" Publisher="nescode" TargetPlatform="universal"/><DisplayName>NesCode Compatibility Spike</DisplayName><Description xml:space="preserve">Compatibility Spike Extension verifying Antigravity IDE Extension Host capabilities</Description><Tags>Other</Tags><Categories>Other</Categories><GalleryFlags>Public</GalleryFlags><Properties><Property Id="Microsoft.VisualStudio.Code.Engine" Value="^1.85.0"/><Property Id="Microsoft.VisualStudio.Code.ExtensionDependencies" Value=""/><Property Id="Microsoft.VisualStudio.Code.ExtensionPack" Value=""/><Property Id="Microsoft.VisualStudio.Code.LocalizedLanguages" Value=""/></Properties></Metadata><Installation><InstallationTarget Id="Microsoft.VisualStudio.Code"/></Installation><Dependencies/><Assets><Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true"/></Assets></PackageManifest>'
[System.IO.File]::WriteAllText((Join-Path $staging "extension.vsixmanifest"), $manifest)

if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
if (Test-Path $vsixPath) { Remove-Item -Force $vsixPath }

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($staging, $zipPath)
Move-Item -LiteralPath $zipPath -Destination $vsixPath -Force
Remove-Item -Recurse -Force $staging

$info = Get-Item -LiteralPath $vsixPath
Write-Host "[NesCode] Đóng gói thành công: $($info.FullName) ($($info.Length) bytes)"
