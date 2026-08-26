const APP_URL = 'http://localhost:5173';
const TIMESTAMP = '2026-08-22T14:47:43.511Z';

const dashboardMapping = {
  fields: {
    serialNumber: {
      path: 'attributes.serialNumber',
    },
    firmware: {
      path: 'attributes.firmware',
    },
    hardwareModel: {
      path: 'attributes.hardwareModel',
    },
    flowRate: {
      path: 'metrics.flowRate',
    },
    motorTemperature: {
      path: 'metrics.motorTemperature',
    },
    pumpEnabled: {
      path: 'system.status.pumpEnabled',
    },
  },
  dashboard: {
    sections: [
      {
        id: 'identity',
        title: 'Device Identity',
        columns: 3,
        items: [
          {
            id: 'serial-number',
            component: 'value-card',
            bind: 'serialNumber',
            title: 'Serial Number',
          },
          {
            id: 'firmware',
            component: 'value-card',
            bind: 'firmware',
            title: 'Firmware',
          },
          {
            id: 'hardware-model',
            component: 'value-card',
            bind: 'hardwareModel',
            title: 'Hardware Model',
          },
        ],
      },
      {
        id: 'metrics',
        title: 'Live Metrics',
        columns: 2,
        items: [
          {
            id: 'flow-rate',
            component: 'value-card',
            bind: 'flowRate',
            title: 'Flow Rate',
            unit: 'L/min',
          },
          {
            id: 'temperature',
            component: 'value-card',
            bind: 'motorTemperature',
            title: 'Motor Temperature',
            unit: 'C',
          },
          {
            id: 'pump',
            component: 'switch',
            bind: 'pumpEnabled',
            title: 'Pump Enabled',
            command: 'SET_PUMP',
            commandField: 'enabled',
          },
        ],
      },
      {
        id: 'commands',
        title: 'Device Controls',
        columns: 1,
        items: [
          {
            id: 'set-mode',
            component: 'command-form',
            command: 'SET_MODE',
            title: 'Set Operating Mode',
          },
        ],
      },
    ],
  },
};

const deviceSchema = {
  type: 'object',
  properties: {
    flowRate: {
      type: 'number',
    },
    motorTemperature: {
      type: 'number',
    },
    pumpEnabled: {
      type: 'boolean',
    },
    attributes: {
      type: 'object',
      additionalProperties: false,
      required: [
        'serialNumber',
        'firmware',
        'hardwareModel',
      ],
      properties: {
        serialNumber: { type: 'string' },
        firmware: { type: 'string' },
        hardwareModel: { type: 'string' },
      },
    },
  },
  commands: {
    SET_MODE: {
      payload: {
        type: 'object',
        properties: {
          mode: {
            type: 'string',
            enum: ['AUTO', 'MANUAL'],
          },
        },
        required: ['mode'],
      },
    },
    SET_PUMP: {
      payload: {
        type: 'object',
        properties: {
          enabled: {
            type: 'boolean',
          },
        },
        required: ['enabled'],
      },
    },
  },
};

const createDevice = (
  status: 'ONLINE' | 'OFFLINE' = 'ONLINE',
) => ({
  id: '1',
  name: 'Smart Pump',
  type: 'pump',
  serialNumber: 'SN-1',
  status,
  attributes: {
    serialNumber: 'SN-1',
    firmware: '1.1.4',
    hardwareModel: 'modelC',
  },
  modelVersionId: 'mv-1',
  modelVersion: {
    id: 'mv-1',
    modelId: 'modelC',
    version: '1.1.4',
    schema: deviceSchema,
    mapping: dashboardMapping,
  },
});

