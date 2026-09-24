# Hostinger VPS deployment

## Production

- Application path: `/opt/t7iq-differentiation`
- Local published port: `127.0.0.1:3100`
- Public domain: `diff.t7iq.com`
- Health: `http://127.0.0.1:3100/api/health`

## Staging

- Local published port: `127.0.0.1:3101`
- Suggested domain: `stage.diff.t7iq.com`
- Compose file: `docker-compose.staging.yml`

## First installation

```bash
cd /opt
git clone https://github.com/7alrashedi-design/t7iq-differentiation.git
cd t7iq-differentiation
cp .env.example .env
nano .env
bash scripts/deploy-hostinger.sh
```

The `.env` file must contain the active public Supabase URL and publishable key. Never commit the real key to GitHub.

## Routine deployment

After changes are approved in ChatGPT and merged to `main`:

```bash
cd /opt/t7iq-differentiation
bash scripts/deploy-hostinger.sh
```

The script:
1. fetches `main`,
2. resets the server checkout to the exact GitHub revision,
3. builds the Docker image,
4. replaces the running container,
5. checks `/api/health`,
6. prints the deployed commit.

## Reverse proxy

Keep the application container private on localhost. Route `diff.t7iq.com` through the existing Hostinger/Traefik gateway to port 3100.

Before changing the existing Traefik project, inspect its current network, entrypoint and certificate resolver names. Do not guess them, because the VPS already hosts other T7IQ services.

## Rollback

Find the last known good Git commit:

```bash
git log --oneline -10
```

Then:

```bash
git checkout <GOOD_COMMIT>
docker compose --env-file .env -f docker-compose.hostinger.yml up -d --build
curl -f http://127.0.0.1:3100/api/health
```

After recovery, return the working tree to `main` before the next normal deployment.


## Automated deployment

Automated deployment is enabled for pushes to `main` through `.github/workflows/deploy-hostinger.yml` using the repository secret `HOSTINGER_API_KEY`.
