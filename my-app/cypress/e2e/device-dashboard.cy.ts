const APP_URL = 'http://localhost:5173';
const TIMESTAMP = '2026-08-22T14:47:43.511Z';

const dashboardMapping = {
  fields: {
    uptime: { path: 'system.status.uptime_seconds' },
    opMode: { path: 'system.status.mode' },
    airflow: { path: 'performance.output.flow' },
    powerDraw: { path: 'performance.electrical.kw' },
    oilLevel: { path: 'diagnostics.health.oil_level' },
  },
  dashboard: {
    sections: [
      {
        id: 'overview',
        title: 'COMPRESSOR OVERVIEW',
        columns: 4,
        items: [
          {
            id: 'uptime',
            component: 'value-card',
            bind: 'uptime',
            title: 'Uptime',
          },
          {
            id: 'mode',
            component: 'value-card',
            bind: 'opMode',
            title: 'Operating Mode',
          },
          {
            id: 'airflow',
            component: 'value-card',
            bind: 'airflow',
            title: 'Airflow',
          },
          {
            id: 'power',
            component: 'value-card',
            bind: 'powerDraw',
            title: 'Power Draw',
            unit: 'kW',
          },
          {
            id: 'oil-level',
            component: 'oil-gauge',
            bind: 'oilLevel',
            title: 'Oil Level',
            unit: '%',
          },
        ],
      },
      {
        id: 'controls',
        title: 'COMPRESSOR CONTROLS',
        columns: 4,
        items: [
          {
            id: 'target-pressure',
            component: 'numeric-input',
            title: 'Target Pressure',
            command: 'SET_TARGET_PRESSURE',
            commandField: 'value',
            min: 2,
            max: 16,
            step: 1,
          },
        ],
      },
      {
        id: 'complex-controls',
        title: 'OPERATING PROFILE',
        columns: 2,
        items: [
          {
            id: 'operating-profile',
            component: 'command-form',
            title: 'Operating Profile',
            command: 'SET_OPERATING_PROFILE',
          },
        ],
      },
    ],
  },
};

const deviceSchema = {
  type: 'object',
  title: 'IndustrialAirCompressorTelemetry',
  commands: {
    SET_STATE: {
      payload: {
        type: 'object',
        required: ['state'],
        properties: {
          state: { enum: ['ACTIVE', 'IDLE'], type: 'string' },
        },
      },
    },
    SET_TARGET_PRESSURE: {
      payload: {
        type: 'object',
        required: ['value'],
        properties: {
          value: { type: 'number', minimum: 2, maximum: 16 },
        },
      },
    },
    SET_OPERATING_PROFILE: {
      payload: {
        type: 'object',
        required: ['mode', 'pressure', 'safety', 'schedule'],
        properties: {
          mode: { enum: ['ECONOMY', 'NORMAL', 'BOOST'], type: 'string' },
        },
      },
    },
  },
  properties: {
    schemaId: { type: 'string', const: 'modelB' },
    system: {
      type: 'object',
      properties: {
        status: {
          type: 'object',
          properties: {
            mode: { type: 'string' },
            uptime_seconds: { type: 'integer' },
          },
        },
      },
    },
    diagnostics: {
      type: 'object',
      properties: {
        health: {
          type: 'object',
          properties: {
            oil_level: { type: 'number' },
          },
        },
      },
    },
    performance: {
      type: 'object',
      properties: {
        output: {
          type: 'object',
          properties: {
            flow: { type: 'number' },
          },
        },
        electrical: {
          type: 'object',
          properties: {
            kw: { type: 'number' },
          },
        },
      },
    },
  },
};

const createDevice = (
  status: 'ONLINE' | 'OFFLINE' = 'ONLINE',
) => ({
  id: 'device-2',
  name: 'Industrial Compressor',
  type: 'compressor',
  serialNumber: 'CP-12345-X',
  status,
  modelVersionId: 'mv-b-2',
  modelVersion: {
    id: 'mv-b-2',
    modelId: 'modelB',
    version: '5.0.2',
    schema: deviceSchema,
    mapping: dashboardMapping,
  },
});

const setupDeviceDashboard = (
  options: {
    status?: 'ONLINE' | 'OFFLINE';
    failCommand?: boolean;
  } = {},
) => {
  const status = options.status ?? 'ONLINE';
  const device = createDevice(status);

  cy.intercept('GET', '**/users/profile', {
    statusCode: 200,
    body: {
      id: 1,
      email: 'milica2@gmail.com',
      role: 'ADMIN',
      isAdmin: true,
      status: 'APPROVED',
    },
  }).as('getProfile');

  cy.intercept('GET', '**/model-versions', {
    statusCode: 200,
    body: [device.modelVersion],
  }).as('getModelVersions');

  cy.intercept('GET', '**/device', {
    statusCode: 200,
    body: {
      data: [device],
    },
  }).as('getDevices');

  cy.intercept(
    'GET',
    '**/device/device-2/telemetry/latest',
    {
      statusCode: 200,
      body: {
        id: 'telemetry-2',
        deviceId: 'device-2',
        timestamp: TIMESTAMP,
        data: {
          uptime: [[3600, TIMESTAMP]],
          opMode: [['LOADED', TIMESTAMP]],
          airflow: [[42.5, TIMESTAMP]],
          powerDraw: [[120.4, TIMESTAMP]],
          oilLevel: [[85.0, TIMESTAMP]],
        },
      },
    },
  ).as('latestTelemetry');

  cy.intercept(
    'GET',
    '**/device/device-2/telemetry',
    {
      statusCode: 200,
      body: [],
    },
  ).as('telemetryHistory');

  cy.intercept(
    'POST',
    '**/device/device-2/command',
    (request) => {
      const command = request.body?.command;
      const state = request.body?.payload?.state;

      if (command === 'SET_STATE' && state === 'ACTIVE') {
        request.alias = 'activateTelemetry';
      }

      if (command === 'SET_OPERATING_PROFILE') {
        request.alias = 'setProfile';

        if (options.failCommand) {
          request.reply({
            statusCode: 500,
            body: { message: 'Command failed' },
          });
          return;
        }
      }

      if (command === 'SET_TARGET_PRESSURE') {
        request.alias = 'setTargetPressure';
      }

      request.reply({
        statusCode: 200,
        body: { success: true },
      });
    },
  ).as('deviceCommand');

  cy.intercept('GET', '**/post/feed', { statusCode: 200, body: [] });
  cy.intercept('GET', '**/post/drafts', { statusCode: 200, body: [] });
  cy.intercept('GET', '**/users/allusers', { statusCode: 200, body: [] });

  cy.visit(`${APP_URL}/device/device-2`, {
    onBeforeLoad(win) {
      win.sessionStorage.setItem('token', 'fake-token');
      win.sessionStorage.setItem('userEmail', 'milica2@gmail.com');
    },
  });

  cy.wait('@getProfile');
  cy.url().should('include', '/device/device-2');
  cy.contains('Industrial Compressor', { timeout: 10000 }).should('be.visible');
};

