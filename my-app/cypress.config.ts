import { defineConfig } from "cypress";

export default defineConfig({
  allowCypressEnv: false,

  e2e: {
    setupNodeEvents(on) {
      on('task', {
        printPerformanceReport(report) {
          console.log('\nSystem UI performance');
          console.log(
            `Device: ${report.deviceId} | Command: ${report.command}`,
          );
          console.table({
            'Dashboard availability': {
              samples: 1,
              minimumMs: report.initialDashboardAvailabilityMs,
              averageMs: report.initialDashboardAvailabilityMs,
              medianMs: report.initialDashboardAvailabilityMs,
              p95Ms: report.initialDashboardAvailabilityMs,
              maximumMs: report.initialDashboardAvailabilityMs,
            },
            'UI to backend controller':
              report.uiCommandToBackendController,
          });
          return null;
        },
      });
    },
  },
});
