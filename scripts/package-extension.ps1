# Kịch bản đóng gói NesCode Extension thành file .vsix chính thức
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$rootDir = Split-Path -Parent $PSScriptRoot
$sourceDir = Join-Path $rootDir "src\extension"
$buildDir = Join-Path $rootDir "build"
$staging = Join-Path $buildDir "staging-extension"
$vsixPath = Join-Path $buildDir "nescode-antigravity-0.1.0.vsix"
$zipPath = Join-Path $buildDir "nescode-antigravity-0.1.0.zip"

Write-Host "[NesCode] Bat dau build ma nguon Extension..."
node (Join-Path $rootDir "scripts\build-extension.mjs")

Write-Host "[NesCode] Dong goi Extension thanh VSIX..."

if (-not (Test-Path $buildDir)) {
    New-Item -ItemType Directory -Path $buildDir -Force | Out-Null
}

if (Test-Path $staging) {
    Remove-Item -Recurse -Force $staging
}

New-Item -ItemType Directory -Path (Join-Path $staging "extension\media") -Force | Out-Null

Copy-Item (Join-Path $sourceDir "package.json") (Join-Path $staging "extension\")
Copy-Item (Join-Path $sourceDir "extension.js") (Join-Path $staging "extension\")
Copy-Item (Join-Path $sourceDir "media\*") (Join-Path $staging "extension\media\") -Recurse -Force
Copy-Item (Join-Path $rootDir "README.md") (Join-Path $staging "extension\")
Copy-Item (Join-Path $rootDir "LICENSE") (Join-Path $staging "extension\")

$contentTypes = '<?xml version="1.0" encoding="utf-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="json" ContentType="application/json"/><Default Extension="js" ContentType="application/javascript"/><Default Extension="css" ContentType="text/css"/><Default Extension="md" ContentType="text/markdown"/><Default Extension="svg" ContentType="image/svg+xml"/><Default Extension="vsixmanifest" ContentType="text/xml"/></Types>'
[System.IO.File]::WriteAllText((Join-Path $staging "[Content_Types].xml"), $contentTypes)

$manifest = '<?xml version="1.0" encoding="utf-8"?><PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011" xmlns:d="http://schemas.microsoft.com/developer/vsx-schema-design/2011"><Metadata><Identity Id="nescode-antigravity" Version="0.1.0" Publisher="nescode" TargetPlatform="universal"/><DisplayName>NesCode for Antigravity</DisplayName><Description xml:space="preserve">AI Coding Assistant extension for Antigravity IDE powered by Cloudflare Workers AI</Description><Tags>AI,Coding,Assistant,Cloudflare</Tags><Categories>AI,Programming Languages,Machine Learning</Categories><GalleryFlags>Public</GalleryFlags><Properties><Property Id="Microsoft.VisualStudio.Code.Engine" Value="^1.85.0"/><Property Id="Microsoft.VisualStudio.Code.ExtensionDependencies" Value=""/><Property Id="Microsoft.VisualStudio.Code.ExtensionPack" Value=""/><Property Id="Microsoft.VisualStudio.Code.LocalizedLanguages" Value=""/></Properties></Metadata><Installation><InstallationTarget Id="Microsoft.VisualStudio.Code"/></Installation><Dependencies/><Assets><Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true"/></Assets></PackageManifest>'
[System.IO.File]::WriteAllText((Join-Path $staging "extension.vsixmanifest"), $manifest)

if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
if (Test-Path $vsixPath) { Remove-Item -Force $vsixPath }

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($staging, $zipPath)
Move-Item -LiteralPath $zipPath -Destination $vsixPath -Force
Remove-Item -Recurse -Force $staging

$info = Get-Item -LiteralPath $vsixPath
$size = $info.Length
$name = $info.FullName
Write-Host "[NesCode] Dong goi thanh cong VSIX chinh thuc: $name ($size bytes)"