describe('Industrial Compressor Dashboard (Model B v5.0.2)', () => {
  it('should render device and latest telemetry', () => {
    setupDeviceDashboard();
    cy.wait('@latestTelemetry');

    cy.contains('Industrial Compressor').should('be.visible');
    cy.contains('CP-12345-X').should('be.visible');
    cy.contains('modelB').should('be.visible');
    cy.contains('5.0.2').should('be.visible');

    cy.contains('COMPRESSOR OVERVIEW').should('be.visible');
    cy.contains('Uptime').should('be.visible');
    cy.contains('3600').should('be.visible');
    cy.contains('Operating Mode').should('be.visible');
    cy.contains('LOADED').should('be.visible');
    cy.contains('Airflow').should('be.visible');
    cy.contains('42.5').should('be.visible');
    cy.contains('Power Draw').should('be.visible');
    cy.contains('120.4').should('be.visible');
    cy.contains('Live').should('be.visible');
  });

  it('should activate telemetry for an online device', () => {
    setupDeviceDashboard();
    cy.wait('@activateTelemetry')
      .its('request.body')
      .should('deep.equal', {
        command: 'SET_STATE',
        payload: { state: 'ACTIVE' },
      });
  });

  it('should change the dashboard theme', () => {
    setupDeviceDashboard();

    const themes = [
      { label: 'Dark', mode: 'dark' },
      { label: 'Light', mode: 'light' },
      { label: 'Enterprise', mode: 'enterprise' },
      { label: 'Nord', mode: 'nord' },
      { label: 'Emerald', mode: 'emerald' },
      { label: 'Amber', mode: 'amber' },
      { label: 'Glass', mode: 'glass' },
      { label: 'Cyberpunk', mode: 'cyberpunk' },
      { label: 'Minimalist', mode: 'minimalist' },
    ];

    themes.forEach(({ label, mode }) => {
      cy.contains('button', label)
        .click()
        .should('have.attr', 'aria-pressed', 'true');

      cy.get('.dashboard-container').should(
        'have.attr',
        'data-theme',
        mode,
      );
    });
  });

  it('should send a command from the command form', () => {
    setupDeviceDashboard();

    cy.contains(
      '.dashboard-grid-item',
      'Operating Profile',
    ).within(() => {
      // Ako forma ima input/select za mode, prilagodi selektor po potrebi, npr:
      cy.get('select, input').first().type('ECONOMY');
      cy.contains('button', /apply|submit|send/i).click();
    });

    cy.wait('@setProfile');
  });

  it('should send a command using the numeric input renderer', () => {
    setupDeviceDashboard();

    cy.contains('.dashboard-grid-item', 'Target Pressure').within(
      () => {
        cy.get('input').clear().type('10');
        cy.contains('button', /apply|set|send/i).click();
      },
    );

    cy.wait('@setTargetPressure')
      .its('request.body')
      .should('deep.equal', {
        command: 'SET_TARGET_PRESSURE',
        payload: { value: 10 },
      });
  });

  it('should display an error when a command fails', () => {
    setupDeviceDashboard({ failCommand: true });

    cy.contains(
      '.dashboard-grid-item',
      'Operating Profile',
    ).within(() => {
      cy.get('select, input').first().type('BOOST');
      cy.contains('button', /apply|submit|save/i).click();
    });

    cy.wait('@setProfile');

    cy.contains(/command failed|SET_OPERATING_PROFILE failed/i).should(
      'be.visible',
    );
  });

  it('should disable controls when the device is offline', () => {
    setupDeviceDashboard({ status: 'OFFLINE' });

    cy.contains('Offline').should('be.visible');

    cy.contains('.dashboard-grid-item', 'Target Pressure').within(
      () => {
        cy.get('input').should('be.disabled');
      },
    );

    cy.get('@deviceCommand.all').then((requests) => {
      const activationRequests = requests.filter(
        ({ request }) =>
          request.body?.command === 'SET_STATE' &&
          request.body?.payload?.state === 'ACTIVE',
      );

      expect(activationRequests).to.have.length(0);
    });
  });

  it('should return to device management', () => {
    setupDeviceDashboard();

    cy.contains('button', 'All devices').click();

    cy.url().should('include', '/dashboard');
    cy.contains('Device Management').should('be.visible');
  });
});