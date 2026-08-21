// cypress/e2e/device.cy.ts

const setupCommonIntercepts = () => {
  cy.intercept('POST', '**/users/login', {
    statusCode: 200,
    body: { accessToken: 'fake-token', user: { email: 'milica2@gmail.com' } }
  }).as('loginRequest');
  
  cy.intercept('GET', '**/model-versions', { statusCode: 200, body: [] }).as('getModelVersions');
  cy.intercept('GET', '**/post/feed', { statusCode: 200, body: [] }).as('getFeed');
  cy.intercept('GET', '**/device', { statusCode: 200, body: { data: [] } }).as('getDevices');
  cy.intercept('GET', '**/users/allusers', { statusCode: 200, body: [] }).as('getUsers');
  cy.intercept('GET', '**/post/drafts', { statusCode: 200, body: [] }).as('getDrafts');
};

describe('Admin Device Flow', () => {
  beforeEach(() => {
    setupCommonIntercepts();
    cy.intercept('GET', '**/users/profile', { 
      body: { email: 'admin@gmail.com', role: 'ADMIN', isAdmin: true } 
    });
    
    cy.login('milica2@gmail.com', '123');
  
    cy.url().should('include', '/dashboard'); 
  });

  it('should show delete button for admin', () => {
    cy.contains('Device Management').click();
    cy.get('[data-cy="device-table"]', { timeout: 10000 }).should('exist');
    cy.get('[data-cy="device-table"]').should('contain', 'Actions');
  });

  it('should create new device successfully', () => {
    cy.intercept('POST', '**/device', {
      statusCode: 201,
      body: {
        id: '1',
        name: 'Test Device',
        serialNumber: 'ABC123',
        status: 'ONLINE',
        type: 'sensor'
      }
    }).as('createDevice');

    cy.contains('Device Management').click();
    cy.get('[data-cy="add-device-btn"]').click();
      
    cy.get('[data-cy="device-name"]').should('be.visible');

    cy.get('[data-cy="device-name"]').type('Test Device');
    cy.get('[data-cy="device-serial"]').type('ABC123');
    cy.get('[data-cy="device-type"]').type('sensor');

    cy.get('[data-cy="submit-device"]').click();

    cy.wait('@createDevice');

    cy.contains('created successfully').should('exist');
  });

  it('should filter devices by type', () => {
    cy.intercept('GET', '**/device*', {
      body: { data: [{ id: '1', name: 'Test', type: 'sensor', status: 'ONLINE', serialNumber: 'SN-1' }] }
    }).as('getDevicesWithData');

    cy.contains('Device Management').click();

    cy.wait('@getDevicesWithData');

    cy.get('[data-cy="filter-type"]').click();
    cy.get('[data-cy="filter-option-sensor"]').click();

    cy.get('[data-cy="device-table"]').should('contain', 'sensor');
  });

  it('should filter devices by type and update the table', () => {
    const devices = [
      { id: '1', name: 'Temp Sensor', type: 'sensor', status: 'ONLINE', serialNumber: 'SN-1' },
      { id: '2', name: 'Main Gateway', type: 'gateway', status: 'ONLINE', serialNumber: 'SN-2' }
    ];

    cy.intercept('GET', '**/device*', { body: { data: devices } }).as('getDevices');

    cy.contains('Device Management').click();
    cy.wait('@getDevices');
  
    cy.get('[data-cy="device-table"]').should('contain', 'Temp Sensor');
    cy.get('[data-cy="device-table"]').should('contain', 'Main Gateway');

    cy.get('[data-cy="filter-type"]').click();
    cy.get('[data-cy="filter-option-sensor"]').click();

    cy.get('[data-cy="device-table"]').should('contain', 'Temp Sensor');
    cy.get('[data-cy="device-table"]').should('not.contain', 'Main Gateway');
  });

  it('should NOT delete device if user cancels confirm dialog', () => {
    cy.intercept('GET', '**/device*', {
      body: { data: [{ id: '1', name: 'Device1', type: 'sensor', status: 'ONLINE', serialNumber: 'SN-1' }] }
    });

    cy.intercept('DELETE', '**/device/1').as('deleteDevice');

    cy.contains('Device Management').click();

    cy.on('window:confirm', () => false);

    cy.contains('td', 'Device1')
      .closest('tr')
      .find('button[title="Delete Device"]')
      .click();

    cy.get('@deleteDevice.all').should('have.length', 0);
    cy.get('[data-cy="device-table"]').should('contain', 'Device1');
  });
});

