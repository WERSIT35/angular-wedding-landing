param(
  [Parameter(Mandatory = $true)]
  [string]$ServerIp,

  [Parameter(Mandatory = $true)]
  [string]$SshKeyPath
)

$ErrorActionPreference = "Stop"

Write-Host "==> Building frontend image..."
docker build -f Dockerfile.frontend -t wedding-frontend:latest .

Write-Host "==> Building backend image..."
docker build -f Dockerfile.backend -t wedding-backend:latest .

Write-Host "==> Saving image tarballs..."
docker save -o wedding-frontend.tar wedding-frontend:latest
docker save -o wedding-backend.tar wedding-backend:latest

Write-Host "==> Uploading tarballs to server $ServerIp ..."
scp -i "$SshKeyPath" wedding-frontend.tar wedding-backend.tar root@$ServerIp:/root/

Write-Host "==> Importing images into k3s containerd..."
ssh -i "$SshKeyPath" root@$ServerIp "sudo /usr/local/bin/k3s ctr images import /root/wedding-frontend.tar && sudo /usr/local/bin/k3s ctr images import /root/wedding-backend.tar"

Write-Host "==> Applying Kubernetes manifests..."
kubectl apply -k k8s

Write-Host "==> Restarting deployments..."
kubectl rollout restart deployment/wedding-frontend -n wedding-site
kubectl rollout restart deployment/wedding-backend -n wedding-site

Write-Host "==> Waiting for rollouts..."
kubectl rollout status deployment/wedding-frontend -n wedding-site --timeout=180s
kubectl rollout status deployment/wedding-backend -n wedding-site --timeout=180s

Write-Host "==> Smoke checks..."
curl.exe -sS https://www.elitewe.com.ge/health
curl.exe -sS -I https://www.elitewe.com.ge/

Write-Host "==> Done."
