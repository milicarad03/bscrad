# Frontend Application Analysis

## 1. Scope and basis of this analysis

This document analyzes only the frontend project in its current working-tree state. It covers the React application, browser-side state, HTTP client, routing, Socket.IO clients, frontend data transformation, charts, forms, styling, and frontend tests. It does not analyze how any backend endpoint, database, Redis, MQTT system, simulator, server plugin, or other server-side mechanism works internally.

The locally installed `device-dashboard-ui-plugin` is treated only as a frontend dependency through the props passed to its exported `DynamicDeviceDashboard`; its internal implementation is outside this analysis.

## 2. Overall purpose of the frontend

The application is a browser-based device management and telemetry dashboard. Its implemented responsibilities are:

- user registration, login, session restoration, logout, and profile display;
- administrator-only user approval, rejection, and deletion controls;
- listing, searching, filtering, registering, deleting, and reassigning devices;
- listing device model versions, uploading model-version schema/mapping files, and applying another version of the same model to an online device;
- displaying a selected device's connection status, current telemetry, telemetry statistics, raw telemetry, dynamic per-field charts, and a telemetry table;
- building device command forms from command metadata and sending commands;
- receiving real-time device status and telemetry events through Socket.IO;
- showing request results and errors through inline messages and `react-hot-toast` notifications.

The project also contains a post/draft state layer and presentation components. `App` fetches posts and drafts after login, but the current `Dashboard` JSX does not render the post components. Therefore posts exist as implemented but currently have no visible dashboard tab.

## 3. Technology stack

The frontend is a React 19 + TypeScript single-page application bundled and served by Vite. It uses:

- React Router for browser-side routing;
- the Fetch API through a shared `apiClient` wrapper;
- `sessionStorage` for the JWT and stored email;
- Socket.IO Client for real-time updates;
- Recharts for line charts;
- `react-hot-toast` for notifications;
- Lucide React for icons;
- `loglevel` for scoped development/production logging;
- a local `device-dashboard-ui-plugin` package for schema/configuration-driven device dashboards;
- Vitest and Testing Library for hook tests;
- Cypress for end-to-end tests.

There is no Redux, Zustand, MobX, React Query, form library, or React context provider. State is managed with local hooks and custom hooks, then passed to child components through props.

## 4. Project structure

```text
my-app/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── cypress.config.ts
├── README.md
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── cypress/
│   ├── e2e/
│   │   ├── login.cy.ts
│   │   └── device.cy.ts
│   ├── fixtures/example.json
│   └── support/
│       ├── commands.ts
│       └── e2e.ts
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── App.css
    ├── api/
    │   ├── client.ts
    │   └── config.ts
    ├── assets/
    │   ├── hero.png
    │   ├── react.svg
    │   └── vite.svg
    ├── pages/
    │   ├── AuthPage.tsx
    │   ├── Dashboard.tsx
    │   └── DeviceDetailsPage.tsx
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useAuth.test.ts
    │   ├── usePosts.ts
    │   ├── useDevice.ts
    │   ├── useDeviceTelemetry.ts
    │   ├── useDeviceStatus.ts
    │   └── useDeviceFilters.ts
    ├── models/
    │   ├── auth.dto.ts
    │   ├── post.dto.ts
    │   ├── device.dto.ts
    │   ├── device-telemetry.dto.ts
    │   └── telemetry.dto.ts
    ├── utils/
    │   ├── commandFields.ts
    │   ├── telemetryTransformer.ts
    │   └── telemetryAgregation.ts
    ├── components/
    │   ├── UI/
    │   │   ├── Button.tsx
    │   │   ├── Card.tsx
    │   │   ├── Input.tsx
    │   │   ├── Form.tsx
    │   │   └── FilterDropdown.tsx
    │   ├── Dashboard/
    │   │   ├── Sidebar.tsx
    │   │   ├── UserList.tsx
    │   │   ├── DeviceList.tsx
    │   │   ├── DeviceTable.tsx
    │   │   ├── DeviceForm.tsx
    │   │   ├── DeviceDetailsModal.tsx
    │   │   ├── ModelVersionManager.tsx
    │   │   ├── PostForm.tsx
    │   │   ├── PostList.tsx
    │   │   └── DraftList.tsx
    │   └── DeviceCommands/
    │       ├── CommandCard.tsx
    │       ├── CommandField.tsx
    │       ├── CommandConsole.tsx
    │       └── LedColorPicker.tsx
    ├── styles/
    │   ├── base/
    │   │   ├── variables.css
    │   │   └── reset.css
    │   ├── components/
    │   │   ├── buttons.css
    │   │   ├── cards.css
    │   │   ├── forms.css
    │   │   ├── charts/
    │   │   │   ├── TelemetryChart.tsx
    │   │   │   └── TemperatureChart.tsx
    │   │   └── agregation/TelemetryAgregation.tsx
    │   └── layouts/
    │       ├── auth.css
    │       ├── dashboard.css
    │       ├── modal.css
    │       ├── DeviceDetails.css
    │       ├── deviceDetailsPage.css
    │       └── agregation.css
    └── test/setup.ts
```

### 4.1 Root configuration files

- `index.html` is the browser document. It provides `<div id="root"></div>` and loads `/src/main.tsx` as an ES module. It also selects `public/favicon.svg` as the favicon.
- `package.json` defines the Vite commands and all runtime/development dependencies.
- `package-lock.json` locks exact dependency resolutions for reproducible npm installation.
- `vite.config.ts` enables the React Vite plugin, the React Compiler Babel preset, and Vitest with a `jsdom` environment and `src/test/setup.ts`.
- `tsconfig.json` is a project-reference root pointing to the browser and Vite configuration projects.
- `tsconfig.app.json` configures the browser source: ES2023, DOM types, bundler module resolution, React JSX, no emit, and unused-variable checks.
- `tsconfig.node.json` configures `vite.config.ts` with Node types.
- `eslint.config.js` applies JavaScript, TypeScript, React Hooks, and React Refresh rules and ignores `dist`.
- `cypress.config.ts` enables Cypress E2E configuration but does not define a `baseUrl`; tests use `http://localhost:5173` explicitly.
- `README.md` is still the generic React/Vite template text, not application-specific documentation.

### 4.2 Public files and assets

- `public/favicon.svg` is referenced by `index.html`.
- `public/icons.svg` is a static icon sprite/file, but no current source file references it.
- `src/assets/hero.png` is displayed on `AuthPage`.
- `src/assets/react.svg` and `src/assets/vite.svg` are imported in `App.tsx` but not rendered. `hero.png` is also imported there unnecessarily; `AuthPage` performs the active import.

### 4.3 API layer

- `src/api/config.ts` owns the HTTP and Socket.IO base URLs and every named endpoint.
- `src/api/client.ts` is the common Fetch wrapper. It builds query strings, serializes JSON, handles `FormData`, adds the bearer token, normalizes network/HTTP errors, parses responses, and invokes the global unauthorized callback.

### 4.4 Pages

- `src/pages/AuthPage.tsx` renders and switches between login and registration.
- `src/pages/Dashboard.tsx` renders the sidebar and query-parameter-selected dashboard section.
- `src/pages/DeviceDetailsPage.tsx` renders the complete per-device controls, telemetry, analytics, charts, table, plugin dashboard, and command forms.

