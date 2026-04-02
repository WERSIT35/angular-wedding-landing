# Kubernetes Deployment (DigitalOcean Droplet)

This folder deploys both services:
- Angular frontend (`wedding-frontend`)
- Node backend API (`wedding-backend`)

## 1) Prerequisites

- Kubernetes cluster running on your Droplet (for example `k3s`)
- `kubectl` configured for that cluster
- Traefik ingress available (default in `k3s`)
- Domain pointing to your Droplet public IP

Optional for HTTPS:
- `cert-manager` installed and `wedding-tls` created by certificate issuer

## 2) Build Images

```bash
docker build -f Dockerfile.frontend -t wedding-frontend:latest .
docker build -f Dockerfile.backend -t wedding-backend:latest .
```

If deploying from a separate machine, transfer and import image tarballs into k3s containerd:

```bash
docker save -o wedding-frontend.tar wedding-frontend:latest
docker save -o wedding-backend.tar wedding-backend:latest
scp wedding-frontend.tar wedding-backend.tar root@YOUR_DROPLET_IP:/root/
ssh root@YOUR_DROPLET_IP "sudo /usr/local/bin/k3s ctr images import /root/wedding-frontend.tar && sudo /usr/local/bin/k3s ctr images import /root/wedding-backend.tar"
```

## 3) Configure Manifests

Update these values before deploy:
- image names in `backend-deployment.yaml` and `frontend-deployment.yaml`
- `FRONTEND_ORIGIN` in `configmap.yaml`
- ingress host in `ingress.yaml`
- secrets in `secret.template.yaml` (template only; not auto-applied by kustomize)
- Ensure sensitive values in `secret.template.yaml` are replaced before applying

Create/update the runtime secret explicitly:

```bash
kubectl create secret generic wedding-secrets \
  -n wedding-site \
  --from-literal=ADMIN_EMAIL='admin@eliteweddings.local' \
  --from-literal=ADMIN_PASSWORD='REPLACE_ME' \
  --from-literal=JWT_SECRET='REPLACE_ME' \
  --from-literal=RESEND_API_KEY='REPLACE_ME' \
  --from-literal=INQUIRY_WEBHOOK_URL='' \
  --from-literal=CAPTCHA_SECRET_KEY='' \
  --from-literal=TURNSTILE_SECRET_KEY='' \
  --from-literal=RECAPTCHA_SECRET_KEY='' \
  --from-literal=HCAPTCHA_SECRET_KEY='' \
  --from-literal=SECURITY_ALERT_WEBHOOK_URL='' \
  --from-literal=EDGE_SHARED_SECRET='' \
  --from-literal=DATABASE_URL='' \
  --from-literal=DATABASE_SSL='true' \
  --from-literal=PGSSLMODE='require' \
  --dry-run=client -o yaml | kubectl apply -f -
```

## 4) Deploy

```bash
kubectl apply -k k8s
```

## 5) Verify

```bash
kubectl get pods -n wedding-site
kubectl get svc -n wedding-site
kubectl get ingress -n wedding-site
kubectl logs deploy/wedding-backend -n wedding-site
```

Health checks:
- Backend: `https://YOUR_DOMAIN/health`
- Public content API: `https://YOUR_DOMAIN/api/public/content`

## Notes

- Backend runs with 1 replica because it stores data in a local JSON file (`/app/backend/data/store.json`) on a single PVC.
- For higher availability, move backend state to managed DB/object storage and scale backend replicas.
- Frontend calls `/api/*` relative paths, so ingress routing controls environment behavior.
