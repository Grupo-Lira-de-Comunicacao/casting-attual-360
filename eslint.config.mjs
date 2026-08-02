import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,
  {
    files: [
      'src/components/admin/integration-events-dashboard.tsx',
      'src/components/admin/integration-metrics-dashboard.tsx',
    ],
    rules: {
      // Débito legado: estes dashboards carregam dados via effect e serão refatorados
      // separadamente. A exceção fica restrita a eles para não enfraquecer o restante do app.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'next-env.d.ts']),
]);
