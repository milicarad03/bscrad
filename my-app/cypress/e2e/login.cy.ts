describe('Auth Flow', () => {
  it('should login successfully', () => {
  
    cy.intercept('POST', '**/users/login', {
      statusCode: 200,
      body: { accessToken: 'fake-token', user: { email: 'milica2@gmail.com' } }
    }).as('loginRequest');

   
    cy.intercept('GET', '**/post/drafts', { statusCode: 200, body: [] }).as('getDrafts');

cy.intercept('GET', '**/users/profile', { 
  statusCode: 200, 
  body: { 
    email: 'milica2@gmail.com',
    role: 'ADMIN', 
    isAdmin: true  
  } 
}).as('getProfile');
    cy.intercept('GET', '**/device', { statusCode: 200, body: [] }).as('getDevices');
    cy.intercept('GET', '**/model-versions', { statusCode: 200, body: [] }).as('getModelVersions');
    cy.intercept('GET', '**/post/feed', { statusCode: 200, body: [] }).as('getFeed');
    cy.intercept('GET', '**/device', { statusCode: 200, body: { data: [] }}).as('getDevices');
    cy.intercept('GET', '**/users/allusers', { statusCode: 200, body: [] }).as('getUsers');
    cy.intercept('GET', '**/post/drafts', { statusCode: 200, body: [] }).as('getDrafts');
    cy.intercept('GET', '**/post/feed', { statusCode: 200, body: [] }).as('getFeed');

    cy.visit('http://localhost:5173');

    cy.get('input[type="email"]').type('milica2@gmail.com');
    cy.get('input[type="password"]').type('123');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.url().should('include', '/dashboard')
    cy.window().its('sessionStorage.token').should('exist');

  });

});