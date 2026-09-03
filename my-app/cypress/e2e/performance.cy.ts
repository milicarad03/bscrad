let APP_URL = 'http://localhost:5173';
let DEVICE_ID = 'sp-100';
let CONTROL_TITLE = 'Pump Power';
let COMMAND = 'SET_PUMP_STATE';
let TOKEN = '';
let USER_EMAIL = 'performance@example.com';
let SAMPLE_COUNT = 20;

type PerformanceEnvironment = {
  PERFORMANCE_APP_URL?: string;
  PERFORMANCE_DEVICE_ID?: string;
  PERFORMANCE_CONTROL_TITLE?: string;
  PERFORMANCE_COMMAND?: string;
  PERFORMANCE_TOKEN?: string;
  PERFORMANCE_USER_EMAIL?: string;
  PERFORMANCE_SAMPLES?: number | string;
};

type CommandPerformance = {
  clientStartedAt: number;
  serverReceivedAt: number;
  uiToServerMs: number;
};

const calculateStatistics = (values: number[]) => {
  const sorted = [...values].sort(
    (left, right) => left - right,
  );
  const total = sorted.reduce(
    (sum, value) => sum + value,
    0,
  );
  const middle = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
  const p95Index = Math.max(
    0,
    Math.ceil(sorted.length * 0.95) - 1,
  );
  const round = (value: number) =>
    Number(value.toFixed(4));

  return {
    samples: sorted.length,
    minimumMs: round(sorted[0]),
    maximumMs: round(sorted[sorted.length - 1]),
    averageMs: round(total / sorted.length),
    medianMs: round(median),
    p95Ms: round(sorted[p95Index]),
  };
};

describe('System performance measurements', () => {
  before(() => {
    cy.env<PerformanceEnvironment>([
      'PERFORMANCE_APP_URL',
      'PERFORMANCE_DEVICE_ID',
      'PERFORMANCE_CONTROL_TITLE',
      'PERFORMANCE_COMMAND',
      'PERFORMANCE_TOKEN',
      'PERFORMANCE_USER_EMAIL',
      'PERFORMANCE_SAMPLES',
    ]).then((environment) => {
      APP_URL =
        environment.PERFORMANCE_APP_URL ?? APP_URL;
      DEVICE_ID =
        environment.PERFORMANCE_DEVICE_ID ?? DEVICE_ID;
      CONTROL_TITLE =
        environment.PERFORMANCE_CONTROL_TITLE ?? CONTROL_TITLE;
      COMMAND =
        environment.PERFORMANCE_COMMAND ?? COMMAND;
      TOKEN = String(environment.PERFORMANCE_TOKEN ?? '');
      USER_EMAIL = String(
        environment.PERFORMANCE_USER_EMAIL ?? USER_EMAIL,
      );
      SAMPLE_COUNT = Number(
        environment.PERFORMANCE_SAMPLES ?? SAMPLE_COUNT,
      );

      if (!TOKEN) {
        throw new Error(
          'Set CYPRESS_PERFORMANCE_TOKEN to a valid JWT before running this measurement.',
        );
      }

      if (!Number.isInteger(SAMPLE_COUNT) || SAMPLE_COUNT < 1) {
        throw new Error(
          'CYPRESS_PERFORMANCE_SAMPLES must be a positive integer.',
        );
      }
    });
  });

  it('measures dashboard availability and UI command arrival at the backend', () => {
    const commandDurations: number[] = [];
    let initialDashboardDuration = 0;

    cy.intercept(
      'POST',
      `**/device/${DEVICE_ID}/command`,
      (request) => {
        if (request.body?.command === COMMAND) {
          request.alias = 'performanceCommand';
        }
      },
    );

    cy.visit(`${APP_URL}/device/${DEVICE_ID}`, {
      onBeforeLoad(win) {
        win.sessionStorage.setItem('token', TOKEN);
        win.sessionStorage.setItem('userEmail', USER_EMAIL);
        win.performance.mark(
          'performance-dashboard-navigation-start',
        );
      },
    });

    cy.get('.dashboard-container', {
      timeout: 20_000,
    }).should('be.visible');

    cy.window().then((win) => {
      const navigationEntries = win.performance.getEntriesByName(
        'performance-dashboard-navigation-start',
      );
      const navigationStart =
        navigationEntries[navigationEntries.length - 1];

      expect(navigationStart).to.exist;
      initialDashboardDuration =
        win.performance.now() - navigationStart!.startTime;
      expect(initialDashboardDuration).to.be.greaterThan(0);
    });

    for (let index = 0; index < SAMPLE_COUNT; index += 1) {
      cy.contains('.dashboard-card', CONTROL_TITLE)
        .find('button')
        .should('be.enabled')
        .click();

      cy.wait('@performanceCommand', {
        timeout: 15_000,
      }).then((interception) => {
        const requestStartedAt = Number(
          interception.request.headers[
            'x-ui-command-started-at'
          ],
        );
        const timing = interception.response?.body
          ?.performance as CommandPerformance | undefined;

        expect(requestStartedAt).to.be.greaterThan(0);
        expect(interception.response?.statusCode).to.be.within(
          200,
          299,
        );
        expect(timing).to.exist;
        expect(timing!.clientStartedAt).to.equal(
          requestStartedAt,
        );
        expect(timing!.serverReceivedAt).to.be.at.least(
          timing!.clientStartedAt,
        );
        expect(timing!.uiToServerMs).to.be.at.least(0);

        commandDurations.push(timing!.uiToServerMs);
      });
    }

    cy.then(() => {
      const report = {
        generatedAt: new Date().toISOString(),
        deviceId: DEVICE_ID,
        command: COMMAND,
        initialDashboardAvailabilityMs: Number(
          initialDashboardDuration.toFixed(4),
        ),
        uiCommandToBackendController: calculateStatistics(
          commandDurations,
        ),
      };

      cy.writeFile(
        'performance-results/system-performance.json',
        report,
      );
      cy.task('printPerformanceReport', report);
      cy.log(
        'Performance report saved to performance-results/system-performance.json',
      );
    });
  });
});
