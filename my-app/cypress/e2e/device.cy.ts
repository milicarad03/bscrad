const APP_URL = 'http://localhost:5173';

const users = [
  {
    id: 2,
    email: 'new-owner@example.com',
    role: 'USER',
    status: 'APPROVED',
  },
];

const modelVersions = [
  {
    id: 'mv-1',
    modelId: 'modelA',
    version: '1.0.0',
  },
  {
    id: 'mv-2',
    modelId: 'modelA',
    version: '2.0.0',
  },
  {
    id: 'mv-3',
    modelId: 'modelB',
    version: '1.0.0',
  },
];

const createDevice = (
  overrides: Record<string, unknown> = {},
) => ({
  id: '1',
  name: 'Device1',
  type: 'sensor',
  serialNumber: 'SN-1',
  status: 'ONLINE',
  userId: 1,
  modelVersionId: 'mv-1',
  modelVersion: modelVersions[0],
  ...overrides,
});

const setupSession = (
  role: 'ADMIN' | 'USER' = 'ADMIN',
) => {
  const user = {
    id: role === 'ADMIN' ? 1 : 2,
    email:
      role === 'ADMIN'
        ? 'milica2@gmail.com'
        : 'user@gmail.com',
    role,
    isAdmin: role === 'ADMIN',
    status: 'APPROVED',
  };

  cy.intercept('GET', '**/users/profile', {
    statusCode: 200,
    body: user,
  }).as('getProfile');

  cy.intercept('GET', '**/model-versions', {
    statusCode: 200,
    body: modelVersions,
  }).as('getModelVersions');

  cy.intercept({ method: 'GET', pathname: '/device' }, {
    statusCode: 200,
    body: { data: [] },
  }).as('getDevices');

  cy.intercept('GET', '**/users/allusers', {
    statusCode: 200,
    body: users,
  }).as('getUsers');

  cy.intercept('GET', '**/post/feed', {
    statusCode: 200,
    body: [],
  });

  cy.intercept('GET', '**/post/drafts', {
    statusCode: 200,
    body: [],
  });

  cy.visit(APP_URL, {
    onBeforeLoad(win) {
      win.sessionStorage.clear();
    },
  });

  cy.window().then((win) => {
    win.sessionStorage.setItem(
      'token',
      'fake-token',
    );

    win.sessionStorage.setItem(
      'userEmail',
      user.email,
    );
  });

  cy.visit(`${APP_URL}/dashboard`);

  cy.wait('@getProfile');
  cy.wait('@getDevices');

  if (role === 'ADMIN') {
    cy.wait('@getUsers');
  }

  cy.url().should('include', '/dashboard');
};

const openDeviceManagement = () => {
  cy.contains('Device Management').click();

  cy.get('[data-cy="device-table"]', {
    timeout: 10000,
  }).should('exist');
};

