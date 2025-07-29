# GitHub Actions CI/CD Setup

This project now uses GitHub Actions instead of Jenkins for a simpler, more maintainable CI/CD pipeline.

## 🚀 What's Included

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) automatically:

1. **Tests Backend** - Runs JHipster/Spring Boot tests with PostgreSQL
2. **Tests Frontend** - Runs React/Angular tests with coverage
3. **Builds Docker Images** - Creates optimized Docker images
4. **Pushes to Docker Hub** - Automatically pushes on main branch
5. **Caches Dependencies** - Faster builds with automatic caching

## 🔧 Setup Instructions

### 1. Add Docker Hub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
- `DOCKERHUB_USERNAME`: Your Docker Hub username
- `DOCKERHUB_TOKEN`: Your Docker Hub access token (not password!)

### 2. Update Image Names

Edit `.github/workflows/ci-cd.yml` and change:
```yaml
env:
  BACKEND_IMAGE: your-dockerhub-username/reminders_app
  FRONTEND_IMAGE: your-dockerhub-username/reminders_app_frontend
```

### 3. Push to GitHub

```bash
git add .
git commit -m "Switch from Jenkins to GitHub Actions"
git push origin main
```

## 📊 Monitoring

- **View builds**: Go to your repo → Actions tab
- **Build status**: Shows green ✅ or red ❌ on commits
- **Logs**: Click on any workflow run to see detailed logs
- **Artifacts**: Download build artifacts if needed

## 🆚 Jenkins vs GitHub Actions

| Feature | Jenkins | GitHub Actions |
|---------|---------|----------------|
| Setup | Complex (Docker, plugins, config) | Simple (one YAML file) |
| Maintenance | High (updates, security, backups) | None (managed by GitHub) |
| Cost | Infrastructure costs | Free for public repos |
| Speed | Slower (cold starts) | Faster (optimized runners) |
| Integration | Manual setup | Native GitHub integration |

## 🔄 Workflow Triggers

The pipeline runs on:
- **Push to main/develop** - Full CI/CD with deployment
- **Pull requests to main** - Tests only (no deployment)

## 🐳 Docker Images

Images are automatically tagged with:
- `latest` - Latest main branch build
- `{git-sha}` - Specific commit hash for rollbacks

## 🛠️ Local Development

You can still run everything locally:

```bash
# Backend tests
cd backend && ./mvnw test

# Frontend tests  
cd frontend && npm test

# Build Docker images locally
docker build -t reminders-backend ./backend
docker build -t reminders-frontend ./frontend
```

## 🚨 Troubleshooting

### Build Fails
1. Check the Actions tab for error logs
2. Ensure Docker Hub secrets are set correctly
3. Verify image names in workflow file

### Tests Fail
1. Run tests locally first: `npm test` or `./mvnw test`
2. Check if dependencies are up to date
3. Review test output in Actions logs

### Docker Push Fails
1. Verify Docker Hub token has push permissions
2. Check if repository exists on Docker Hub
3. Ensure image names are correct

## 🎯 Benefits

✅ **No infrastructure to manage**  
✅ **Automatic dependency caching**  
✅ **Built-in security scanning**  
✅ **Easy to understand and modify**  
✅ **Free for open source projects**  
✅ **Integrated with GitHub features**  

## 📚 Learn More

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Setup Java Action](https://github.com/actions/setup-java)
- [Setup Node Action](https://github.com/actions/setup-node)