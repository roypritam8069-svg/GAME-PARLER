# ============================================================
# FIX — Remove UTF-8 BOM from project config files
# Game Parlour
# ============================================================

$files = @(
    "package.json",
    "tsconfig.json",
    "next.config.js",
    "tailwind.config.js",
    "postcss.config.js",
    ".env.example",
    ".gitignore"
)

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " FIXING PROJECT FILE ENCODING" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

foreach ($file in $files) {

    if (Test-Path $file) {

        try {
            # Read entire file
            $content = [System.IO.File]::ReadAllText(
                (Resolve-Path $file).Path
            )

            # Remove UTF-8 BOM character if present
            $content = $content.TrimStart([char]0xFEFF)

            # Write UTF-8 WITHOUT BOM
            $utf8NoBom = New-Object System.Text.UTF8Encoding($false)

            [System.IO.File]::WriteAllText(
                (Resolve-Path $file).Path,
                $content,
                $utf8NoBom
            )

            Write-Host "Fixed: $file" -ForegroundColor Green
        }
        catch {
            Write-Host "FAILED: $file" -ForegroundColor Red
            Write-Host $_.Exception.Message -ForegroundColor Red
        }

    }
    else {
        Write-Host "Skipped (not found): $file" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Checking package.json..." -ForegroundColor Cyan

try {

    $packagePath = Join-Path (Get-Location) "package.json"

    $jsonText = [System.IO.File]::ReadAllText($packagePath)

    # Remove BOM
    $jsonText = $jsonText.TrimStart([char]0xFEFF)

    # Parse JSON
    $packageJson = $jsonText | ConvertFrom-Json

    Write-Host ""
    Write-Host "package.json JSON = VALID" -ForegroundColor Green
    Write-Host "Name: $($packageJson.name)" -ForegroundColor White
    Write-Host "Version: $($packageJson.version)" -ForegroundColor White
}
catch {
    Write-Host ""
    Write-Host "package.json JSON = INVALID" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red

    Write-Host ""
    Write-Host "IMPORTANT: package.json content itself is malformed." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " ENCODING FIX COMPLETE" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next:" -ForegroundColor Cyan
Write-Host "1. npm install" -ForegroundColor White
Write-Host "2. npx prisma generate" -ForegroundColor White
Write-Host "3. npm run typecheck" -ForegroundColor White
Write-Host ""