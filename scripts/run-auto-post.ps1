param(
  [ValidateSet("afternoon", "evening")]
  [string]$Slot = "afternoon"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location -LiteralPath $Root

node ".\scripts\auto-add-post.mjs" "--slot=$Slot"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Host "Git is not available; auto post was created locally only."
  exit 0
}

$status = git status --porcelain
if (-not $status) {
  Write-Host "No Git changes to publish."
  exit 0
}

$allowed = @(
  "data/auto-post-log.json",
  "feed.xml",
  "sitemap.xml"
)
$blocked = @()

foreach ($line in $status) {
  $path = $line.Substring(3).Replace("\", "/")
  if ($path.StartsWith("news/auto-posts/")) {
    continue
  }
  if ($allowed -contains $path) {
    continue
  }
  $blocked += $path
}

if ($blocked.Count -gt 0) {
  Write-Host "Auto post created locally, but Git publish was skipped because other worktree changes exist:"
  $blocked | ForEach-Object { Write-Host " - $_" }
  exit 0
}

git add -- "news/auto-posts" "data/auto-post-log.json" "feed.xml" "sitemap.xml"

$staged = git diff --cached --name-only
if (-not $staged) {
  Write-Host "No staged auto post changes to commit."
  exit 0
}

$messageDate = Get-Date -Format "yyyy-MM-dd"
git commit -m "Add $Slot auto post for $messageDate"

$branch = git rev-parse --abbrev-ref HEAD
git push origin $branch