### 4.5 Hooks

- `useAuth.ts` owns authentication, profile, users, and auth form state.
- `usePosts.ts` owns post/draft state and requests.
- `useDevice.ts` owns devices, model versions, device registration/filter state, commands, reassignment, deletion, and model-version operations.
- `useDeviceTelemetry.ts` fetches initial telemetry and owns the selected device's telemetry Socket.IO connection.
- `useDeviceStatus.ts` owns the global device-status Socket.IO connection used by the device list.
- `useDeviceFilters.ts` implements a simple local search filter, but is not imported by the active device list; `DeviceList` duplicates this filtering inline.
- `useAuth.test.ts` tests the auth hook with a mocked API client and session storage.

### 4.6 Model files

- `auth.dto.ts` defines `UserDTO` and the login response `LoginDTO`.
- `post.dto.ts` defines `PostDTO` and `CreatePostDTO`.
- `device.dto.ts` defines devices, create-device payloads, command metadata, and model versions.
- `device-telemetry.dto.ts` defines telemetry records and flexible historical points.
- `telemetry.dto.ts` contains an older/simpler telemetry interface and is not used by active source code.

### 4.7 Utility files

- `commandFields.ts` groups metadata fields by their dotted path and turns flat dotted values such as `system.mode` into nested command payloads.
- `telemetryTransformer.ts` converts field-oriented telemetry sample arrays into timestamp-oriented chart rows.
- `telemetryAgregation.ts` calculates current, average, minimum, maximum, standard deviation, trend, sample count, and duration.

### 4.8 Styling

- `index.css` supplies global fonts, colors, root/body rules, typography, and scrollbar styling.
- `App.css` imports the modular base, component, and layout CSS.
- `styles/base` contains another variables/reset layer.
- `styles/components/*.css` style shared buttons, cards, and forms.
- `styles/layouts/*.css` style authentication, dashboard, modal, device details, and telemetry aggregation layouts.
- Despite being under `styles/components`, `TelemetryChart.tsx`, `TemperatureChart.tsx`, and `TelemetryAgregation.tsx` are React components, not stylesheets.

### 4.9 Tests

- `src/test/setup.ts` stubs `sessionStorage` for Vitest.
- `useAuth.test.ts` checks login, errors, logout, 401 behavior, registration, loading, approval failure, and deletion state.
- `cypress/support/commands.ts` adds `cy.login`.
- `cypress/support/e2e.ts` loads commands and suppresses two selected uncaught exception patterns.
- `login.cy.ts` covers authentication, registration, logout, protected navigation, and user approval with intercepted requests.
- `device.cy.ts` covers device roles, creation, filtering, deletion, errors, reassignment, status updates, 401 logout, and persistence. One test is currently marked `it.only`, so Cypress will focus that test when that spec is run.
- `cypress/fixtures/example.json` is the default example fixture and is not used by the examined tests.

## 5. Starting and initializing the React + Vite application

### Development and production commands

`package.json` defines:

- `npm run dev` → `vite`, which starts the Vite development server with HMR;
- `npm run build` → `tsc -b && vite build`, which type-checks project references and creates the production bundle;
- `npm run lint` → `eslint .`;
- `npm run preview` → `vite preview`, which serves a completed production build locally.

No `test` or `cypress` npm script is defined even though Vitest and Cypress are installed.

### Browser bootstrap

The initialization chain is:

1. The browser loads `index.html`.
2. `index.html` provides `#root` and imports `/src/main.tsx`.
3. `main.tsx` imports global `index.css` and `App`.
4. `createRoot(document.getElementById('root')!)` creates the React root.
5. `<App />` is rendered inside `<StrictMode>`.
6. `App.tsx` imports `App.css`, creates the application hooks, registers effects, installs the router and global toaster, and selects a route.

`StrictMode` adds React development checks and can intentionally mount/evaluate effects more than once in development. Each Socket.IO effect has cleanup that disconnects its socket, which is important under this behavior.

`vite.config.ts` also enables the React Compiler using `@rolldown/plugin-babel` and `reactCompilerPreset()`.

## 6. `main.tsx` and `App.tsx`

### `src/main.tsx`

`main.tsx` has one job: attach the React component tree to the DOM. It does not create state, routing, or providers itself.

### `src/App.tsx`

`App` is the top-level coordinator:

```text
App
├── useAuth()
├── usePosts(auth.token)
├── useDevice(auth.token)
├── unauthorized-handler effect
├── authenticated profile/post-loading effect
├── profile-dependent device/user-loading effect
└── BrowserRouter
    ├── Toaster
    └── Routes
```

The three custom-hook results are ordinary state objects, not contexts:

- `auth` is passed to all pages;
- `post` is passed to `Dashboard`;
- `device` is passed to `Dashboard`.

The first `useEffect` calls `setUnauthorizedHandler(() => auth.handleLogout())`. This gives `apiClient` a frontend-wide action for non-login HTTP 401 responses.

The second `useEffect`, depending on `auth.isLoggedIn` and `auth.token`, calls:

- `auth.fetchProfile()`;
- `post.fetchDrafts()`;
- `post.fetchPosts()`.

The third `useEffect`, after a profile ID exists, calls `device.fetchDevices()`. If `profile.role === 'ADMIN'`, it also calls `auth.fetchUsers()`.

The `Toaster` is positioned at the top center. Default duration is 3000 ms, and each toast gets a dark background, white text, and Raleway font.

## 7. Routing and protected routes

Routing is declared directly inside `App` with `BrowserRouter`, `Routes`, `Route`, and `Navigate` from `react-router-dom`.

| Path | Rendered behavior |
|---|---|
| `/` | Renders `AuthPage` when logged out; redirects to `/dashboard` when logged in. |
| `/dashboard` | Renders `Dashboard` when logged in; redirects to `/` when logged out. |
| `/device/:id` | Renders `DeviceDetailsPage` when logged in; redirects to `/` when logged out. |

The protection condition is `auth.isLoggedIn`, initialized as `Boolean(sessionStorage.getItem('token'))`. There is no separate `ProtectedRoute` component. A token's mere presence permits rendering until an API request rejects it and the shared 401 handler logs the user out.

There is no wildcard route. An unmatched URL has no matching page. Dashboard subsections are not nested routes; `Dashboard` reads the `tab` query parameter with `useSearchParams`. For example, `/dashboard?tab=devices` selects the device section. If there is no `tab`, it defaults to `profile`.

Role checks are UI conditions rather than route-level authorization:

- the sidebar adds `users` and `model-versions` only for `ADMIN`;
- the dashboard renders those sections only for `ADMIN`;
- device registration, deletion, owner filters, version application controls, and reassignment UI are selectively shown to administrators.

The JWT is not decoded in the browser. The frontend trusts the `role` received in the login user/profile data for display decisions. Server-side permission enforcement is outside this document.

## 8. Application state management and React hooks

### State architecture

There is no global state library and no `useContext`. The effective top-level state lives in hook instances created by `App`. `App` passes their returned state and methods down to pages and components.

