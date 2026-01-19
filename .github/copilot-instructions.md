# GitHub Copilot Instructions

## Package Management

**CRITICAL**: When adding npm dependencies to any package.json:

1. ✅ Run `npm install <package>` in the correct directory
2. ✅ Commit BOTH `package.json` AND `package-lock.json`
3. ✅ Never commit package.json without updating package-lock.json

The CI/CD pipeline uses `npm ci` which requires these files to be in sync.

## Development Workflow

- Use the dev mode bypass documented in `web/README.md` for UI-only testing
- Run tests before committing: `npm test`
- Follow existing code patterns and style
- Keep commit messages concise (3-5 bullets max)
