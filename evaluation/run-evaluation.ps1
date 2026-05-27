param(
    [Parameter(Mandatory = $true)]
    [string]$RunPath,

    [switch]$RunSonar
)

$ErrorActionPreference = "Stop"

function Invoke-CapturedCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,

        [Parameter(Mandatory = $true)]
        [string]$WorkingDirectory,

        [Parameter(Mandatory = $true)]
        [string]$Command,

        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,

        [Parameter(Mandatory = $true)]
        [string]$OutputPath
    )

    $start = Get-Date
    function ConvertTo-ProcessArgument {
        param([string]$Argument)

        if ($Argument -notmatch '[\s"]') {
            return $Argument
        }

        return '"' + ($Argument -replace '\\(?=\\*")', '$0$0' -replace '"', '\"') + '"'
    }

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo.FileName = $Command
    $process.StartInfo.Arguments = ($Arguments | ForEach-Object { ConvertTo-ProcessArgument $_ }) -join " "
    $process.StartInfo.WorkingDirectory = $WorkingDirectory
    $process.StartInfo.RedirectStandardOutput = $true
    $process.StartInfo.RedirectStandardError = $true
    $process.StartInfo.UseShellExecute = $false

    $null = $process.Start()
    $stdout = $process.StandardOutput.ReadToEnd()
    $stderr = $process.StandardError.ReadToEnd()
    $process.WaitForExit()

    $output = @()
    if (-not [string]::IsNullOrWhiteSpace($stdout)) {
        $output += $stdout
    }
    if (-not [string]::IsNullOrWhiteSpace($stderr)) {
        $output += ""
        $output += "[stderr]"
        $output += $stderr
    }
    $output -join [Environment]::NewLine | Set-Content -LiteralPath $OutputPath -Encoding UTF8
    $exitCode = $process.ExitCode

    return [ordered]@{
        name = $Name
        command = "$Command $($Arguments -join ' ')"
        working_directory = $WorkingDirectory
        output = $OutputPath
        exit_code = $exitCode
        started_at = $start.ToUniversalTime().ToString("o")
        finished_at = (Get-Date).ToUniversalTime().ToString("o")
    }
}

$resolvedRun = Resolve-Path -LiteralPath $RunPath
$runFullPath = $resolvedRun.Path
$backendPath = Join-Path $runFullPath "backend"
$frontendPath = Join-Path $runFullPath "frontend"
$resultsPath = Join-Path $runFullPath "evaluation-results"

if (-not (Test-Path -LiteralPath $backendPath)) {
    throw "Backend folder not found: $backendPath"
}

if (-not (Test-Path -LiteralPath $frontendPath)) {
    throw "Frontend folder not found: $frontendPath"
}

if (-not (Test-Path -LiteralPath $resultsPath)) {
    New-Item -ItemType Directory -Path $resultsPath | Out-Null
}

if ([string]::IsNullOrWhiteSpace($env:POSTGRES_DB)) {
    $env:POSTGRES_DB = "pipettentool"
}

if ([string]::IsNullOrWhiteSpace($env:POSTGRES_USER)) {
    $env:POSTGRES_USER = "pipettentool"
}

if ([string]::IsNullOrWhiteSpace($env:POSTGRES_PASSWORD)) {
    $env:POSTGRES_PASSWORD = [Guid]::NewGuid().ToString("N")
}

if ([string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
    $env:DATABASE_URL = "postgresql+psycopg://$($env:POSTGRES_USER):$($env:POSTGRES_PASSWORD)@db:5432/$($env:POSTGRES_DB)"
}

$steps = @()

$steps += Invoke-CapturedCommand `
    -Name "backend-pytest" `
    -WorkingDirectory $runFullPath `
    -Command "docker" `
    -Arguments @("compose", "run", "--rm", "--build", "--no-deps", "backend", "python", "-m", "pytest", "--cov=app", "--cov-report=xml") `
    -OutputPath (Join-Path $resultsPath "backend-pytest.txt")

$steps += Invoke-CapturedCommand `
    -Name "frontend-test" `
    -WorkingDirectory $runFullPath `
    -Command "docker" `
    -Arguments @("compose", "run", "--rm", "--build", "--no-deps", "frontend", "npm", "run", "test:coverage", "--", "--coverage.reportsDirectory=/tmp/frontend-coverage") `
    -OutputPath (Join-Path $resultsPath "frontend-test.txt")

if ($RunSonar) {
    if ([string]::IsNullOrWhiteSpace($env:SONAR_HOST_URL) -or [string]::IsNullOrWhiteSpace($env:SONAR_TOKEN)) {
        $sonarOutput = Join-Path $resultsPath "sonar-scanner.txt"
        "SONAR_HOST_URL and SONAR_TOKEN must be set to run Sonar." | Set-Content -LiteralPath $sonarOutput -Encoding UTF8
        $steps += [ordered]@{
            name = "sonar-scanner"
            command = "docker run sonarsource/sonar-scanner-cli"
            working_directory = $runFullPath
            output = $sonarOutput
            exit_code = 1
            started_at = (Get-Date).ToUniversalTime().ToString("o")
            finished_at = (Get-Date).ToUniversalTime().ToString("o")
        }
    } else {
        $steps += Invoke-CapturedCommand `
            -Name "sonar-scanner" `
            -WorkingDirectory $runFullPath `
            -Command "docker" `
            -Arguments @(
                "run",
                "--rm",
                "-e",
                "SONAR_HOST_URL=$env:SONAR_HOST_URL",
                "-e",
                "SONAR_TOKEN=$env:SONAR_TOKEN",
                "-v",
                "$runFullPath`:/usr/src",
                "sonarsource/sonar-scanner-cli"
            ) `
            -OutputPath (Join-Path $resultsPath "sonar-scanner.txt")
    }
}

$summary = [ordered]@{
    run_path = $runFullPath
    evaluated_at = (Get-Date).ToUniversalTime().ToString("o")
    steps = $steps
}

$summary | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $resultsPath "summary.json") -Encoding UTF8

$failed = @($steps | Where-Object { $_.exit_code -ne 0 })
if ($failed.Count -gt 0) {
    Write-Host "Evaluation completed with failures. See $resultsPath"
    exit 1
}

Write-Host "Evaluation completed successfully. See $resultsPath"
