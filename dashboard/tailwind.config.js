/** NOC design tokens — Cross-Broker Hedge Control Center */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#04070B',        // ground
        panel: '#0A121A',       // card surface
        panelHi: '#0E1926',     // raised surface / table head
        line: '#17242F',        // hairline
        ink: '#C7D7E5',         // primary text
        inkMute: '#5F7488',     // labels, axis
        stable: '#2EE6A8',      // link OK / hedge synced
        flow: '#38BDF8',        // data flow, neutral telemetry
        warn: '#F5A524',        // drift, lot mismatch
        critical: '#FF4D6D',    // breach, API down
        core: '#8B7CF6',        // hedge engine identity
      },
      fontFamily: {
        label: ['"IBM Plex Sans Condensed"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        node: '0 0 0 1px rgba(56,189,248,.18), 0 0 32px -8px rgba(56,189,248,.35)',
        panel: '0 1px 0 0 rgba(255,255,255,.03) inset, 0 18px 40px -30px #000',
      },
    },
  },
  plugins: [],
}
