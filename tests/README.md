# Tests

Tests are located within each component:

- `functions/` - Jest unit tests (42 tests)
  - `src/*.test.ts` - API and auth tests
- `web/` - Vitest unit tests (9 tests)
  - `src/*.test.js` - Frontend utility tests

## Running Tests

```bash
# Run all tests
npm test

# Run function tests only
npm run test:functions

# Run web tests only
npm run test:web
```
