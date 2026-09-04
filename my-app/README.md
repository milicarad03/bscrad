# ORIGINAL IoT Host Application

This React and TypeScript application provides authentication, device and model
management, telemetry monitoring, and metadata-driven device dashboards. It is
the ORIGINAL host for the local `device-dashboard-ui-plugin` package.

## Features

- user registration, login, and logout;
- automatic session removal after an HTTP `401` response;
- administrator approval, rejection, and deletion of user accounts;
- device listing, filtering, registration, deletion, and reassignment;
- administrator bulk import of up to 1000 devices from JSON;
- device model-version changes;
- JSON Schema and mapping file upload;
- latest and historical telemetry views;
- Socket.IO telemetry and status updates;
- display of the latest device attribute snapshot;
- metadata-driven display and command controls;
- host registration of a custom `oil-gauge` renderer;
- Dark and Light host themes propagated to the UI plugin;
- system performance measurement from the browser to the backend controller.

## Prerequisites

- Node.js and npm;
- a built UI plugin in `../../dynamic-device-dashboard`;
- the backend at `http://localhost:3000` for real operation;
- port `5173` available for the Vite development server.

## Installation

Build the local UI plugin first:

```bash
cd ../../dynamic-device-dashboard
npm install
npm run build

cd ../bscrad/my-app
npm install
```

The dependency in `package.json` must remain:

```json
{
  "dependencies": {
    "device-dashboard-ui-plugin": "file:../../dynamic-device-dashboard"
  }
}
```

## Configuration

Optional `.env.local` values:

```dotenv
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_BASE_URL=http://localhost:3000
```

Both URLs default to `http://localhost:3000` when omitted. Local `.env` files
must not be committed.

## Run locally

```bash
npm run dev
```

Open `http://localhost:5173`. The JWT and authenticated email are stored in
`sessionStorage`, so closing the session or signing out removes the local login
context.

## Dynamic dashboard flow

The device details page loads:

1. the device and its active model version;
2. the `mapping.dashboard` configuration;
3. latest normalized telemetry and history;
4. the latest device attribute snapshot;
5. live status and telemetry through Socket.IO.

Telemetry arrays are converted to latest display values and then merged with
attributes. Attributes remain authoritative for values such as firmware and
hardware model and are not taken from stale telemetry history.

```tsx
<DynamicDeviceDashboard
  deviceId={device.serialNumber}
  config={device.modelVersion.mapping.dashboard}
  telemetry={pluginTelemetry}
  history={historicalData}
  onCommand={dashboardCommandHandler}
  disabled={device.status !== 'ONLINE'}
  schema={device.modelVersion.schema}
  availableBindings={Object.keys(device.modelVersion.mapping.fields)}
  stylePreset={dashboardTheme}
  showThemeSwitcher={false}
/>
```

Entering an online device page sends `SET_STATE/ACTIVE`. Leaving the page sends
`SET_STATE/IDLE`. Command controls are disabled for offline devices.

## Model-version upload and switching

Administrators upload a schema and mapping through the Model Versions page.
The schema file is read in the browser to prefill
`properties.schemaId.const`; final validation always remains on the backend.

When an administrator selects another version of the same model, the
application reloads the device. The displayed version, sections, bindings, and
controls then come from the new `mapping.dashboard` document. React code and
the built-in renderer registry stay unchanged.

`src/pages/__tests__/ModelSwitchScenario.test.tsx` covers a switch between two
model versions and verifies that old widgets disappear and new widgets render.
The Cypress dashboard scenario verifies the same behavior through the browser.

## Authentication and authorization

- unauthenticated users are redirected to login;
- `PENDING` and `REJECTED` accounts receive the appropriate message;
- Users and Model Versions navigation is hidden from ordinary users;
- the backend validates JWT, role, and device ownership again for every
  protected operation;
- the Socket.IO client sends the token through `auth.token`.