`DeviceDetailsPage` is an exception: in addition to receiving the App-level `auth` object, it creates a second `useAuth()` instance for the admin user list and a second `useDevice(auth.token)` instance for the selected device. These instances do not share React state with the App-level hooks; they only share the browser's `sessionStorage` token and call the same endpoints.

### `useState`

Important uses include:

- `AuthPage.isLogin` selects login versus registration UI.
- `useAuth` stores token, login status, profile, users, auth field values, messages, and loading.
- `usePosts` stores feed posts, drafts, the user's posts, form fields, message, and a currently unused loading value.
- `useDevice` stores device/model arrays, form fields, selected filters, error/loading flags, and messages.
- `Dashboard` stores `selectedDevice` and `showModal`, although no current code opens the modal or assigns a selected device.
- `DeviceList` stores local searchable/realtime devices, search text, open dropdown, and discovered device types.
- `DeviceTable` stores a selected replacement version per device and the device currently being updated.
- `DeviceDetailsPage` stores transfer selection, stream command loading flags, displayed stream state, and command metadata.
- `useDeviceTelemetry` stores latest telemetry, HTTP/event history, loading, and accumulated chart points.
- `CommandCard` stores a flat command payload and execution state.
- `ModelVersionManager` stores model/version text, two selected files, and upload loading.

Each setter schedules a re-render of its owning hook/component. Props then propagate the new data to children.

### `useEffect`

Important effects are:

- `App`: install the 401 handler; fetch profile/posts after login; fetch devices/users after profile arrival.
- `useDevice`: clear filters and fetch model versions when its token changes; it creates an `AbortController` for cleanup.
- `Dashboard`: refetch devices when the devices tab is active; fetch users on the admin users tab; fetch models on the admin model-versions tab.
- `DeviceList`: synchronize incoming `device` props into `localDevices`; expose/remove a development-only `window.triggerStatusUpdate`; accumulate possible type names.
- `useDeviceStatus`: connect/disconnect the global status socket.
- `useDeviceTelemetry`: perform the initial HTTP telemetry requests and independently connect/disconnect the telemetry socket.
- `DeviceDetailsPage`: auto-send `SET_STATE ACTIVE` for an online device and send silent `SET_STATE IDLE` on cleanup; fetch users for admins; fetch devices when a token exists; fetch command metadata for the route ID.

### `useCallback`

`useDevice` memoizes:

- `resetError` with no dependencies;
- `fetchModels` by token;
- `fetchDevices` by token/loading/error state;
- `getCommandMetadata` by token;
- `updateDeviceStatus` with no dependencies;
- `uploadModelVersion` by token and `fetchModels`;
- `applyModelVersion` by token and `fetchDevices`.

These callbacks are used as effect dependencies or passed to children. `fetchDevices` changes identity when `loading` or `hasError` changes because both values are dependencies.

### `useMemo`

Only `ModelVersionManager` actively uses `useMemo`:

- `modelNames` deduplicates and sorts the known `modelId` values for a datalist;
- `sortedVersions` sorts model versions by model name and then version using numeric-aware `localeCompare`.

Telemetry transformation and aggregation are not memoized; they run again whenever `DeviceDetailsPage` or `TelemetryAggregationCard` renders.

### `useRef`

`useDevice` uses:

- `isSubmittingRef` to reject repeated device-create submissions before React's loading state updates;
- `abortControllerRef` to retain and abort the prior model request controller when the token/effect changes.

However, `apiClient` accepts a `signal` parameter but does not include `signal` in the actual `fetch` options. Therefore the controller currently does not cancel the browser request, even though callers and error handling are written as if it does.

### Router hooks

- `Dashboard` uses `useNavigate` for `/device/{serialNumber}` and `useSearchParams` for dashboard tabs.
- `DeviceDetailsPage` uses `useParams` to read `:id` and `useNavigate` to return to `/dashboard?tab=devices`.

## 9. Pages and component connections

### 9.1 `AuthPage`

`AuthPage` receives the App-level `auth` hook result. It displays `hero.png`, a heading, a shared `Form`, and a login/register switch.

For login it maps `auth.email` and `auth.password` to generated `Input` components and submits `auth.handleLogin`. For registration it maps `regName`, `regEmail`, and `regPassword` and submits `auth.handleRegister`. Switching modes clears both inline messages.

The imported `Card`, `Input`, and `Button` symbols in `AuthPage` are not used directly because `Form` renders them.

### 9.2 `Dashboard`

`Dashboard` receives `auth`, `post`, and `device` from `App` and renders:

- `Sidebar` on the left;
- a main content section selected by `?tab=`;
- `DeviceDetailsModal` at the root, although its `selectedDevice` remains `null` and `showModal` remains `false` in current code.

Implemented tabs:

- `profile`: email, role, and ID in a `Card`; it appears only after `auth.profile` exists.
- `overview`: static `Statistics...` placeholder.
- `devices`: device errors and `DeviceList`.
- `register-device`: `DeviceForm`.
- `notifications`: static no-notifications text.
- `users`: admin-only `UsersList`.
- `model-versions`: admin-only `ModelVersionManager`.

Although `Dashboard` imports post components and accepts the `post` object, the current JSX never uses either. Several other imports (`Input`, `Form`, `Button`, `useCallback`, `useLocation`) are also unused.

### 9.3 `Sidebar`

`Sidebar` constructs basic menu items on every render and appends Users and Model Versions for an admin. Clicking an item calls the supplied `setActiveTab`; in `Dashboard`, that updates the `tab` query parameter. The logout button calls `auth.handleLogout`. Icons come from Lucide.

On `DeviceDetailsPage`, the same sidebar is reused with `activeTab="devices"`, but its `setActiveTab` ignores the chosen tab and simply navigates to `/dashboard`.

### 9.4 Device list chain

The connection is:

```text
App/useDevice
  -> Dashboard
     -> DeviceList
        -> FilterDropdown (user/type controls)
        -> DeviceTable (rows/actions)
           -> route navigation or device/model actions
```

`DeviceList` copies the incoming device array into `localDevices`. This local copy allows `device:status_update` events to update row status without immediately mutating the App-level device state.

Its search is local and case-insensitive across name, type, serial number, and owner email. Type selection is applied both to the server request through `Dashboard.onFilterChange` and again locally in `filteredDevices`. User selection is sent as repeated `userId` query parameters but is not separately applied locally.

`DeviceTable` sorts devices by `ONLINE`, `OFFLINE`, then `UNINITIALIZED`. A row displays name, type, serial number, owner, model/version, and status. Clicking a row calls `navigate('/device/' + dev.serialNumber)`.

For admins, the row also includes:

- same-model alternative version selection;
- an apply button enabled only when the device is online and a version is selected;
- a confirm-protected delete button.

Click propagation is stopped in the action cell so using those controls does not open device details.

### 9.5 `DeviceForm`

`DeviceForm` is a controlled form whose values live in the App-level `useDevice` instance. It renders:

- admin-only owner selection;
- model-version selection;
- required serial number, name, and type inputs;
- Save/Cancel buttons;
- an inline status message.

Save calls `useDevice.handleCreateDevice`; Cancel resets the form and returns to the devices tab.

### 9.6 `UsersList`

`UsersList` renders user name, email, and status. Pending users receive confirm-protected approve and reject buttons. Every user receives a confirm-protected delete button. A refresh button calls `auth.fetchUsers`.