describe('User Device Flow', () => {
  beforeEach(() => {
    setupCommonIntercepts();
    cy.intercept('GET', '**/users/profile', { 
      body: { email: 'user@gmail.com', role: 'USER', isAdmin: false } 
    });
    cy.login('user@gmail.com', '123');
    cy.url().should('include', '/dashboard'); 
  });

  it('should NOT show delete button for regular users', () => {
    cy.contains('Device Management').click();
    cy.get('[data-cy="device-table"]', { timeout: 10000 }).should('exist');
    cy.get('[data-cy="device-table"]').should('not.contain', 'Actions');
  });
});

describe('Device API Error Handling', () => {
  beforeEach(() => {
    setupCommonIntercepts();
    cy.intercept('GET', '**/users/profile', { 
      body: { email: 'admin@gmail.com', role: 'ADMIN', isAdmin: true } 
    });
    cy.login('milica2@gmail.com', '123');
  });

  it('should show custom server error', () => {
    const errorMessage = 'Custom Database Error';
    
    cy.intercept('GET', '**/device*', { 
      statusCode: 400, 
      body: { message: errorMessage } 
    }).as('getDevicesError');
    
    cy.contains('Device Management').click();
    cy.wait('@getDevicesError');
    
    cy.contains(errorMessage).should('be.visible');
  });

  it('should prevent device creation with invalid data (validation)', () => {
    cy.intercept('POST', '**/device').as('createDevice');

    cy.contains('Device Management').click();
    cy.get('[data-cy="add-device-btn"]').click();
    
    cy.get('[data-cy="submit-device"]').click();
    cy.get('[data-cy="device-name"]').should('be.visible');
    
    cy.get('@createDevice.all').should('have.length', 0);
  });

  it('should show error on create device failure', () => {
    cy.intercept('POST', '**/device', {
      statusCode: 500,
      body: { message: 'Creation failed' }
    }).as('createFail');

    cy.contains('Device Management').click();
    cy.get('[data-cy="add-device-btn"]').click();

    cy.get('[data-cy="device-name"]').type('Test');
    cy.get('[data-cy="device-serial"]').type('123');
    cy.get('[data-cy="device-type"]').type('sensor');

    cy.get('[data-cy="submit-device"]').click();

    cy.wait('@createFail');
    cy.contains('Creation failed').should('exist');
  });

  it('should show error message on network timeout', () => {
    cy.intercept('GET', '**/device*', { forceNetworkError: true }).as('networkError');

    cy.contains('Device Management').click();
    cy.wait('@networkError');

    cy.get('.go3958317564', { timeout: 10000 })
      .should('be.visible')
      .invoke('text')
      .should('include', 'NetworkError'); 
      
    cy.intercept('GET', '**/device*', { body: { data: [] } });
  });
});

