# Frontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.2.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Kubernetes Deployment (DigitalOcean Droplet)

This repository now includes container and Kubernetes manifests for deploying frontend + backend:

- Frontend Docker image: `Dockerfile.frontend`
- Backend Docker image: `Dockerfile.backend`
- Kubernetes manifests: `k8s/`

Deployment guide:
- [`k8s/README.md`](k8s/README.md)

## Content Storage: Static vs Database

Right now, your site content is **not only static**:

- Default/fallback text lives in code (`src/app/data/site-content.data.ts`)
- Admin-edited text is saved on backend in `backend/data/store.json`
- In Kubernetes this file is persisted via PVC (`backend-data`)

So your live site already uses persisted dynamic content, but with a JSON-file store.

If you want a real database (recommended for production), use:
1. PostgreSQL (DigitalOcean Managed DB preferred)
2. Add a `content` table + `users` table + `audit_logs` table
3. Backend reads/writes DB instead of `store.json`
4. Then backend can scale safely to multiple replicas

## Quick Rebuild + Redeploy (Memorize This)

From project root (PowerShell):

```powershell
.\deploy\rebuild-and-redeploy.ps1 -ServerIp "159.65.121.203" -SshKeyPath "C:\Users\Oto\Desktop\id_irs"
```

This script does all of it:
- Build frontend and backend images
- Save tar files
- Upload to server
- Import into k3s containerd
- `kubectl apply -k k8s`
- Restart and wait for rollouts
- Run smoke checks

## Useful Daily Commands

```powershell
# Check pods
kubectl get pods -n wedding-site -o wide

# Check frontend/backend logs
kubectl logs -n wedding-site deploy/wedding-frontend --tail=100
kubectl logs -n wedding-site deploy/wedding-backend --tail=100

# Check ingress
kubectl get ingress -n wedding-site

# Health check
curl.exe https://www.elitewe.com.ge/health
```

## PostgreSQL Migration (Step-By-Step)

1. Create a PostgreSQL database (DigitalOcean Managed PostgreSQL recommended).
2. Put DB connection in Kubernetes secret:

```powershell
kubectl create secret generic wedding-secrets `
  -n wedding-site `
  --from-literal=DATABASE_URL='postgresql://USER:PASSWORD@HOST:25060/DBNAME?sslmode=require' `
  --from-literal=DATABASE_SSL='true' `
  --from-literal=PGSSLMODE='require' `
  --dry-run=client -o yaml | kubectl apply -f -
```

3. Apply manifests and restart backend:

```powershell
kubectl apply -k k8s
kubectl rollout restart deployment/wedding-backend -n wedding-site
kubectl rollout status deployment/wedding-backend -n wedding-site --timeout=180s
```

4. Verify backend is healthy:

```powershell
curl.exe https://www.elitewe.com.ge/health
```

Notes:
- First startup with `DATABASE_URL` auto-imports existing `store.json` into PostgreSQL if DB is empty.
- After migration, app state is read/written from PostgreSQL.