When `handleApproveUser` receives `REJECTED`, it removes the user locally and also invokes `handleDeleteUser`. Thus rejection triggers an approval-status PATCH followed by a deletion request from the frontend.

### 9.7 Model-version components

`ModelVersionManager` provides the admin model registry UI. It:

- lists sorted model/version/ID rows;
- offers model-name and version fields;
- accepts JSON schema and mapping files;
- reads the selected schema in the browser and, if present, copies `properties.schemaId.const` into the model-name field;
- calls `useDevice.uploadModelVersion` with a `FormData` payload;
- clears its local form after success;
- exposes manual refresh.

Device model information is also shown in `DeviceTable` as model name plus current version, in `DeviceForm` as selectable `modelId - version` options, and on the details page through the selected device's `modelVersion.mapping.dashboard` configuration.

`DeviceTable.getCandidates` allows only another version whose `modelId` equals the device's current model and whose ID differs from the current model-version ID.

### 9.8 `DeviceDetailsPage`

This page is driven by the route `id`, which is normally a serial number because `DeviceTable` navigates using `dev.serialNumber`. To support either form, it locates `currentDevice` by comparing `id` with both `device.id` and `device.serialNumber`.

The page creates three state/data sources:

- App-level `auth` from props;
- a local `useAuth()` instance for `users`/`fetchUsers`;
- a local `useDevice(auth.token)` instance for device lookup and management;
- `useDeviceTelemetry({deviceId: id, token: auth.token})` for telemetry.

It displays:

- stream start/stop commands and local stream status;
- admin-only ownership transfer;
- latest LED state/color and operating profile;
- `DynamicDeviceDashboard` when model mapping includes a dashboard configuration;
- current non-boolean top-level telemetry cards;
- calculated telemetry analytics;
- metadata-driven command cards;
- raw latest telemetry JSON;
- one Recharts chart per numeric telemetry field;
- a table of transformed historical telemetry;
- a plain list of available command names and fields.

While the local `useDevice` instance is loading, it returns `Loading system data...`. If loading ends without a matching device, it returns `Device not found`. The destructured `telemetryLoading` does not participate in rendering, so there is no separate visible initial telemetry loading state.

The page automatically sends `SET_STATE` with `{state: 'ACTIVE'}` after the fetched current device is online. Its effect cleanup silently sends `{state: 'IDLE'}` when leaving or when the effect is replaced while the device is connected.

### 9.9 Device command components

`DeviceDetailsPage` fetches `CommandMetadata[]`, maps it to `CommandCard`, and supplies `latestTelemetry.data` plus `executeCommand`.

`CommandCard`:

- stores field values in a flat object keyed by metadata path;
- derives `allowedPaths` from the command metadata;
- checks required values and numeric bounds;
- asks `CommandField` to render the correct control;
- calls `buildPayloadFromCommandFields` to construct nested JSON from dotted paths;
- disables execution if the device is offline, the data is invalid, the command is executing, or selected values appear already applied;
- clears its payload after success.

`CommandField` renders:

- up to four enum values as pill buttons;
- longer enums as a select;
- booleans as ON/OFF buttons;
- numbers/integers as numeric inputs with min/max visual feedback;
- other types as text inputs.

`CommandConsole` is an alternative grouped command UI and `LedColorPicker` is a specialized color component, but neither is rendered by the current page. `CommandConsole` uses `groupFieldsByPath`; the active `CommandCard` path does not use grouping. `LedColorPicker` and `CommandCard` each import a `Card` they do not render.

### 9.10 Post components

`PostForm`, `PostList`, and `DraftList` are simple card-based components for creating, listing, and publishing posts. They are imported into `Dashboard` but not rendered. The post requests still run through the App-level effect after login.

## 10. HTTP configuration and shared API client

### Base URLs

`src/api/config.ts` defines:

```ts
API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || API_BASE_URL
```

Only these two custom environment variables are read. Vite exposes them at build time because they use the `VITE_` prefix. `import.meta.env.DEV` is additionally used to select verbose logging and expose the development status-test helper.

### `apiClient`

`apiClient<T>(endpoint, method, body, token, params, signal)` performs the following frontend work:

1. Starts with the endpoint URL.
2. Converts `params` into `URLSearchParams`; arrays become repeated query keys.
3. Detects `FormData`.
4. Adds `Content-Type: application/json` for every non-FormData request.
5. Adds `Authorization: Bearer <token>` when a token exists.
6. Serializes non-FormData bodies with `JSON.stringify`.
7. Calls `fetch` with `method`, `headers`, and `body`.
8. Converts browser/network failures to `Error('NetworkError')`, except `AbortError`.
9. For 401 from `/users/login`, rejects with the server message without invoking global logout.
10. For other 401 responses, invokes the registered unauthorized handler and rejects.
11. For other non-2xx responses, tries `message`/`errors`, joins arrays, and throws a normalized `Error`.
12. Reads successful responses as text; an empty body returns `null`, valid JSON is parsed, and invalid/other text also returns `null`.

Frontend consequences:

- Login and registration have no Authorization header because those calls omit the token.
- All authenticated calls use the bearer token.
- Model upload leaves `Content-Type` unset so the browser can add the multipart boundary.
- Unlike the Socket.IO clients, HTTP fetch does not set `credentials`.
- The `signal` argument is currently not included in `fetch(...)`, so caller cancellation is ineffective.

## 11. Complete API inventory

Every URL below is prefixed by `API_BASE_URL`.

### Authentication and users (`useAuth`)

| Method and path | Frontend initiator | Body | Response/state/UI |
|---|---|---|---|
| `POST /users/login` | `handleLogin` from `AuthPage` | `{email, password}` | Expects `LoginDTO`; stores JWT/email, profile, and logged-in state. |
| `POST /users/user` | `handleRegister` from `AuthPage` | `{name, email, password}` | Expects `UserDTO`; shows success message and clears registration fields. |
| `GET /users/profile` | `fetchProfile`, called by `App` after login/restoration | none | Stores `profile`; profile/role drive dashboard display. |
| `GET /users/allusers` | `fetchUsers`, called by `App`, dashboard Users tab, or details admin effect | none | Reverses the returned array and stores `users`; displayed in `UsersList`, filters, forms, or transfer select depending on hook instance. |
| `DELETE /users/user/:id` | `handleDeleteUser` from `UsersList` or rejection flow | none | Removes user locally and shows a toast. |
| `PATCH /users/approval/:id` | `handleApproveUser` from `UsersList` | `{status: 'APPROVED' | 'REJECTED'}` | Updates local status; rejection also initiates deletion. |

### Posts (`usePosts`)

| Method and path | Frontend initiator | Body | Response/state/UI |
|---|---|---|---|
| `GET /post/feed` | `fetchPosts`, called by `App` after login | none | Reverses and stores `posts`; not currently rendered. |
| `GET /post/drafts` | `fetchDrafts`, called by `App` after login | none | Stores `drafts`; not currently rendered. |
| `GET /post/myposts` | `fetchMyPosts` | none | Stores `myPosts`; no active caller/render. |
| `POST /post/post` | `handleCreatePost` | `{title, content}` | Prepends returned post to drafts and clears fields; no active caller/render. |
| `PUT /post/publish/:id` | `publishPost` | none | Prepends returned post to feed, removes draft, shows toast; no active caller/render. |

