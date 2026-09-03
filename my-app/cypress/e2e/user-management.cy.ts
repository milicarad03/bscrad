const APP_URL = 'http://localhost:5173';

const users = [
  {
    id: 2,
    name: 'Pending User',
    email: 'pending@example.com',
    role: 'USER',
    status: 'PENDING',
  },
  {
    id: 3,
    name: 'Approved User',
    email: 'approved@example.com',
    role: 'USER',
    status: 'APPROVED',
  },
];

const setupSession = (
  role: 'ADMIN' | 'USER' = 'ADMIN',
) => {
  const currentUser = {
    id: role === 'ADMIN' ? 1 : 4,
    name: role === 'ADMIN' ? 'Admin User' : 'Regular User',
    email:
      role === 'ADMIN'
        ? 'admin@example.com'
        : 'user@example.com',
    role,
    isAdmin: role === 'ADMIN',
    status: 'APPROVED',
  };

  cy.intercept('GET', '**/users/profile', {
    statusCode: 200,
    body: currentUser,
  }).as('getProfile');

  cy.intercept('GET', '**/users/allusers', {
    statusCode: 200,
    body: users,
  }).as('getUsers');

  cy.intercept('GET', '**/model-versions', {
    statusCode: 200,
    body: [],
  });

  cy.intercept({ method: 'GET', pathname: '/device' }, {
    statusCode: 200,
    body: { data: [] },
  });

  cy.intercept('GET', '**/post/feed', {
    statusCode: 200,
    body: [],
  });

  cy.intercept('GET', '**/post/drafts', {
    statusCode: 200,
    body: [],
  });

  cy.visit(`${APP_URL}/dashboard`, {
    onBeforeLoad(win) {
      win.sessionStorage.setItem('token', 'fake-token');
      win.sessionStorage.setItem(
        'userEmail',
        currentUser.email,
      );
    },
  });

  cy.wait('@getProfile');

  if (role === 'ADMIN') {
    cy.wait('@getUsers');
  }

  cy.url().should('include', '/dashboard');
};

const openUserManagement = () => {
  cy.contains('button', 'Users').click();

  cy.contains('User Management', {
    timeout: 10000,
  }).should('be.visible');
};

const getUserRow = (email: string) =>
  cy.contains('span', email).parent().parent();

describe('Admin User Management', () => {
  beforeEach(() => {
    setupSession('ADMIN');
    openUserManagement();
  });

  it('should display registered users and their statuses', () => {
    getUserRow('pending@example.com').should(
      'contain',
      'PENDING',
    );

    getUserRow('approved@example.com').should(
      'contain',
      'APPROVED',
    );
  });

  it('should approve a pending user', () => {
    cy.intercept('PATCH', '**/users/approval/2', {
      statusCode: 200,
      body: {},
    }).as('approveUser');

    cy.on('window:confirm', () => true);

    cy.get('[data-cy="approve-user-2"]').click();

    cy.wait('@approveUser')
      .its('request.body')
      .should('deep.equal', {
        status: 'APPROVED',
      });

    getUserRow('pending@example.com').should(
      'contain',
      'APPROVED',
    );

    cy.contains('User approved').should('be.visible');
  });

  it('should not approve a user when confirmation is cancelled', () => {
    cy.intercept('PATCH', '**/users/approval/2', {
      statusCode: 200,
      body: {},
    }).as('approveUser');

    cy.on('window:confirm', () => false);

    cy.get('[data-cy="approve-user-2"]').click();

    cy.get('@approveUser.all').should('have.length', 0);

    getUserRow('pending@example.com').should(
      'contain',
      'PENDING',
    );
  });

  it('should reject and remove a pending user', () => {
    cy.intercept('PATCH', '**/users/approval/2', {
      statusCode: 200,
      body: {},
    }).as('rejectUser');

    cy.intercept('DELETE', '**/users/user/2', {
      statusCode: 200,
      body: {},
    }).as('deleteRejectedUser');

    cy.on('window:confirm', () => true);

    cy.get('[data-cy="decline-user-2"]').click();

    cy.wait('@rejectUser')
      .its('request.body')
      .should('deep.equal', {
        status: 'REJECTED',
      });

    cy.wait('@deleteRejectedUser');

    cy.contains('pending@example.com').should('not.exist');
    cy.contains('User rejected').should('be.visible');
  });

  it('should delete an approved user', () => {
    cy.intercept('DELETE', '**/users/user/3', {
      statusCode: 200,
      body: {},
    }).as('deleteUser');

    cy.on('window:confirm', () => true);

    getUserRow('approved@example.com')
      .find('button[title="Obriši"]')
      .click();

    cy.wait('@deleteUser');

    cy.contains('approved@example.com').should('not.exist');
    cy.contains('User deleted').should('be.visible');
  });

  it('should keep a user when deletion is cancelled', () => {
    cy.intercept('DELETE', '**/users/user/3', {
      statusCode: 200,
      body: {},
    }).as('deleteUser');

    cy.on('window:confirm', () => false);

    getUserRow('approved@example.com')
      .find('button[title="Obriši"]')
      .click();

    cy.get('@deleteUser.all').should('have.length', 0);
    cy.contains('approved@example.com').should('exist');
  });

  it('should display an error when approval fails', () => {
    cy.intercept('PATCH', '**/users/approval/2', {
      statusCode: 500,
      body: {
        message: 'Approval failed',
      },
    }).as('approveFailed');

    cy.on('window:confirm', () => true);

    cy.get('[data-cy="approve-user-2"]').click();

    cy.wait('@approveFailed');

    cy.contains('Approval failed').should('be.visible');

    getUserRow('pending@example.com').should(
      'contain',
      'PENDING',
    );
  });

  it('should refresh the user list', () => {
    cy.intercept('GET', '**/users/allusers', {
      statusCode: 200,
      body: [
        ...users,
        {
          id: 5,
          name: 'New User',
          email: 'new@example.com',
          role: 'USER',
          status: 'PENDING',
        },
      ],
    }).as('refreshUsers');

    cy.get('button[title="Osveži listu"]').click();

    cy.wait('@refreshUsers');

    cy.contains('new@example.com').should('be.visible');
  });
});

describe('Regular User Permissions', () => {
  it('should hide user management from regular users', () => {
    setupSession('USER');

    cy.contains('button', 'Users').should('not.exist');
    cy.contains('User Management').should('not.exist');
  });
});