describe('Admin Device Flow', () => {
  beforeEach(() => {
    setupSession('ADMIN');
  });

  it('should show administrator actions', () => {
    openDeviceManagement();

    cy.get('[data-cy="device-table"]').should(
      'contain',
      'Actions',
    );

    cy.get('[data-cy="add-device-btn"]').should(
      'be.visible',
    );
  });

  it('should create a new device successfully', () => {
    cy.intercept('POST', '**/device', {
      statusCode: 201,
      body: createDevice({
        name: 'Test Device',
        serialNumber: 'ABC123',
        modelVersionId: 'mv-2',
      }),
    }).as('createDevice');

    openDeviceManagement();

    cy.get('[data-cy="add-device-btn"]').click();

    cy.get('[data-cy="device-name"]').type('Test Device');
    cy.get('[data-cy="device-serial"]').type('ABC123');
    cy.get('[data-cy="device-type"]').type('sensor');

    cy.contains('label', 'Assign to User')
      .parent()
      .find('select')
      .select('2');

    cy.contains('label', 'Device Model')
      .parent()
      .find('select')
      .select('mv-2');

    cy.get('[data-cy="submit-device"]').click();

    cy.wait('@createDevice')
      .its('request.body')
      .should('include', {
        name: 'Test Device',
        serialNumber: 'ABC123',
        type: 'sensor',
      });

    cy.contains('created successfully').should('exist');
  });

  it('should prevent creation with missing required data', () => {
    cy.intercept('POST', '**/device').as(
      'createDevice',
    );

    openDeviceManagement();

    cy.get('[data-cy="add-device-btn"]').click();
    cy.get('[data-cy="submit-device"]').click();

    cy.get('[data-cy="device-name"]').should('be.visible');

    cy.get('@createDevice.all').should('have.length', 0);
  });

  it('should prevent duplicate requests on double click', () => {
    cy.intercept('POST', '**/device', {
      delay: 1000,
      statusCode: 201,
      body: createDevice({
        name: 'Test Device',
        serialNumber: 'ABC123',
      }),
    }).as('createDevice');

    openDeviceManagement();

    cy.get('[data-cy="add-device-btn"]').click();
    cy.get('[data-cy="device-name"]').type('Test Device');
    cy.get('[data-cy="device-serial"]').type('ABC123');
    cy.get('[data-cy="device-type"]').type('sensor');

    cy.get('[data-cy="submit-device"]').dblclick();

    cy.wait('@createDevice');
    cy.get('@createDevice.all').should('have.length', 1);
  });

  it('should display an error when creation fails', () => {
    cy.intercept('POST', '**/device', {
      statusCode: 500,
      body: {
        message: 'Creation failed',
      },
    }).as('createFailed');

    openDeviceManagement();

    cy.get('[data-cy="add-device-btn"]').click();
    cy.get('[data-cy="device-name"]').type('Test');
    cy.get('[data-cy="device-serial"]').type('123');
    cy.get('[data-cy="device-type"]').type('sensor');

    cy.get('[data-cy="submit-device"]').click();

    cy.wait('@createFailed');

    cy.contains('Creation failed').should('be.visible');
  });

  it('should filter devices using type and search', () => {
    cy.intercept({ method: 'GET', pathname: '/device' }, {
      statusCode: 200,
      body: {
        data: [
          createDevice({
            id: '1',
            name: 'Temperature Sensor',
            type: 'sensor',
          }),
          createDevice({
            id: '2',
            name: 'Main Gateway',
            type: 'gateway',
            serialNumber: 'SN-2',
          }),
        ],
      },
    }).as('devicesWithData');

    openDeviceManagement();
    cy.wait('@devicesWithData');

    cy.get('[data-cy="filter-type"]').click();
    cy.get('[data-cy="filter-option-sensor"]').click();

    cy.get('[data-cy="device-table"]').should(
      'contain',
      'Temperature Sensor',
    );

    cy.get('[data-cy="device-table"]').should(
      'not.contain',
      'Main Gateway',
    );

    cy.get('[data-cy="device-search"]').type('Unknown');

    cy.get('[data-cy="device-table"]').should(
      'contain',
      'No devices match your search criteria',
    );
  });

  it('should clear a selected type filter', () => {
    cy.intercept({ method: 'GET', pathname: '/device' }, {
      body: {
        data: [
          createDevice({
            name: 'Sensor A',
          }),
          createDevice({
            id: '2',
            name: 'Gateway B',
            type: 'gateway',
            serialNumber: 'SN-2',
          }),
        ],
      },
    });

    openDeviceManagement();

    cy.get('[data-cy="filter-type"]').click();
    cy.get('[data-cy="filter-option-sensor"]').click();

    cy.get('[data-cy="device-table"]').should(
      'not.contain',
      'Gateway B',
    );

    cy.get('[data-cy="filter-option-sensor"]').click();

    cy.get('[data-cy="device-table"]').should(
      'contain',
      'Gateway B',
    );
  });

  it('should not delete when confirmation is cancelled', () => {
    cy.intercept({ method: 'GET', pathname: '/device' }, {
      body: {
        data: [createDevice()],
      },
    });

    cy.intercept('DELETE', '**/device/1').as(
      'deleteDevice',
    );

    openDeviceManagement();

    cy.on('window:confirm', () => false);

    cy.contains('td', 'Device1')
      .closest('tr')
      .find('button[title="Delete Device"]')
      .click();

    cy.get('@deleteDevice.all').should('have.length', 0);

    cy.get('[data-cy="device-table"]').should(
      'contain',
      'Device1',
    );
  });

  it('should delete a device successfully', () => {
    cy.intercept({ method: 'GET', pathname: '/device' }, {
      body: {
        data: [
          createDevice(),
          createDevice({
            id: '2',
            name: 'Device2',
            serialNumber: 'SN-2',
          }),
        ],
      },
    });

    cy.intercept('DELETE', '**/device/1', {
      statusCode: 200,
      body: {},
    }).as('deleteDevice');

    openDeviceManagement();

    cy.on('window:confirm', () => true);

    cy.contains('td', 'Device1')
      .closest('tr')
      .find('button[title="Delete Device"]')
      .click();

    cy.wait('@deleteDevice');

    cy.get('[data-cy="device-table"]').should(
      'not.contain',
      'Device1',
    );

    cy.get('[data-cy="device-table"]').should(
      'contain',
      'Device2',
    );
  });

  it('should display an error when deletion fails', () => {
    cy.intercept({ method: 'GET', pathname: '/device' }, {
      body: {
        data: [createDevice()],
      },
    });

    cy.intercept('DELETE', '**/device/1', {
      statusCode: 500,
      body: {
        message: 'Delete failed',
      },
    }).as('deleteFailed');

    openDeviceManagement();

    cy.on('window:confirm', () => true);

    cy.contains('td', 'Device1')
      .closest('tr')
      .find('button[title="Delete Device"]')
      .click();

    cy.wait('@deleteFailed');

    cy.contains('Delete failed').should('be.visible');
  });

  it('should transfer device ownership successfully', () => {
    cy.intercept({ method: 'GET', pathname: '/device' }, {
      body: {
        data: [createDevice()],
      },
    });

    cy.intercept(
      'PATCH',
      '**/device/SN-1/reassign',
      {
        statusCode: 200,
        body: {},
      },
    ).as('reassignDevice');

    openDeviceManagement();

    cy.get('[data-cy="transfer-owner-1"]').select('2');

    cy.on('window:confirm', () => true);

    cy.get('[data-cy="transfer-btn-1"]').click();

    cy.wait('@reassignDevice')
      .its('request.body')
      .should('deep.equal', {
        targetUserId: 2,
      });
  });

  it('should display an error when ownership transfer fails', () => {
    cy.intercept({ method: 'GET', pathname: '/device' }, {
      body: {
        data: [createDevice()],
      },
    });

    cy.intercept(
      'PATCH',
      '**/device/SN-1/reassign',
      {
        statusCode: 500,
        body: {
          message: 'Transfer failed',
        },
      },
    ).as('reassignFailed');

    openDeviceManagement();

    cy.get('[data-cy="transfer-owner-1"]').select('2');

    cy.on('window:confirm', () => true);

    cy.get('[data-cy="transfer-btn-1"]').click();

    cy.wait('@reassignFailed');

    cy.contains('Transfer failed').should('be.visible');
  });

  it('should apply another version of the same model', () => {
    cy.intercept({ method: 'GET', pathname: '/device' }, {
      body: {
        data: [createDevice()],
      },
    });

    cy.intercept(
      'PATCH',
      '**/device/1/model-version',
      {
        statusCode: 200,
        body: {
          success: true,
          staged: false,
          restartRequired: false,
          deviceId: '1',
          serialNumber: 'SN-1',
          model: 'modelA',
          version: '2.0.0',
          modelVersionId: 'mv-2',
        },
      },
    ).as('applyModelVersion');

    openDeviceManagement();

    cy.contains('tr', 'Device1').within(() => {
      cy.get(
        'select[aria-label="Select model version"]',
      ).select('mv-2');

      cy.contains('button', 'Apply').click();
    });

    cy.wait('@applyModelVersion')
      .its('request.body')
      .should('deep.equal', {
        modelVersionId: 'mv-2',
      });
  });

  it('should disable model version application for an offline device', () => {
    cy.intercept({ method: 'GET', pathname: '/device' }, {
      body: {
        data: [
          createDevice({
            name: 'Offline Device',
            status: 'OFFLINE',
          }),
        ],
      },
    });

    openDeviceManagement();

    cy.contains('tr', 'Offline Device').within(() => {
      cy.get(
        'select[aria-label="Select model version"]',
      ).select('mv-2');

      cy.contains('button', 'Apply').should('be.disabled');
    });
  });

  it('should update a device status through the realtime hook', () => {
    cy.intercept({ method: 'GET', pathname: '/device' }, {
      body: {
        data: [
          createDevice({
            status: 'OFFLINE',
          }),
        ],
      },
    });

    openDeviceManagement();

    cy.get('[data-cy="device-status-1"]').should(
      'contain',
      'Offline',
    );

    cy.window().then((win) => {
      const testWindow = win as typeof win & {
        triggerStatusUpdate: (
          serialNumber: string,
          status: string,
        ) => void;
      };

      testWindow.triggerStatusUpdate('SN-1', 'ONLINE');
    });

    cy.get('[data-cy="device-status-1"]').should(
      'contain',
      'Online',
    );
  });

  it('should navigate to device details', () => {
    cy.intercept({ method: 'GET', pathname: '/device' }, {
      body: {
        data: [createDevice()],
      },
    });

    openDeviceManagement();

    cy.contains('td', 'Device1').click();

    cy.url().should('include', '/device/SN-1');
  });

  it('should preview and import devices from a JSON manifest', () => {
    cy.intercept('POST', '**/device/bulk-import', {
      statusCode: 201,
      body: {
        total: 2,
        created: 2,
        skipped: 0,
        failed: 0,
        targetUser: {
          id: 2,
          email: 'new-owner@example.com',
        },
        skippedSerialNumbers: [],
        concurrentSkips: 0,
      },
    }).as('bulkImportDevices');

    openDeviceManagement();
    cy.get('[data-cy="bulk-import-btn"]').click();
    cy.get('[data-cy="bulk-import-file"]').selectFile(
      'cypress/fixtures/device-bulk-import.json',
      { force: true },
    );

    cy.get('[data-cy="bulk-import-preview"]')
      .should('contain', 'new-owner@example.com')
      .and('contain', 'modelA')
      .and('contain', 'modelB');

    cy.get('[data-cy="bulk-import-submit"]').click();
    cy.wait('@bulkImportDevices')
      .its('request.body')
      .should('deep.equal', {
        targetUserEmail: 'new-owner@example.com',
        devices: [
          {
            serialNumber: 'fleet-a-001',
            name: 'Fleet Sensor A001',
            type: 'sensor',
            model: 'modelA',
            version: '10.0.0',
          },
          {
            serialNumber: 'fleet-b-001',
            name: 'Fleet Compressor B001',
            type: 'compressor',
            model: 'modelB',
            version: '10.0.0',
          },
        ],
      });

    cy.get('[data-cy="bulk-import-result"]')
      .should('contain', 'Import completed')
      .and('contain', 'Created')
      .and('contain', '2');
  });

  it('should redirect to login after a 401 response', () => {
    cy.intercept({ method: 'GET', pathname: '/device' }, {
      statusCode: 401,
      body: {
        message: 'Unauthorized',
      },
    }).as('unauthorized');

    cy.contains('Device Management').click();

    cy.wait('@unauthorized');

    cy.url().should('eq', `${APP_URL}/`);
  });
});

describe('Regular User Device Flow', () => {
  beforeEach(() => {
    setupSession('USER');
  });

  it('should hide administrator actions', () => {
    openDeviceManagement();

    cy.get('[data-cy="device-table"]').should(
      'not.contain',
      'Actions',
    );

    cy.get('[data-cy="add-device-btn"]').should('not.exist');
    cy.get('[data-cy="bulk-import-btn"]').should('not.exist');
  });
});