### Devices (`useDevice` and `useDeviceTelemetry`)

| Method and path | Frontend initiator | Body/query | Response/state/UI |
|---|---|---|---|
| `GET /device` | `fetchDevices` from `App`, `Dashboard`, refresh/filter actions, and details page | optional repeated `userId` and `type` query params | Expects `{data: DeviceDTO[], meta}`; stores `data` in `devices`, ultimately displayed by `DeviceTable` or used to find `currentDevice`. |
| `POST /device` | `handleCreateDevice` from `DeviceForm` | `{serialNumber, name, type, targetUserId?, modelVersionId?}` | Prepends created device, refetches devices/models, resets fields, displays inline message/toasts. |
| `DELETE /device/:id` | `handleDeleteDevice` from admin table | none | Removes matching device from local state and shows toast. |
| `PATCH /device/:id/reassign` | `handleReassignDevice` from device details | `{targetUserId}` | Shows toast and refetches devices. |
| `POST /device/:id/command` | `sendDeviceCommand` from stream controls, command cards, plugin dashboard, and details cleanup | `{command, payload}` | Success/error toast unless silent; callers update their own UI state. |
| `GET /device/:id/command-metadata` | `getCommandMetadata`, called by details effect | none | Stores `CommandMetadata[]` in page state and generates command controls/list. |
| `GET /device/:id/telemetry/latest` | first `useDeviceTelemetry` effect | none | Stores `latestTelemetry`; also seeds `chartData`. |
| `GET /device/:id/telemetry` | first `useDeviceTelemetry` effect | none | Stores returned array in `telemetryHistory`. |
| `PATCH /device/:id/model-version` | `applyModelVersion` from `DeviceTable` | `{modelVersionId}` | Shows applied/restart toast and refetches devices. |

### Model versions (`useDevice`)

| Method and path | Frontend initiator | Body | Response/state/UI |
|---|---|---|---|
| `GET /model-versions` | token effect, dashboard tab, refresh, and post-create/upload refresh | none | Stores `ModelVersionDTO[]`; displayed by registry, device form, and table version selectors. |
| `POST /model-versions/upload` | `uploadModelVersion` from `ModelVersionManager` | multipart `FormData`: `modelName`, `version`, `schema`, `mapping` | Shows toast, refetches versions, clears manager form. |

### Defined but unused endpoint constants

`config.ts` also defines the following, but no current frontend function calls them:

- `GET_ONE`: `/device/:id`;
- `TOGGLE`: `/device/:id/toggle`;
- `DEVICE_DASHBOARD`: `/device-dashboard/devices`;
- model-version `GET_ONE`: `/model-versions/:id`.

## 12. Authentication and JWT lifecycle

### Initial session restoration

`useAuth` initializes both `token` and `isLoggedIn` synchronously from `sessionStorage.getItem('token')`. A page reload therefore starts in the logged-in routing branch when the token exists. `App` then requests `/users/profile`; a non-login 401 causes global logout.

### Login

`AuthPage` submits `useAuth.handleLogin`:

1. `preventDefault()` stops navigation.
2. Explicit validation rejects an empty email/password and sets an inline message.
3. Loading becomes true and the form button displays `Executing`.
4. `apiClient` posts JSON to `/users/login` without a bearer token.
5. On success, `userEmail` and `accessToken` are stored in `sessionStorage` as `userEmail` and `token`.
6. Hook state receives the token, `isLoggedIn = true`, and the response user as profile.
7. `App` re-renders; `/` becomes `<Navigate to="/dashboard">`.
8. Authenticated effects fetch the profile, posts, drafts, model versions, devices, and—if admin—users.

The frontend does not set an expiration timer, refresh the token, inspect claims, or use cookies for the HTTP JWT.

### Logout

`handleLogout` calls `sessionStorage.clear()`, not just removal of application-specific keys. It then resets login state, users, login fields, token, and profile and sets the message to `Logged out successfully`. The next render redirects protected pages to `/`.

Logout occurs from the sidebar or from `apiClient` after a non-login 401. A login 401 is treated as invalid credentials and preserves the login form/session logic.

### Roles and permissions

The only explicit recognized role string is `ADMIN`; everything else receives the regular UI. Role checks affect what is visible, but both authenticated routes are open to any logged-in role. No permission matrix, claims parser, or frontend ACL service exists.

## 13. Device display and management

### Fetching and ownership filtering

`useDevice.fetchDevices(filters)` requests `/device`. `apiClient` serializes arrays as repeated query parameters, for example:

```text
/device?userId=2&userId=5&type=SENSOR&type=GATEWAY
```

The response's `data` field becomes `useDevice.devices`. `Dashboard` passes it to `DeviceList`, which copies it into `localDevices`, filters it, and passes it to `DeviceTable`.

`DeviceList` maintains `allPossibleTypes` as a union of types it has seen. It does not remove a type when later responses omit it.

`fetchDevices` is declared `async`, but it starts the `apiClient(...).then(...).catch(...)` chain without returning or awaiting that chain. Calling code can invoke it normally, but `await fetchDevices()` resolves before the underlying HTTP chain finishes. Its `loading || hasError` guard also means a retry invoked immediately after `resetError()` can still see the previous `hasError` value in the current render closure and return early.

### Creating devices

`DeviceForm` controls `useDevice` state. `handleCreateDevice` uses `isSubmittingRef` and `loading`, sends the create payload, prepends the response, refetches devices and models, and resets creation/filter selections.

### Deleting and reassigning

Deletion requires browser confirmation in `DeviceTable`, sends DELETE, and filters the local App-level devices on success. Reassignment requires a selected approved user plus confirmation in `DeviceDetailsPage`, sends PATCH, clears the selection, and requests devices again in that page's local hook instance.

### Device model versions

`useDevice` fetches model versions whenever a hook instance receives a token. Because App and `DeviceDetailsPage` each instantiate `useDevice`, model versions can be fetched by both instances.

The table displays the current model from `modelVersion.modelId`, falling back to `modelVersion.model.name`, and the current version. Admins can select a different version of the same model. Applying is disabled unless the device status is `ONLINE`.

## 14. Telemetry HTTP loading and frontend representations

`useDeviceTelemetry` starts a `Promise.all` with:

- `GET /device/:id/telemetry/latest`;
- `GET /device/:id/telemetry`.

If both succeed:

- `latestTelemetry` receives the latest record;
- `telemetryHistory` receives the history endpoint array;
- `chartData` is seeded from `latest.data.historicalTelemetry`, followed by an object containing `latest.timestamp` and the other latest data fields.

If either request fails, the combined operation logs the error and neither success handler runs. There is no telemetry error state or toast; `loading` becomes false in `finally`.

There are three distinct history-like representations:

1. `telemetryHistory`: HTTP record history; after a Socket.IO event, the new record is prepended and the array is limited to five.
2. `chartData`: an accumulated point array; Socket.IO events append a point and keep the last 100.
3. `historicalData`: computed by `DeviceDetailsPage` only from `latestTelemetry.data` using `transformTelemetryForCharts`.