UI restrictions improve usability but are not a security boundary. Backend
guards remain authoritative.

## Bulk device import

An administrator can select **Import Devices** on Device Management, load
`devicesimulator/fleet/devices-100.json`, inspect the target user and model
distribution, and confirm the import.

The frontend validates the document shape and duplicate serial numbers before
sending `POST /device/bulk-import`. The backend validates the DTO, administrator
role, target user, and every model version again. The dialog reports created
and skipped devices and refreshes the list. Uploading the same manifest twice
is valid and returns existing devices as `skipped`.

## API and Socket.IO

Central API paths are defined in `src/api/config.ts`. `useDeviceTelemetry`
joins the selected device room, while the administrator status hook subscribes
to global device status updates.

Commands include the `x-ui-command-started-at` header. The backend uses it only
to measure arrival at the controller and returns an optional `performance`
object. Command execution and audit still use the regular correlation ID path.

## Host theme integration

The sidebar provides Dark and Light modes. `ThemeProvider` stores the choice in
`localStorage`, updates host CSS variables, and exposes the selected mode to the
device page. The page passes the corresponding preset to
`DynamicDeviceDashboard` and disables the plugin's internal switch, so one host
control changes the entire interface.

The login page defines its own readable form surfaces for both persisted theme
states.

## Unit and component tests

Run every Vitest suite:

```bash
npm test
```

Focused suites:

```bash
npx vitest run src/hooks/useAuth.test.ts
npx vitest run src/utils/telemetryAgregation.test.ts
npx vitest run src/pages/__tests__/ModelSwitchScenario.test.tsx
npx vitest run src/context/ThemeContext.test.tsx
npx vitest run \
  src/api/deviceBulkImport.test.ts \
  src/components/Dashboard/DeviceBulkImportDialog.test.tsx
```

These tests use jsdom and mocks for HTTP or component callbacks. They do not
require PostgreSQL, Redis, MQTT, CoAP, or a simulator.

## Browser E2E tests

Start the application on port `5173`, then run:

```bash
npx cypress run --spec \
  "cypress/e2e/login.cy.ts,cypress/e2e/device.cy.ts,cypress/e2e/device-dashboard.cy.ts,cypress/e2e/model-versions.cy.ts,cypress/e2e/user-management.cy.ts"
```

These scenarios render the real React application in a browser. Most backend
responses are controlled with `cy.intercept`, so they test UI workflows without
a real database, broker, or device. Covered flows include login, registration,
device management, user management, model upload, dynamic rendering, commands,
offline behavior, and model-version changes.

Build verification:

```bash
npm run build
```

## System performance test

This opt-in Cypress scenario requires the frontend, backend, PostgreSQL, Redis,
Mosquitto, an online simulator, and a valid JWT:

```bash
CYPRESS_PERFORMANCE_TOKEN='<JWT>' \
CYPRESS_PERFORMANCE_USER_EMAIL='user@example.com' \
CYPRESS_PERFORMANCE_DEVICE_ID='sp-100' \
CYPRESS_PERFORMANCE_SAMPLES=20 \
npm run performance:system
```

It measures:

- navigation start to a visible dynamic dashboard;
- UI command creation to receipt by the backend controller;
- minimum, maximum, average, median, and p95 for the configured samples.

This is not the complete MQTT or CoAP device round trip. The command timing
stops when the HTTP request reaches the controller. Results are printed as a
table and written to `performance-results/system-performance.json`.

## Directory structure

```text
src/api/                  API configuration, client, and bulk import
src/components/           management UI and custom renderer integration
src/context/              authentication and theme context
src/hooks/                users, devices, telemetry, and status hooks
src/pages/                authentication, dashboard, and device details
src/styles/               host layout and theme styles
src/utils/                telemetry transformation and aggregation
cypress/e2e/              browser workflows and performance scenario
cypress/fixtures/         controlled test data
performance-results/      latest system measurement JSON
```