describe('Device Edge Cases', () => {
  beforeEach(() => {
    setupCommonIntercepts();
    cy.intercept('GET', '**/users/profile', { body: { email: 'admin@gmail.com', role: 'ADMIN', isAdmin: true } });
    cy.login('milica2@gmail.com', '123');
  });

  it('should display "NO_DEVICES..." when search finds nothing', () => {
    cy.intercept('GET', '**/device*', { body: { data: [{ id: '1', name: 'Sensor', type: 'temp', serialNumber: 'SN-001', status: 'ONLINE' }] } });
    cy.contains('Device Management').click();

    cy.get('[data-cy="device-search"]').type('NEPOSTOJEĆI_UREĐAJ');

    cy.get('[data-cy="device-table"]').should('contain', 'No devices match your search criteria');
  });
  
  it('should show error if delete fails', () => {
    cy.intercept('GET', '**/device*', {
      body: { data: [{ id: '1', name: 'Device1', type: 'sensor', status: 'ONLINE', serialNumber: 'SN-1' }] }
    });

    cy.intercept('DELETE', '**/device/1', {
      statusCode: 500,
      body: { message: 'Delete failed' }
    }).as('deleteFail');

    cy.contains('Device Management').click();

    cy.contains('td', 'Device1')
      .closest('tr')
      .find('button[title="Delete Device"]')
      .click();

    cy.wait('@deleteFail');
    cy.contains('Delete failed').should('exist');
  });

  it('should show empty state when no devices exist', () => {
    cy.intercept('GET', '**/device*', {
      body: { data: [] }
    });

    cy.contains('Device Management').click();

    cy.get('[data-cy="device-table"]')
      .should('contain', 'No devices match your search criteria');
  });

  it('should not create device twice on double click', () => {
    cy.intercept('POST', '**/device', {
      delay: 1000,
      body: { id: '1', name: 'Test Device', status: 'ONLINE', serialNumber: 'SN-1' }
    }).as('createDevice');

    cy.contains('Device Management').click();
    cy.get('[data-cy="add-device-btn"]').click();

    cy.get('[data-cy="device-name"]').type('Test');
    cy.get('[data-cy="device-serial"]').type('123');
    cy.get('[data-cy="device-type"]').type('sensor');

    cy.get('[data-cy="submit-device"]').dblclick();

    cy.get('@createDevice.all').should('have.length', 1);
  });  

  it('should show empty table when filter has no match', () => {
    cy.intercept('GET', '**/device*', {
      body: {
        data: [
          { id: '1', type: 'sensor', name: 'Sensor A', serialNumber: '1', status: 'ONLINE' },
          { id: '2', type: 'gateway', name: 'Gateway B', serialNumber: '2', status: 'ONLINE' }
        ]
      }
    });

    cy.contains('Device Management').click();
    cy.get('[data-cy="filter-type"]').click();
    cy.get('[data-cy="filter-option-sensor"]').click();
    cy.get('[data-cy="device-search"]').type('Gateway');
    cy.get('[data-cy="device-table"]')
      .should('contain', 'No devices match your search criteria');
  });

  it('should handle realtime update without crashing', () => {
    cy.intercept('GET', '**/device*', {
      body: { data: [{ id: '1', type: 'sensor', name: 'Device1', status: 'ONLINE', serialNumber: 'SN-1' }] }
    });

    cy.contains('Device Management').click();
    cy.get('[data-cy="device-table"]').should('contain', 'Device1');
  });

  it('should handle refresh failure gracefully', () => {
    cy.intercept('GET', '**/device*', {
      body: { data: [{ id: '1', name: 'Device1', type: 'sensor', serialNumber:'1', status: 'ONLINE' }] }
    });

    cy.intercept('GET', '**/device*', {
      statusCode: 500,
      body: { message: 'Fetch failed' }
    }).as('refreshFail');

    cy.contains('Device Management').click();
    cy.get('[data-cy="refresh-devices-btn"]').click();

    cy.wait('@refreshFail');
    cy.contains('Fetch failed').should('exist');
  });

  it('should apply multiple filters correctly', () => {
    const devices = [
      { id: '1', type: 'sensor', name: 'A' , serialNumber: '1', status: 'ONLINE' },
      { id: '2', type: 'gateway', name: 'B' , serialNumber: '2', status: 'ONLINE' }
    ];

    cy.intercept('GET', '**/device*', { body: { data: devices } });

    cy.contains('Device Management').click();

    cy.get('[data-cy="filter-type"]').click();
    cy.get('[data-cy="filter-option-sensor"]').click();

    cy.get('[data-cy="device-search"]').type('B');

    cy.get('[data-cy="device-table"]').should('contain', 'No devices match your search criteria');
  });

  it('should navigate to device details on row click', () => {
    cy.intercept('GET', '**/device*', {
      body: {
        data: [{ id: '1', name: 'Device1', type: 'sensor', serialNumber: '123', status: 'ONLINE' }]
      }
    });

    cy.contains('Device Management').click();
    cy.contains('Device1').click();

    cy.url().should('include', '/device/123');
  });

  it('should handle devices with missing fields', () => {
    cy.intercept('GET', '**/device*', {
      body: {
        data: [{ id: '1', name: null, type: null, status: 'ONLINE', serialNumber: '1' }]
      }
    });

    cy.contains('Device Management').click();
    cy.get('[data-cy="device-table"]').should('exist');
  });

  it('should handle malformed device response', () => {
    cy.intercept('GET', '**/device*', {
      body: { wrong: 'format' }
    });

    cy.contains('Device Management').click();
    cy.get('[data-cy="device-table"]').should('exist'); 
  });

  it('should handle special characters in input', () => {
    cy.intercept('POST', '**/device', {
      body: { id: '1', name: '!!!@@@###', status: 'ONLINE', serialNumber: 'SN-1' }
    }).as('createDevice');

    cy.contains('Device Management').click();
    cy.get('[data-cy="add-device-btn"]').click();

    cy.get('[data-cy="device-name"]').type('!!!@@@###');
    cy.get('[data-cy="device-serial"]').type('@@@123');
    cy.get('[data-cy="device-type"]').type('sensor');

    cy.get('[data-cy="submit-device"]').click();

    cy.wait('@createDevice');
  });

  it('should clear filter and show all devices again', () => {
    const devices = [
      { id: '1', name: 'Sensor A', type: 'sensor', status: 'ONLINE', serialNumber: '1' },
      { id: '2', name: 'Gateway B', type: 'gateway', status: 'ONLINE', serialNumber: '2' }
    ];

    cy.intercept('GET', '**/device*', { body: { data: devices } });

    cy.contains('Device Management').click();

    cy.get('[data-cy="filter-type"]').click();
    cy.get('[data-cy="filter-option-sensor"]').click();

    cy.get('[data-cy="device-table"]').should('not.contain', 'Gateway B');

    cy.get('[data-cy="filter-option-sensor"]').click();

    cy.get('[data-cy="device-table"]').should('contain', 'Gateway B');
  });

  it('should handle deleting non-existent device gracefully', () => {
    cy.intercept('GET', '**/device*', {
      body: {
        data: [{ id: '1', name: 'Device1', type: 'sensor', serialNumber: '1', status: 'ONLINE' }]
      }
    });

    cy.intercept('DELETE', '**/device/1', {
      statusCode: 404,
      body: { message: 'Device not found' }
    }).as('delete404');

    cy.contains('Device Management').click();

    cy.on('window:confirm', () => true);

    cy.contains('td', 'Device1')
      .closest('tr')
      .find('button[title="Delete Device"]')
      .click();

    cy.wait('@delete404');
    cy.contains('Device not found').should('exist');
  });

  it('should delete device successfully and remove it from table', () => {
    cy.intercept('GET', '**/device', {
      body: {
        data: [
          { id: '1', name: 'Device1', type: 'sensor', serialNumber: '1', status: 'ONLINE' },
          { id: '2', name: 'Device2', type: 'gateway', serialNumber: '2', status: 'ONLINE' }
        ]
      }
    });

    cy.intercept('DELETE', '**/device/1', {
      statusCode: 200,
    }).as('deleteDevice');

    cy.contains('Device Management').click();

    cy.on('window:confirm', () => true); 

    cy.contains('td', 'Device1')
      .closest('tr')
      .find('button[title="Delete Device"]')
      .click();

    cy.wait('@deleteDevice');

    cy.get('[data-cy="device-table"]').should('not.contain', 'Device1');
    cy.get('[data-cy="device-table"]').should('contain', 'Device2');
  });
});