Only `historicalData` is currently rendered in the charts, table, aggregation card, and plugin history prop. `telemetryHistory` and `chartData` are destructured in the page but unused. Thus the actual visible chart history is whatever sample arrays are contained inside the current `latestTelemetry.data`, not the hook's five-record or 100-point accumulated state.

## 15. Telemetry transformation and visible values

The visible device-details logic assumes telemetry fields can be arrays of `[value, timestamp]` pairs.

`transformTelemetryForCharts` processes the object field by field:

1. Non-array fields are ignored.
2. Each `[value, timestamp]` pair creates or updates a map entry for that timestamp.
3. The field's value is added to the timestamp row.
4. Map values are converted to an array.
5. Rows are sorted oldest-to-newest.

Example:

```json
{
  "temperature": [[21.5, "2026-08-15T10:00:00Z"]],
  "humidity": [[48, "2026-08-15T10:00:00Z"]]
}
```

becomes:

```json
[
  {
    "timestamp": "2026-08-15T10:00:00Z",
    "temperature": 21.5,
    "humidity": 48
  }
]
```

`DeviceDetailsPage` then:

- identifies every numeric field in any row;
- builds current metric cards by taking `[0]` from the last sample of each top-level array;
- gets LED state/color similarly;
- builds `pluginTelemetry` by flattening each top-level sample array to its last value;
- filters table rows to rows containing at least one number;
- passes the transformed array to every chart, the analytics card, table, and plugin.

The nested `system.status.operatingProfile` is read directly rather than transformed.

There is a TypeScript/shape inconsistency worth documenting: `TelemetryData` declares `led?: boolean` and `ledColor?: string`, while `DeviceDetailsPage` treats both as arrays of samples. The generic index signature allows other unknown data, but the rendered logic is specifically array-oriented.

## 16. Recharts implementation

The active chart component is `styles/components/charts/TelemetryChart.tsx`.

For each numeric telemetry field, `DeviceDetailsPage` creates a `Card` and passes the complete `historicalData` array plus `field`, `label`, and unit.

`TelemetryChart`:

- filters rows where the selected field is numeric;
- maps them to `{index, timestamp, value}`;
- displays an empty state if none remain;
- uses `ResponsiveContainer` with a height of 380;
- uses `LineChart`, `CartesianGrid`, `XAxis`, `YAxis`, `Tooltip`, and `Line` from Recharts;
- uses the sequential `index` as the X-axis key, formatting its matching timestamp as time;
- expands the Y domain by five below/above min/max;
- formats tooltip values to one decimal place and includes the unit;
- renders a monotone orange line without dots.

`TemperatureChart.tsx` is an older specialized Recharts component. It maps timestamps to epoch milliseconds and temperature to one decimal place, but no active page imports it.

## 17. Telemetry aggregation

`TelemetryAggregationCard` calls `TelemetryAggregator.aggregateAllMetrics(historicalData)` on each render.

For every numeric field found anywhere in the rows, `TelemetryAggregator` calculates:

- latest/current value;
- average;
- minimum and maximum;
- population standard deviation;
- trend by comparing the first quarter's average with the last quarter's average;
- absolute percentage change, treating changes below 2% as stable.

The component displays metric cards, trend icons/colors, a range-position bar, and a summary table. Units are explicitly mapped only for temperature, humidity, and pressure in this component.

With an empty history, `Math.max(...[]) - Math.min(...[])` yields a non-finite duration, so the displayed duration can become `NaN`; start/end fall back to empty strings.

## 18. Socket.IO and real-time behavior

Both socket hooks connect to `WS_BASE_URL`, defaulting to the same origin value as `API_BASE_URL`. Both specify:

- `withCredentials: true`;
- reconnection enabled;
- 5 reconnection attempts;
- 3000 ms initial reconnection delay;
- 10000 ms maximum delay;
- 5000 ms connection timeout.

Neither socket supplies the JWT through `auth`, query parameters, or explicit headers in the frontend configuration.

### Device-status socket: `useDevicesStatuses`

Mounted by `DeviceList` while the devices tab is rendered.

| Direction/event | Frontend behavior |
|---|---|
| receive `connect` | Logs connection and emits `devices:subscribe_statuses`. |
| emit `devices:subscribe_statuses` | Requests the global status stream; no payload. |
| receive `device:status_update` | Calls `onStatusUpdate(payload.deviceId, payload.status)`. |
| receive `disconnect` | Logs the reason. |
| receive `connect_error` | Logs the error. |
| receive `reconnect_attempt` | Logs the attempt number. |

`DeviceList` handles a status update by mapping `localDevices` and replacing the matching device whose `serialNumber === payload.deviceId`. React re-renders `DeviceList` and `DeviceTable`, and the row changes its icon/text/color.

The callback passed to `useDevicesStatuses` is an inline function. Since the hook's effect depends on `onStatusUpdate`, every `DeviceList` render gives it a new function identity and can cause socket cleanup/reconnection. A received status itself updates local state and triggers such a render.

### Device telemetry socket: `useDeviceTelemetry`

Mounted by `DeviceDetailsPage`.

| Direction/event | Frontend behavior |
|---|---|
| receive `connect` | Emits `device:subscribe` with `{deviceId}`. |
| emit `device:subscribe` | Selects the route device's telemetry stream. |
| receive `telemetry:update` | Replaces latest telemetry, prepends to five-record history, appends to 100-point chart state. |
| receive `disconnect` | Logs the disconnect. |
| receive `connect_error` | Logs the error. |
| receive `reconnect_attempt` | Logs the attempt number. |

The socket effect depends on `deviceId`, not the token. Its cleanup calls `socket.disconnect()`. The handler does not perform a second device-ID check; every `telemetry:update` delivered to this socket is accepted as the selected device's update.

## 19. Complete real-time telemetry update trace

The actual implemented flow from event to screen is:

1. `DeviceDetailsPage` calls `useDeviceTelemetry` with the route ID and JWT.
2. The hook's second `useEffect` calls `io(WS_BASE_URL, options)`.
3. On `connect`, it emits `device:subscribe` with `{deviceId: id}`.
4. The socket receives `telemetry:update` carrying a `DeviceTelemetryDTO`.
5. `setLatestTelemetry(telemetry)` replaces the latest record.
6. `setTelemetryHistory` prepends the record and retains five. This state is not rendered.
7. `setChartData` appends `{timestamp, ...telemetry.data}` and retains 100. This state is also not rendered.
8. The latest-state change re-renders `DeviceDetailsPage`.
9. The page recalculates LED state/color, profile, current metrics, flattened plugin telemetry, and `historicalData = transformTelemetryForCharts(latestTelemetry.data)`.
10. Raw JSON immediately displays the new `latestTelemetry.data`.
11. Current cards and LED/profile status render values extracted from the new data.
12. `DynamicDeviceDashboard` receives the new flattened `telemetry` and transformed `history` props.
13. `TelemetryAggregationCard`, each `TelemetryChart`, and the history table receive the newly transformed `historicalData` and re-render.

Important consequence: if each `telemetry:update.data` contains complete field sample arrays, visible chart/history can show those arrays. If an event contains only a single delta sample, visible charts show only that event's transformed samples, despite the separate unused 100-point `chartData` accumulation.

## 20. One complete HTTP API request trace: device list

