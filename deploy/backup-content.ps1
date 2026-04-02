param(
  [string]$Namespace = "wedding-site",
  [string]$OutputFile = ".\content-backup.json"
)

$ErrorActionPreference = "Stop"

kubectl get --raw "/api/v1/namespaces/$Namespace/services/http:wedding-backend:4000/proxy/api/public/content" `
  | Out-File -Encoding utf8 $OutputFile

Write-Host "Content backup written to $OutputFile"
