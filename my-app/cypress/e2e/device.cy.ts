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
        serialNumber: 'ABC123'
      }
    }).as('createDevice');

    cy.contains('Device Management').click();
    cy.contains('+ REGISTER_DEVICE').click();
      
    cy.get('[data-cy="device-name"]').should('be.visible');

    cy.get('[data-cy="device-name"]').type('Test Device');
    cy.get('[data-cy="device-serial"]').type('ABC123');
    cy.get('[data-cy="device-type"]').type('sensor');

    cy.get('[data-cy="submit-device"]').click();

    cy.wait('@createDevice');


    cy.contains('created successfully').should('exist');
  });

it('should filter devices by type', () => {
  // 1. Zasebno definišemo da backend vraća uređaj sa tipom "sensor"
  cy.intercept('GET', '**/device*', {
    body: { data: [{ id: '1', name: 'Test', type: 'sensor' }] }
  }).as('getDevicesWithData');

  cy.contains('Device Management').click();

  // 2. Čekamo da se tabela popuni podacima
  cy.wait('@getDevicesWithData');

  // 3. Otvaramo filter
  cy.get('[data-cy="filter-type"]').click();

  // 4. Klik na opciju (ovo sada radi jer tip "sensor" postoji u podacima)
  cy.get('[data-cy="filter-option-sensor"]').click();

  // 5. Provera: da li tabela sada prikazuje samo taj uređaj?
  cy.get('[data-cy="device-table"]').should('contain', 'sensor');
});
it('should filter devices by type and update the table', () => {
  // 1. Pripremi mock podatke: jedan "sensor" i jedan "gateway"
  const devices = [
    { id: '1', name: 'Temp Sensor', type: 'sensor' },
    { id: '2', name: 'Main Gateway', type: 'gateway' }
  ];

  cy.intercept('GET', '**/device*', { body: { data: devices } }).as('getDevices');

  cy.contains('Device Management').click();
  cy.wait('@getDevices');

  // PROVERA 1: Uveri se da su oba uređaja tu pre filtriranja
  cy.get('[data-cy="device-table"]').should('contain', 'Temp Sensor');
  cy.get('[data-cy="device-table"]').should('contain', 'Main Gateway');

  // 2. Akcija: Filtriraj samo po tipu "sensor"
  cy.get('[data-cy="filter-type"]').click();
  cy.get('[data-cy="filter-option-sensor"]').click();

  // 3. PROVERA 2: Uveri se da je "gateway" nestao, a "sensor" ostao
  cy.get('[data-cy="device-table"]').should('contain', 'Temp Sensor');
  cy.get('[data-cy="device-table"]').should('not.contain', 'Main Gateway');
});

});

describe('User Device Flow', () => {
  beforeEach(() => {
    setupCommonIntercepts();
    cy.intercept('GET', '**/users/profile', { 
      body: { email: 'user@gmail.com', role: 'USER', isAdmin: false } 
    });
    
    cy.login('user@gmail.com', '123');
    cy.url().should('include', '/dashboard'); // Osigurač
  });

  it('should NOT show delete button for regular users', () => {
    cy.contains('Device Management').click();
    cy.get('[data-cy="device-table"]', { timeout: 10000 }).should('exist');
    cy.get('[data-cy="device-table"]').should('not.contain', 'Actions');
  });
});