This trace uses the post-profile initial device load:

1. Successful login/profile loading gives `App` an `auth.profile.id`.
2. The profile-dependent `useEffect` in `App.tsx` calls the App-level `device.fetchDevices()`.
3. `fetchDevices` in `useDevice.ts` checks `loading`/`hasError`, sets loading, and calls `apiClient` with `ENDPOINTS.DEVICE.BASE`, `GET`, a null body, the JWT, and optional filters.
4. `config.ts` resolves this endpoint to `${API_BASE_URL}/device`.
5. If filters exist, `apiClient` appends their scalar or repeated-array query values.
6. The request includes `Content-Type: application/json` and `Authorization: Bearer <JWT>`. It has no body and does not set fetch credentials.
7. `apiClient` rejects normalized failures or parses the successful response text as `{data: DeviceDTO[], meta: ...}`.
8. `fetchDevices` stores `res.data` in the App-level `devices` state.
9. React re-renders `App` and `Dashboard` with the updated `device` object.
10. On the devices tab, `Dashboard` passes the array to `DeviceList`.
11. `DeviceList`'s synchronization effect copies it to `localDevices`, causing another render.
12. The component searches/filters the array and passes it to `DeviceTable`.
13. `DeviceTable` sorts and displays each row.

If this request returns 401, `apiClient` invokes the handler registered by `App`; `handleLogout` clears session/auth state and the route redirects to `/`.

## 21. Forms and validation

### Shared auth form

`Form` receives a field descriptor array and creates controlled `Input` components. Native `required` attributes provide browser validation. `handleLogin` adds an explicit empty-field check. Registration relies on native required fields and error messages returned through `apiClient`.

### Device form

Serial number, name, and type are native-required. Owner and model selects are optional in JSX. Loading disables Save and Cancel. `isSubmittingRef` provides an additional repeat-submit guard.

### Model upload form

Model name, version, schema file, and mapping file are required. `handleSubmit` repeats the presence guard. File controls use `.json,application/json`. The selected schema is parsed only to auto-detect a model name; parse errors are silently ignored. There is no complete schema/mapping semantic validation in frontend code.

### Command forms

Command controls are generated from metadata. `CommandCard.isInvalid` checks required values and min/max for fields whose type is exactly `number`. `CommandField` also visually checks ranges for `number` and `integer`, but `CommandCard` does not apply its min/max invalidation branch to `integer`.

### Confirmation feedback

Native `window.confirm` is used before user approval/rejection/deletion, device deletion, and ownership transfer.

## 22. Loading, errors, notifications, and feedback

### Loading

- Auth sets one `loading` value for login and registration; `Form` disables submit and displays `Executing`.
- Device state uses one `loading` flag for list fetching and creation; the device form and details loading screen consume it.
- Model-version upload has local `loading` and displays `VALIDATING...`.
- Applying a device version stores `updatingDeviceId` and displays `UPDATING...`.
- Command cards store `isExecuting` and display `SENDING...`.
- Stream buttons separately track starting/stopping.
- `useDeviceTelemetry.loading` is returned but not visibly used by the page.
- `usePosts.loading` is defined but never changed.

### Inline messages

- Login and registration use `message`/`regMessage` in `Form`.
- Device creation uses `useDevice.message` in `DeviceForm`.
- Dashboard displays a fixed red device-load error when `hasError` is true.
- Details displays full-page loading or not-found text.

### Toasts

`react-hot-toast` is used for profile/user request errors, device errors and successes, post operations, model-version operations, and commands. `App` supplies the global `Toaster`.

Some command paths can produce duplicate feedback: `sendDeviceCommand` shows a success toast, then `executeCommand` or `handleCommand` shows another success toast. Similarly, non-offline failures can be toasted inside `sendDeviceCommand` and again by an outer caller.

### Logging

`useAuth`, `useDevice`, `useDeviceTelemetry`, and `useDeviceStatus` use named `loglevel` loggers. Development level is `debug`; production level is `warn`. Several direct `console.log`, `console.error`, and `console.count` calls also remain.

## 23. Icons and UI libraries

Lucide React supplies semantic SVG React components:

- sidebar: dashboard, CPU/device, bell, users, user, logout, package-plus;
- device list/table: refresh, trash, circle status, radio/uninitialized, model refresh;
- user list: refresh, trash, check, and X.

Shared custom UI primitives are `Button`, `Card`, `Input`, `Form`, and `FilterDropdown`. They are thin wrappers and accept props rather than implementing a full design system.

The dashboard plugin is rendered only when `currentDevice.modelVersion.mapping.dashboard` exists. The page passes:

- `deviceId`;
- dashboard `config`;
- the flattened latest `telemetry` object;
- transformed `history`;
- `onCommand`, which forwards to `sendDeviceCommand`.

## 24. Important dependencies from `package.json`

### Runtime

| Dependency | Use in this frontend |
|---|---|
| `react` | Components, rendering model, and hooks. |
| `react-dom` | `createRoot` in `main.tsx`. |
| `react-router-dom` | BrowserRouter, route matching, redirects, params, navigation, and dashboard query parameters. |
| `socket.io-client` | Per-device telemetry and global status real-time connections. |
| `recharts` | Responsive line charts and axes/tooltips/grid. |
| `react-hot-toast` | Global toaster plus imperative success/error feedback. |
| `lucide-react` | Sidebar and management icons. |
| `loglevel` | Named, environment-dependent frontend loggers. |
| `device-dashboard-ui-plugin` | Dynamic device dashboard rendered from model mapping, using telemetry/history and command callbacks. |

### Development

| Dependency | Use |
|---|---|
| `vite` | Development server and production bundler. |
| `typescript` | Static type checking and project builds. |
| `@vitejs/plugin-react` | React JSX/refresh integration and compiler preset export. |
| `@rolldown/plugin-babel`, `@babel/core`, `babel-plugin-react-compiler` | React Compiler transformation configured by Vite. |
| `vitest`, `jsdom`, `@testing-library/react` | Hook/unit testing in a browser-like DOM. |
| `cypress` | Browser E2E testing. |
| `eslint`, `@eslint/js`, `typescript-eslint` | Linting. |
| `eslint-plugin-react-hooks` | Hook rule enforcement. |
| `eslint-plugin-react-refresh` | Vite/React Fast Refresh export checks. |
| `@types/react`, `@types/react-dom`, `@types/node`, `@types/babel__core` | TypeScript declarations. |
| `globals` | Browser globals for ESLint. |

## 25. Important implementation observations

These are frontend facts that affect how the current code executes:

- No `useContext` or central store is used; custom hook instances are independent.
- `DeviceDetailsPage` creates new auth/device hook state instead of reusing all App-level state.
- Posts and drafts are fetched after login but not displayed.
- `telemetryHistory` and `chartData` are maintained but not rendered; visible charts use only transformed `latestTelemetry.data`.
- The Socket.IO clients do not explicitly send the JWT.
- The status socket can reconnect on every device-list render because its callback dependency is unstable.
- `apiClient` receives but does not pass an `AbortSignal` to `fetch`.
- `fetchDevices` does not return/await its request chain, so callers cannot truly await completion; its error guard can also complicate immediate retries.
- The dashboard modal has state/JSX but no current opening path.
- `useDeviceFilters`, `TemperatureChart`, `CommandConsole`, and `LedColorPicker` are not part of the active rendered flow.
- Several imports are unused. Because `tsconfig.app.json` enables `noUnusedLocals`, these are relevant to a TypeScript build even though they do not change runtime intent.
- Several `usePosts` error paths call `toast.error(err)` with the `Error` object instead of `err.message`, unlike most other hooks.
- There is no wildcard route and no dedicated not-found page.
- A token's presence is the initial protected-route check; validity is discovered through subsequent requests.

