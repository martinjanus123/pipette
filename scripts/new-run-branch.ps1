param(
    [Parameter(Mandatory = $true)]
    [string]$Architecture,

    [Parameter(Mandatory = $true)]
    [string]$AgentName,

    [int]$RunNumber = 1,

    [string]$BaselineBranch = "baseline"
)

$ErrorActionPreference = "Stop"

function Convert-ToSlug {
    param([string]$Value)
    $slug = $Value.Trim().ToLowerInvariant()
    $slug = $slug -replace '[^a-z0-9._-]+', '-'
    $slug = $slug.Trim('-')
    if ([string]::IsNullOrWhiteSpace($slug)) {
        throw "Invalid slug source: $Value"
    }
    return $slug
}

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
Push-Location $repoRoot
try {
    $insideRepo = git rev-parse --is-inside-work-tree
    if ($insideRepo -ne "true") {
        throw "Current folder is not a git repository: $repoRoot"
    }

    $dirty = git status --porcelain
    if (-not [string]::IsNullOrWhiteSpace($dirty)) {
        throw "Working tree is not clean. Commit or discard changes before creating a run branch."
    }

    git rev-parse --verify $BaselineBranch | Out-Null
    git switch $BaselineBranch | Out-Null

    $architectureSlug = Convert-ToSlug $Architecture
    $agentSlug = Convert-ToSlug $AgentName
    $branchName = "run/$architectureSlug/$agentSlug-$($RunNumber.ToString("00"))"

    $existingBranch = git branch --list $branchName
    if (-not [string]::IsNullOrWhiteSpace($existingBranch)) {
        throw "Branch already exists: $branchName"
    }

    $baselineCommit = git rev-parse HEAD
    git switch -c $branchName | Out-Null

    $manifest = [ordered]@{
        branch = $branchName
        architecture = $Architecture
        agent_name = $AgentName
        run_number = $RunNumber
        baseline_branch = $BaselineBranch
        baseline_commit = $baselineCommit
        created_at = (Get-Date).ToUniversalTime().ToString("o")
    }

    $manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath "RUN_MANIFEST.json" -Encoding UTF8
    git add RUN_MANIFEST.json
    git commit -m "Initialize $branchName" | Out-Null

    Write-Host "Created branch: $branchName"
    Write-Host "Baseline commit: $baselineCommit"
} finally {
    Pop-Location
}
