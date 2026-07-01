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
  it('should show error message on invalid credentials', () => {
    cy.intercept('POST', '**/users/login', {
      statusCode: 401,
      body: { message: 'Invalid credentials' }
    }).as('loginFail');

    cy.visit('http://localhost:5173');
    cy.get('input[type="email"]').type('wrong@gmail.com');
    cy.get('input[type="password"]').type('wrongpass');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginFail');
    cy.contains('Invalid credentials').should('exist'); 
    cy.url().should('not.include', '/dashboard');
  });
  it('should show error when fields are empty', () => {
    cy.visit('http://localhost:5173');

    
    cy.get('form').invoke('attr', 'novalidate', 'true');


    cy.get('button[type="submit"]').click();

    cy.contains('Email and password are required!', { timeout: 5000 })
      .should('be.visible'); 
  });
  it('should handle network error on login', () => {
    cy.intercept('POST', '**/users/login', { forceNetworkError: true }).as('loginNetworkError');
    cy.visit('http://localhost:5173');
    cy.get('input[type="email"]').type('milica2@gmail.com');
    cy.get('input[type="password"]').type('123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginNetworkError');
    cy.url().should('not.include', '/dashboard');
  });
  it('should redirect to dashboard if already logged in', () => {
    cy.window().then((win) => {
      win.sessionStorage.setItem('token', 'fake-token');
    });
      cy.intercept('GET', '**/users/profile', { body: { email: 'milica2@gmail.com', role: 'ADMIN' } });
      cy.intercept('GET', '**/device', { statusCode: 200, body: [] }).as('getDevices');
      cy.intercept('GET', '**/model-versions', { statusCode: 200, body: [] }).as('getModelVersions');
      cy.intercept('GET', '**/post/feed', { statusCode: 200, body: [] }).as('getFeed');
      cy.intercept('GET', '**/device', { statusCode: 200, body: { data: [] }}).as('getDevices');
      cy.intercept('GET', '**/users/allusers', { statusCode: 200, body: [] }).as('getUsers');
      cy.intercept('GET', '**/post/drafts', { statusCode: 200, body: [] }).as('getDrafts');
      cy.intercept('GET', '**/post/feed', { statusCode: 200, body: [] }).as('getFeed');
    
    cy.visit('http://localhost:5173');
    cy.url().should('include', '/dashboard');
  });


  it('should redirect to login when accessing /dashboard without auth', () => {
    cy.visit('http://localhost:5173/dashboard');
    cy.url().should('eq', 'http://localhost:5173/');
  });

 it('should register a new user successfully', () => {
  cy.intercept('POST', '**/users/user', {  
    statusCode: 201,
    body: { name: 'Test User', email: 'test@gmail.com' }
  }).as('register');

  cy.visit('http://localhost:5173');

  cy.contains(/register/i).click();
  cy.get('input[placeholder="Name"]').type('Test User');
  cy.get('input[placeholder="Email"]').type('test@gmail.com');
  cy.get('input[placeholder="Password"]').type('pass123');
  cy.get('button[type="submit"]').click();

  cy.wait('@register');
  cy.contains('Registration successful').should('exist');
});

it('should show error on registration failure', () => {
  cy.intercept('POST', '**/users/user', {
    statusCode: 400,
    body: { message: 'Email already in use' }
  }).as('registerFail');

  cy.visit('http://localhost:5173');
  cy.contains(/register/i).click();

  cy.get('input[placeholder="Name"]').type('Test User');
  cy.get('input[placeholder="Email"]').type('duplicate@gmail.com');
  cy.get('input[placeholder="Password"]').type('pass123');
  cy.get('button[type="submit"]').click();

  cy.wait('@registerFail');
  cy.contains('Email already in use').should('exist');
});

});

describe('Logout Flow', () => {
  beforeEach(() => {
    setupCommonIntercepts();
    cy.intercept('GET', '**/users/profile', { 
      body: { email: 'milica2@gmail.com', role: 'ADMIN', isAdmin: true } 
    });
    cy.login('milica2@gmail.com', '123');
    cy.url().should('include', '/dashboard');
  });

  it('should logout successfully and clear session', () => {
    cy.contains(/logout/i).click();

    cy.url().should('eq', 'http://localhost:5173/');
    cy.window().its('sessionStorage').invoke('getItem', 'token').should('be.null');
  });

  it('should not allow accessing dashboard after logout via browser back button', () => {
    cy.contains(/logout/i).click();
    cy.url().should('eq', 'http://localhost:5173/');

    cy.go('back');

    cy.url().should('eq', 'http://localhost:5173/');
  });

  it('should clear user profile and users list after logout', () => {
    cy.contains(/logout/i).click();

    cy.url().should('eq', 'http://localhost:5173/');

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem('userEmail')).to.be.null;
    });
  });

  it('should show login form after logout', () => {
    cy.contains(/logout/i).click();

    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
  });
});
describe('User Management', () => {
  beforeEach(() => {
    setupCommonIntercepts();

    cy.intercept('GET', '**/users/profile', {
      body: { email: 'milica2@gmail.com', role: 'ADMIN', isAdmin: true }
    });
    cy.login('milica2@gmail.com', '123');
    cy.url().should('include', '/dashboard');
  });

  it('should approve a pending user', () => {
    setupCommonIntercepts();
    cy.intercept('GET', '**/users/allusers', {
    body: [{ id: '2', name: 'Pending User', email: 'p@gmail.com', status: 'PENDING' }]}).as('getUsers');
    cy.intercept('GET', '**/users/allusers', {
    body: [{ id: '2', name: 'Pending User', email: 'p@gmail.com', status: 'PENDING' }]
    }).as('getUsers');
   cy.intercept('PATCH', '**/users/approval/2', { statusCode: 200 }).as('approve');

    cy.contains('Users').click();  
    cy.contains('Pending User').should('exist');

    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(true);
    });

    cy.get('[data-cy="approve-user-2"]').click()
    cy.wait('@approve');
    cy.contains('approved').should('exist');
  });
});