## 26. Complete frontend execution flow in order

The following is the actual main flow for a logged-out user who signs in and opens a device:

1. Vite serves `index.html`.
2. The browser imports `main.tsx`.
3. React creates the root and renders `App` in `StrictMode`.
4. `App` calls `useAuth`, `usePosts`, and `useDevice`.
5. `useAuth` checks `sessionStorage`; with no token, `isLoggedIn` is false.
6. `BrowserRouter` matches `/`, and `AuthPage` renders.
7. The user types into controlled login fields; `useAuth` state updates on every change.
8. The form calls `handleLogin`.
9. `apiClient` sends `POST /users/login` with JSON credentials.
10. On success, `handleLogin` stores the access token and user email in `sessionStorage`, then updates token, logged-in, and profile state.
11. React re-renders; the `/` route redirects to `/dashboard`.
12. App effects request profile, posts, and drafts. The token-dependent `useDevice` effect requests model versions.
13. After profile state contains an ID, App requests devices and requests users for an admin.
14. `Dashboard` reads `?tab=`; without one it displays Profile.
15. The user clicks Device Management. `Sidebar` sets `?tab=devices`.
16. The devices-tab effect requests devices again.
17. `DeviceList` receives devices, synchronizes `localDevices`, opens the status socket, and emits `devices:subscribe_statuses` after connecting.
18. `DeviceTable` sorts and displays rows. Status events update the local row state in real time.
19. The user clicks a row. `Dashboard` navigates to `/device/{serialNumber}`.
20. `DeviceDetailsPage` reads the ID and creates its local device/auth state plus `useDeviceTelemetry`.
21. The telemetry hook concurrently requests latest/history telemetry and opens a telemetry socket.
22. The local device hook fetches model versions and devices; the page also requests command metadata and, for an admin, users.
23. When the current device is found and online, the page auto-sends `SET_STATE ACTIVE`.
24. Initial telemetry is stored; the page transforms `latestTelemetry.data` and renders metrics, analytics, plugin UI, raw JSON, charts, and table.
25. The socket connects and emits `device:subscribe` for the route ID.
26. A `telemetry:update` replaces `latestTelemetry` and also updates the hook's separate history arrays.
27. React re-renders the page; visible derived telemetry is recalculated from the new latest record.
28. New current values/raw JSON/plugin props/charts/table appear according to the sample arrays in that record.
29. When the user leaves, the telemetry socket disconnects and the page attempts a silent `SET_STATE IDLE` if the device was connected.
30. Logout clears `sessionStorage` and auth state; protected routing returns to `/`.

For a browser session that already has `sessionStorage.token`, step 5 begins as logged in, `/` redirects immediately, and profile validation/loading happens afterward.

## 27. Final summary for an implementation chapter

### 27.1 Most important pages and components

- `App`: state-domain composition, request-triggering effects, unauthorized logout, router, and toaster.
- `AuthPage` + `Form`: controlled login/registration interface.
- `Dashboard` + `Sidebar`: query-parameter-selected management workspace and role-sensitive navigation.
- `DeviceList` + `DeviceTable`: search/filter, live status, device/model display, delete, navigation, and model update.
- `DeviceForm`: device provisioning form.
- `UsersList`: admin approval/rejection/deletion UI.
- `ModelVersionManager`: model/version upload and registry.
- `DeviceDetailsPage`: selected-device orchestration, telemetry, commands, dynamic dashboard, charts, statistics, and transfer.
- `CommandCard` + `CommandField`: metadata-driven command payload UI.
- `TelemetryChart` + `TelemetryAggregationCard`: telemetry visualization and statistics.

### 27.2 Most important API calls

- `POST /users/login` and `GET /users/profile` establish and validate the frontend session.
- `GET/POST /device` load and create devices.
- `GET /device/:id/telemetry/latest` and `GET /device/:id/telemetry` seed telemetry state.
- `GET /device/:id/command-metadata` generates command controls.
- `POST /device/:id/command` sends stream, generated, and plugin commands.
- `PATCH /device/:id/reassign` changes the selected owner from the UI.
- `GET /model-versions`, `POST /model-versions/upload`, and `PATCH /device/:id/model-version` implement model-version management.
- Admin user management uses `/users/allusers`, `/users/approval/:id`, and `/users/user/:id`.

### 27.3 Important Socket.IO events

- Emit `devices:subscribe_statuses` after the device-list socket connects.
- Receive `device:status_update` and update the matching row's local status.
- Emit `device:subscribe` with `{deviceId}` after the details socket connects.
- Receive `telemetry:update`, replace latest telemetry, and update the hook's history arrays.
- `connect`, `disconnect`, `connect_error`, and `reconnect_attempt` are used for lifecycle logging.

### 27.4 How telemetry reaches charts and UI

```text
HTTP latest or Socket.IO telemetry:update
  -> useDeviceTelemetry.latestTelemetry
  -> DeviceDetailsPage re-render
  -> transformTelemetryForCharts(latestTelemetry.data)
  -> timestamp-oriented historicalData
  ├── current/LED/profile/raw JSON displays
  ├── DynamicDeviceDashboard telemetry/history props
  ├── TelemetryAggregationCard
  ├── one TelemetryChart per numeric field
  └── telemetry history table
```

The thesis should explicitly distinguish this rendered path from the currently unused `telemetryHistory` and `chartData` state maintained in the hook.

### 27.5 Main frontend implementation points to describe in a diploma thesis

1. Vite/React initialization and component-tree creation.
2. Declarative SPA routing and conditional protected routes.
3. JWT session persistence in `sessionStorage`, bearer-header injection, and centralized 401 logout.
4. Custom-hook separation for auth, posts, devices, telemetry, and status.
5. Prop-based state sharing instead of context or an external store.
6. Role-sensitive admin UI and its distinction from route protection.
7. A centralized generic Fetch client with JSON, multipart, query, and error handling.
8. Controlled forms, native validation, metadata-driven command forms, and nested payload construction.
9. Device list composition, local search/filtering, server query filtering, and live status updates.
10. Model-version registry, browser-side schema model-name detection, upload, and online-device version selection.
11. Initial telemetry loading through HTTP followed by real-time Socket.IO updates.
12. Conversion from field-oriented `[value, timestamp]` arrays to timestamp-oriented rows.
13. Dynamic discovery of numeric telemetry fields and generation of charts/cards/tables.
14. Recharts configuration and frontend statistical aggregation.
15. Dynamic dashboard configuration taken from the selected device model mapping and command callback integration.
16. Loading/error/toast feedback and browser confirmation interactions.
17. Current implementation limitations: unused accumulated chart state, duplicate hook instances, sockets without explicit JWT, ineffective abort signals, and inactive post/modal/helper components.
