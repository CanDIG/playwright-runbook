
# Installing Playwright

```bash
npm install
```

# Set .env

Rename `.env.sample` to `.env` and modify the values

# Running the Test

```bash
npx playwright test # Runs all tests in the default folder
npx playwright test --workers=1 --repeat-each=1 # Recommended for UI tests; for performance testing, adjust the number of workers and repeats as needed 
npx playwright test katsu # Runs a single test file 
npx playwright test katsu -g "service-info" # Run a single test inside a test file
```

# To switch between test folder

In `playwright.config.ts`, comment out the default folder and specify the folder you want to use:

```ts
export default defineConfig({
  // testDir: "./ui-tests",
  testDir: "./performance-tests",
  ...
```
