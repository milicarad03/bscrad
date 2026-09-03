const APP_URL = 'http://localhost:5173';

type Role = 'ADMIN' | 'USER';

const mockApplicationBootstrap = (
  role: Role = 'ADMIN',
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
    body: [],
  });

  cy.intercept({ method: 'GET', pathname: '/device' }, {
    statusCode: 200,
    body: { data: [] },
  });

  cy.intercept('GET', '**/users/allusers', {
    statusCode: 200,
    body: [],
  });

  cy.intercept('GET', '**/post/feed', {
    statusCode: 200,
    body: [],
  });

  cy.intercept('GET', '**/post/drafts', {
    statusCode: 200,
    body: [],
  });

  return user;
};

const mockSuccessfulLogin = (
  role: Role = 'ADMIN',
) => {
  const user = mockApplicationBootstrap(role);

  cy.intercept('POST', '**/users/login', {
    statusCode: 200,
    body: {
      accessToken: 'fake-token',
      user,
    },
  }).as('loginRequest');

  return user;
};

const fillLoginForm = (
  email = 'milica2@gmail.com',
  password = '123',
) => {
  cy.get('input[type="email"]').clear().type(email);
  cy.get('input[type="password"]').clear().type(password);
  cy.get('button[type="submit"]').click();
};

describe('Authentication Flow', () => {
  it('should log in successfully', () => {
    mockSuccessfulLogin();

    cy.visit(APP_URL);
    fillLoginForm();

    cy.wait('@loginRequest')
      .its('request.body')
      .should('deep.equal', {
        email: 'milica2@gmail.com',
        password: '123',
      });

    cy.url().should('include', '/dashboard');

    cy.window().then((win) => {
      expect(
        win.sessionStorage.getItem('token'),
      ).to.equal('fake-token');
    });
  });

  it('should show an error for invalid credentials', () => {
    cy.intercept('POST', '**/users/login', {
      statusCode: 401,
      body: {
        message: 'Invalid email or password',
      },
    }).as('loginFailed');

    cy.visit(APP_URL);
    fillLoginForm('wrong@example.com', 'wrong-password');

    cy.wait('@loginFailed');

    cy.contains('Invalid email or password').should(
      'be.visible',
    );

    cy.url().should('eq', `${APP_URL}/`);
  });

  it('should prevent login when fields are empty', () => {
    cy.intercept('POST', '**/users/login').as(
      'loginRequest',
    );

    cy.visit(APP_URL);

    cy.get('form').invoke(
      'attr',
      'novalidate',
      'novalidate',
    );

    cy.get('button[type="submit"]').click();

    cy.contains('Email and password are required!').should(
      'be.visible',
    );

    cy.get('@loginRequest.all').should('have.length', 0);
  });

  it('should handle a login network error', () => {
    cy.intercept('POST', '**/users/login', {
      forceNetworkError: true,
    }).as('loginNetworkError');

    cy.visit(APP_URL);
    fillLoginForm();

    cy.wait('@loginNetworkError');

    cy.contains(/network|failed|error/i).should('be.visible');
  });

  it('should show an error for a pending account', () => {
    cy.intercept('POST', '**/users/login', {
      statusCode: 403,
      body: {
        message:
          'Your account is waiting for administrator approval',
      },
    }).as('pendingLogin');

    cy.visit(APP_URL);
    fillLoginForm('pending@example.com', '123');

    cy.wait('@pendingLogin');

    cy.contains(
      'Your account is waiting for administrator approval',
    ).should('be.visible');
  });

  it('should show an error for a rejected account', () => {
    cy.intercept('POST', '**/users/login', {
      statusCode: 403,
      body: {
        message: 'Your account has been rejected',
      },
    }).as('rejectedLogin');

    cy.visit(APP_URL);
    fillLoginForm('rejected@example.com', '123');

    cy.wait('@rejectedLogin');

    cy.contains('Your account has been rejected').should(
      'be.visible',
    );
  });

  it('should redirect an authenticated user to dashboard', () => {
    mockApplicationBootstrap();

    cy.visit(APP_URL, {
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

    cy.url().should('include', '/dashboard');
  });

  it('should redirect unauthenticated dashboard access to login', () => {
    cy.visit(`${APP_URL}/dashboard`);

    cy.url().should('eq', `${APP_URL}/`);

    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
  });
});

describe('Registration Flow', () => {
  beforeEach(() => {
    cy.visit(APP_URL);
    cy.contains('button', 'Register').click();
  });

  it('should register a new user successfully', () => {
    cy.intercept('POST', '**/users/user', {
      statusCode: 201,
      body: {
        id: 3,
        name: 'Test User',
        email: 'test@example.com',
        status: 'PENDING',
      },
    }).as('registerRequest');

    cy.get('input[placeholder="Name"]').type('Test User');
    cy.get('input[placeholder="Email"]').type(
      'test@example.com',
    );
    cy.get('input[placeholder="Password"]').type('123456');

    cy.get('button[type="submit"]').click();

    cy.wait('@registerRequest')
      .its('request.body')
      .should('deep.equal', {
        name: 'Test User',
        email: 'test@example.com',
        password: '123456',
      });

    cy.contains(/registered|approval|success/i).should(
      'be.visible',
    );
  });

  it('should display a registration server error', () => {
    cy.intercept('POST', '**/users/user', {
      statusCode: 409,
      body: {
        message: 'Email already exists',
      },
    }).as('registerFailed');

    cy.get('input[placeholder="Name"]').type('Test User');
    cy.get('input[placeholder="Email"]').type(
      'existing@example.com',
    );
    cy.get('input[placeholder="Password"]').type('123456');

    cy.get('button[type="submit"]').click();

    cy.wait('@registerFailed');

    cy.contains('Email already exists').should('be.visible');
  });
});

describe('Logout Flow', () => {
  beforeEach(() => {
    mockSuccessfulLogin();

    cy.visit(APP_URL);
    fillLoginForm();

    cy.wait('@loginRequest');
    cy.url().should('include', '/dashboard');
  });

  it('should log out and clear the session', () => {
    cy.contains('button', /log out|logout/i).click();

    cy.url().should('eq', `${APP_URL}/`);

    cy.window().then((win) => {
      expect(
        win.sessionStorage.getItem('token'),
      ).to.be.null;

      expect(
        win.sessionStorage.getItem('userEmail'),
      ).to.be.null;
    });

    cy.get('input[type="email"]').should('be.visible');
  });

  it('should not restore dashboard using browser back after logout', () => {
    cy.contains('button', /log out|logout/i).click();

    cy.url().should('eq', `${APP_URL}/`);

    cy.go('back');

    cy.url().should('eq', `${APP_URL}/`);
    cy.get('input[type="email"]').should('be.visible');
  });
});
