const APP_URL = 'http://localhost:5173';

const registeredModels = [
  {
    id: 'mv-1',
    modelId: 'modelA',
    version: '1.0.0',
  },
  {
    id: 'mv-2',
    modelId: 'modelB',
    version: '2.0.0',
  },
];

const schema = {
  type: 'object',
  properties: {
    schemaId: {
      type: 'string',
      const: 'modelC',
    },
    temperature: {
      type: 'number',
    },
  },
  required: ['schemaId', 'temperature'],
};

const mapping = {
  telemetry: {
    temperature: 'temperature',
  },
  dashboard: {
    sections: [],
  },
};

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
    body: registeredModels,
  }).as('getModelVersions');

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

  cy.visit(`${APP_URL}/dashboard`, {
    onBeforeLoad(win) {
      win.sessionStorage.setItem(
        'token',
        'fake-token',
      );

      win.sessionStorage.setItem(
        'userEmail',
        user.email,
      );
    },
  });

  cy.wait('@getProfile');

  cy.url().should('include', '/dashboard');
};

const openModelVersions = () => {
  cy.contains('Model Versions').click();

  cy.contains('Upload Model Version', {
    timeout: 10000,
  }).should('be.visible');
};

const selectModelFiles = () => {
  cy.get('input[type="file"]')
    .eq(0)
    .selectFile(
      {
        contents: Cypress.Buffer.from(
          JSON.stringify(schema),
        ),
        fileName: 'modelC.schema.json',
        mimeType: 'application/json',
      },
      { force: true },
    );

  cy.get('input[type="file"]')
    .eq(1)
    .selectFile(
      {
        contents: Cypress.Buffer.from(
          JSON.stringify(mapping),
        ),
        fileName: 'modelC.mapping.json',
        mimeType: 'application/json',
      },
      { force: true },
    );
};

describe('Model Version Management', () => {
  beforeEach(() => {
    setupSession('ADMIN');
    openModelVersions();
  });

  it('should display registered model versions', () => {
    cy.contains('Registered Model Versions')
      .scrollIntoView()
      .should('be.visible');

    cy.contains('modelA').should('be.visible');
    cy.contains('1.0.0').should('be.visible');

    cy.contains('modelB').should('be.visible');
    cy.contains('2.0.0').should('be.visible');
  });

  it('should detect model name from the selected schema', () => {
    cy.get('input[type="file"]')
      .eq(0)
      .selectFile(
        {
          contents: Cypress.Buffer.from(
            JSON.stringify(schema),
          ),
          fileName: 'modelC.schema.json',
          mimeType: 'application/json',
        },
        { force: true },
      );

    cy.get('input[placeholder="e.g. modelB"]').should(
      'have.value',
      'modelC',
    );
  });

  it('should upload a model version successfully', () => {
    cy.intercept('POST', '**/model-versions/upload', {
      statusCode: 201,
      body: {
        id: 'mv-3',
        modelId: 'modelC',
        version: '3.0.0',
      },
    }).as('uploadModelVersion');

    cy.intercept('GET', '**/model-versions', {
      statusCode: 200,
      body: [
        ...registeredModels,
        {
          id: 'mv-3',
          modelId: 'modelC',
          version: '3.0.0',
        },
      ],
    }).as('modelsAfterUpload');

    selectModelFiles();

    cy.get('input[placeholder="e.g. modelB"]').should(
      'have.value',
      'modelC',
    );

    cy.get('input[placeholder="e.g. 2.0.1"]').type(
      '3.0.0',
    );

    cy.contains('button', 'Upload').click();

    cy.wait('@uploadModelVersion').then(
      ({ request }) => {
        expect(
          request.headers['content-type'],
        ).to.include('multipart/form-data');

        expect(request.headers.authorization).to.equal(
          'Bearer fake-token',
        );
      },
    );

    cy.wait('@modelsAfterUpload');

    cy.contains(
      'Model version uploaded successfully!',
    )
      .scrollIntoView()
      .should('be.visible');

    cy.contains('modelC')
      .scrollIntoView()
      .should('be.visible');
    cy.contains('3.0.0').should('be.visible');

    cy.get('input[placeholder="e.g. modelB"]').should(
      'have.value',
      '',
    );

    cy.get('input[placeholder="e.g. 2.0.1"]').should(
      'have.value',
      '',
    );
  });

  it('should keep upload disabled until both files are selected', () => {
    cy.get('input[placeholder="e.g. modelB"]').type(
      'modelC',
    );

    cy.get('input[placeholder="e.g. 2.0.1"]').type(
      '3.0.0',
    );

    cy.contains('button', 'Upload').should('be.disabled');

    cy.get('input[type="file"]')
      .eq(0)
      .selectFile(
        {
          contents: Cypress.Buffer.from(
            JSON.stringify(schema),
          ),
          fileName: 'modelC.schema.json',
          mimeType: 'application/json',
        },
        { force: true },
      );

    cy.contains('button', 'Upload').should('be.disabled');

    cy.get('input[type="file"]')
      .eq(1)
      .selectFile(
        {
          contents: Cypress.Buffer.from(
            JSON.stringify(mapping),
          ),
          fileName: 'modelC.mapping.json',
          mimeType: 'application/json',
        },
        { force: true },
      );

    cy.contains('button', 'Upload').should(
      'not.be.disabled',
    );
  });

  it('should display an upload validation error', () => {
    cy.intercept('POST', '**/model-versions/upload', {
      statusCode: 400,
      body: {
        message: 'Invalid schema or mapping file',
      },
    }).as('uploadFailed');

    selectModelFiles();

    cy.get('input[placeholder="e.g. 2.0.1"]').type(
      'invalid-version',
    );

    cy.contains('button', 'Upload').click();

    cy.wait('@uploadFailed');

    cy.contains('Invalid schema or mapping file').should(
      'be.visible',
    );

    cy.get('input[placeholder="e.g. modelB"]').should(
      'have.value',
      'modelC',
    );
  });

  it('should refresh the registered model list', () => {
    cy.intercept('GET', '**/model-versions', {
      statusCode: 200,
      body: [
        ...registeredModels,
        {
          id: 'mv-4',
          modelId: 'modelD',
          version: '1.0.0',
        },
      ],
    }).as('refreshModels');

    cy.contains('button', 'Refresh').click();

    cy.wait('@refreshModels');

    cy.contains('modelD').should('be.visible');
  });
});

describe('Model Version Permissions', () => {
  it('should hide model version management from regular users', () => {
    setupSession('USER');

    cy.contains('Model Versions').should('not.exist');
    cy.contains('Upload Model Version').should('not.exist');
  });
});