describe('Device Reassign & Misc Edge Cases', () => {
  beforeEach(() => {
    setupCommonIntercepts();
    cy.intercept('GET', '**/users/profile', { 
      body: { email: 'admin@gmail.com', role: 'ADMIN', isAdmin: true } 
    });
    cy.login('milica2@gmail.com', '123');
  });

  it.only('should transfe**ownership successfully', () => {
  cy.intercept('GET', '**/device*', {
    body: {
      data: [
        {
          id: '1',
          name: 'Device1',
          type: 'sensor',
          serialNumber: 'SN-1',
          status: 'ONLINE'
        }
      ]
    }
  });

  cy.contains('Device Management').click();

  cy.get('[data-cy="transfer-owner-1"]')
    .find('option')
    .should('have.length.greaterThan', 1);
});


  it('should disable submit button while creating device', () => {
    cy.intercept('POST', '**/device', {
      delay: 1000,
      body: { id: '1', name: 'Test Device', status: 'ONLINE', serialNumber: 'SN-1' }
    }).as('createDevice');

    cy.contains('Device Management').click();
    cy.get('[data-cy="add-device-btn"]').click();

    cy.get('[data-cy="device-name"]').type('Test');
    cy.get('[data-cy="device-serial"]').type('123');
    cy.get('[data-cy="device-type"]').type('sensor');

    cy.get('[data-cy="submit-device"]').click();
    cy.get('[data-cy="submit-device"]').should('be.disabled');

    cy.wait('@createDevice');
    cy.get('[data-cy="submit-device"]').should('not.be.disabled');
  });

  it('should not crash registration form when model-versions fetch fails', () => {
    cy.intercept('GET', '**/model-versions', { statusCode: 500, body: { message: 'Models unavailable' } }).as('modelsFail');

    cy.contains('Device Management').click();
    cy.get('[data-cy="add-device-btn"]').click();

    cy.wait('@modelsFail');
    cy.get('[data-cy="device-name"]').should('be.visible');
    cy.get('[data-cy="submit-device"]').should('exist');
  });

  it('should update device status in real time via websocket event', () => {
    cy.intercept('GET', '**/device*', {
      body: {
        data: [
          {
            id: '1',
            name: 'Device1',
            type: 'sensor',
            serialNumber: 'SN-1',
            status: 'OFFLINE'
          }
        ]
      }
    });

    cy.contains('Device Management').click();

    cy.get('[data-cy="device-status-1"]').should('contain', 'Offline');

    cy.window().then((win: any) => {
      win.triggerStatusUpdate('SN-1', 'ONLINE');
    });

    cy.get('[data-cy="device-status-1"]').should('contain', 'Online');
  });

  it('should redirect to login on 401 unauthorized while fetching devices', () => {
    cy.intercept('GET', '**/device*', {
      statusCode: 401,
      body: { message: 'Unauthorized' }
    }).as('unauthorized');

    cy.contains('Device Management').click();

    cy.wait('@unauthorized');

    cy.url().should('eq', 'http://localhost:5173/');
  });

  it('should redirect to login on 401 while fetching profile', () => {
    cy.intercept('GET', '**/users/profile', {
      statusCode: 401,
      body: { message: 'Unauthorized' }
    }).as('unauthorized');

    cy.login('milica2@gmail.com', '123');

    cy.wait('@unauthorized');

    cy.url().should('eq', 'http://localhost:5173/');
  });

  it('should redirect to login on 401 during device creation', () => {
    cy.intercept('GET', '**/device*', {
      body: { data: [] }
    });

    cy.intercept('POST', '**/device', {
      statusCode: 401,
      body: { message: 'Unauthorized' }
    }).as('unauthorized');

    cy.contains('Device Management').click();

    cy.get('[data-cy="add-device-btn"]').click();

    cy.get('[data-cy="device-name"]').type('Test');
    cy.get('[data-cy="device-serial"]').type('123');
    cy.get('[data-cy="device-type"]').type('sensor');

    cy.get('[data-cy="submit-device"]').click();

    cy.wait('@unauthorized');

    cy.url().should('eq', 'http://localhost:5173/');
  });

  it('should filter table via search input with matching results', () => {
    cy.intercept('GET', '**/device*', {
      body: { data: [{ id: '1', name: 'Sensor A', type: 'sensor', serialNumber: '1', status: 'ONLINE' }] }
    });
    cy.contains('Device Management').click();
    cy.get('[data-cy="device-search"]').type('Sensor A');
    cy.get('[data-cy="device-table"]').should('contain', 'Sensor A');
  });

  it('should stay logged in after page reload', () => {
    cy.contains('Device Management').click();
    cy.reload();
    cy.url().should('include', '/dashboard');
    cy.contains('Device Management').should('exist');
  });
});