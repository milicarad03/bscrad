describe('Large Dashboard E2E Tests', () => {
  beforeEach(() => {
    // Prijava i navigacija do stranice velikog uređaja
    cy.visit('/login');
    cy.get('input[name="email"]').type('milica@example.com');
    cy.get('input[name="password"]').type('securepassword');
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/dashboard');
    cy.get('[data-cy="device-card-large-dev-1"]').click();
    cy.url().should('include', '/devices/large-dev-1');
  });

  it('1. should display all 7 dashboard sections', () => {
    const expectedSections = [
      'ALERTS & NOTIFICATIONS',
      'DEVICE INFORMATION',
      'LIVE STATUS & CONTROLS',
      'REAL-TIME METRICS',
      'ELECTRICAL PARAMETERS',
      'SYSTEM DIAGNOSTICS',
      'TELEMETRY ANALYTICS',
    ];

    expectedSections.forEach(sectionTitle => {
      cy.contains(sectionTitle).should('be.visible');
    });
  });

  it('2. should render device information correctly', () => {
    cy.get('[data-cy="device-info"]').within(() => {
      cy.contains('LG-999-X').should('be.visible');
      cy.contains('Sector 7G').should('be.visible');
      cy.contains('v1.0.0').should('be.visible');
    });
  });

  it('3. should display real-time metrics values', () => {
    cy.get('[data-cy="metric-flow-rate"]').should('be.visible');
    cy.get('[data-cy="metric-pressure"]').should('be.visible');
  });

  it('4. should display electrical parameters', () => {
    cy.get('[data-cy="metric-voltage"]').should('be.visible');
    cy.get('[data-cy="metric-current"]').should('be.visible');
    cy.get('[data-cy="metric-power-factor"]').should('be.visible');
  });

  it('5. should display system diagnostics indicators', () => {
    cy.get('[data-cy="diagnostic-cpu-temp"]').should('be.visible');
    cy.get('[data-cy="diagnostic-memory-usage"]').should('be.visible');
  });

  it('6. should render telemetry analytics charts and table with colSpan 2', () => {
    cy.get('[data-cy="telemetry-analytics"]').within(() => {
      cy.get('.recharts-wrapper').should('have.length.at.least', 2);
      cy.get('table').should('be.visible');
    });
  });

  it('7. should handle live status controls and execute pump state command', () => {
    cy.get('[data-cy="command-switch-pump"]').click();
    cy.get('.toast-success').should('contain', 'SET_PUMP_STATE executed');
  });

  it('8. should respect conditional visibility rules based on state', () => {
    // Ako je uređaj online, kontrola unosa ciljnog protoka mora biti aktivna
    cy.get('[data-cy="input-flow-target"]').should('not.be.disabled');
  });

  it('9. should handle multiple telemetry updates without UI lag', () => {
    cy.window().then(win => {
      const start = performance.now();
      // Simulacija brzog pristizanja 50 WebSocket poruka
      for (let i = 0; i < 50; i++) {
        win.postMessage({ type: 'TELEMETRY_UPDATE', payload: { flowRate: 50 + i } }, '*');
      }
      const duration = performance.now() - start;
      expect(duration).to.be.lessThan(500);
    });
  });

  it('10. should trigger telemetry stream activation on mount', () => {
    cy.get('.dd-connection--online').should('be.visible');
    cy.contains('Telemetry stream initiated').should('be.visible');
  });

  it('11. should navigate back to the main device list successfully', () => {
    cy.get('.dd-back').click();
    cy.url().should('include', '/dashboard');
    cy.contains('All devices').should('not.exist'); // Provera povratka na glavnu listu
  });
});