const setupDeviceDashboard = (
  options: {
    status?: 'ONLINE' | 'OFFLINE';
    failManualCommand?: boolean;
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
    '**/device/SN-1/telemetry/latest',
    {
      statusCode: 200,
      body: {
        id: 'telemetry-1',
        deviceId: 'SN-1',
        timestamp: TIMESTAMP,
        data: {
          firmware: [['1.1.3', TIMESTAMP]],
          flowRate: [[180.6, TIMESTAMP]],
          motorTemperature: [[59.9, TIMESTAMP]],
          pumpEnabled: [[false, TIMESTAMP]],
        },
      },
    },
  ).as('latestTelemetry');

  cy.intercept(
    'GET',
    '**/device/SN-1/telemetry',
    {
      statusCode: 200,
      body: [
        {
          id: 'telemetry-1',
          deviceId: 'SN-1',
          timestamp: TIMESTAMP,
          data: {
            flowRate: [[180.6, TIMESTAMP]],
            motorTemperature: [[59.9, TIMESTAMP]],
            pumpEnabled: [[false, TIMESTAMP]],
          },
        },
      ],
    },
  ).as('telemetryHistory');

  cy.intercept(
    'POST',
    '**/device/SN-1/command',
    (request) => {
      const command = request.body?.command;
      const state = request.body?.payload?.state;

      if (
        command === 'SET_STATE' &&
        state === 'ACTIVE'
      ) {
        request.alias = 'activateTelemetry';
      }

      if (command === 'SET_MODE') {
        request.alias = 'setMode';

        if (options.failManualCommand) {
          request.reply({
            statusCode: 500,
            body: {
              message: 'Command failed',
            },
          });

          return;
        }
      }

      if (command === 'SET_PUMP') {
        request.alias = 'setPump';
      }

      request.reply({
        statusCode: 200,
        body: {
          success: true,
        },
      });
    },
  ).as('deviceCommand');

  cy.intercept('GET', '**/post/feed', {
    statusCode: 200,
    body: [],
  });

  cy.intercept('GET', '**/post/drafts', {
    statusCode: 200,
    body: [],
  });

  cy.intercept('GET', '**/users/allusers', {
    statusCode: 200,
    body: [],
  });

  cy.visit(`${APP_URL}/device/SN-1`, {
    onBeforeLoad(win) {
      win.sessionStorage.setItem(
        'token',
        'fake-token',
      );

      win.sessionStorage.setItem(
        'userEmail',
        'milica2@gmail.com',
      );
    },
  });

  cy.wait('@getProfile');

  cy.url().should('include', '/device/SN-1');

  cy.contains('Smart Pump', {
    timeout: 10000,
  }).should('be.visible');
};

describe('Dynamic Device Dashboard', () => {
  it('should render device and latest telemetry', () => {
    setupDeviceDashboard();

    cy.wait('@latestTelemetry');

    cy.contains('Smart Pump').should('be.visible');
    cy.contains('SN-1').should('be.visible');
    cy.contains('modelC').should('be.visible');
    cy.contains('1.1.4').should('be.visible');

    cy.contains('.dashboard-card', 'Firmware').should(
      'contain',
      '1.1.4',
    );
    cy.contains('.dashboard-card', 'Hardware Model').should(
      'contain',
      'modelC',
    );

    cy.contains('Live Metrics').should('be.visible');
    cy.contains('Flow Rate').should('be.visible');
    cy.contains('180.6').should('be.visible');

    cy.contains('Motor Temperature').should(
      'be.visible',
    );

    cy.contains('59.9').should('be.visible');
    cy.contains('Live').should('be.visible');
  });

  it('should activate telemetry for an online device', () => {
    setupDeviceDashboard();

    cy.wait('@activateTelemetry')
      .its('request.body')
      .should('deep.equal', {
        command: 'SET_STATE',
        payload: {
          state: 'ACTIVE',
        },
      });
  });

  it('should change the dashboard theme', () => {
    setupDeviceDashboard();

    const themes = [
      { label: 'Dark', mode: 'dark' },
      { label: 'Light', mode: 'light' },
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
      '.dashboard-card--command',
      'Set Operating Mode',
    ).within(() => {
      cy.get('select').select('MANUAL');
      cy.contains('button', 'Apply Command').click();
    });

    cy.wait('@setMode')
      .its('request.body')
      .should('deep.equal', {
        command: 'SET_MODE',
        payload: {
          mode: 'MANUAL',
        },
      });
  });

  it('should send a command using the switch renderer', () => {
    setupDeviceDashboard();

    cy.contains('.dashboard-card', 'Pump Enabled').within(
      () => {
        cy.get('button').click();
      },
    );

    cy.wait('@setPump')
      .its('request.body')
      .should('deep.equal', {
        command: 'SET_PUMP',
        payload: {
          enabled: true,
        },
      });
  });

  it('should display an error when a command fails', () => {
    setupDeviceDashboard({
      failManualCommand: true,
    });

    cy.contains(
      '.dashboard-card--command',
      'Set Operating Mode',
    ).within(() => {
      cy.get('select').select('MANUAL');
      cy.contains('button', 'Apply Command').click();
    });

    cy.wait('@setMode');

    cy.contains(/command failed|SET_MODE failed/i).should(
      'be.visible',
    );
  });

  it('should disable controls when the device is offline', () => {
    setupDeviceDashboard({
      status: 'OFFLINE',
    });

    cy.contains('Offline').should('be.visible');

    cy.contains(
      '.dashboard-card--command',
      'Set Operating Mode',
    ).within(() => {
      cy.contains('button', 'Apply Command').should(
        'be.disabled',
      );
    });

    cy.contains('.dashboard-card', 'Pump Enabled').within(
      () => {
        cy.get('button').should('be.disabled');
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