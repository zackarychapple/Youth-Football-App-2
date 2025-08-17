// Puppeteer Configuration for Football Tracker E2E Tests
module.exports = {
  // Launch options for Puppeteer
  launch: {
    headless: process.env.HEADLESS !== 'false', // Set HEADLESS=false to see browser
    slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0, // Slow down actions
    devtools: process.env.DEVTOOLS === 'true', // Open devtools automatically
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--window-size=393,852', // iPhone 14 Pro size
      '--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
    ],
    defaultViewport: {
      width: 393,
      height: 852,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      isLandscape: false
    },
    timeout: 30000 // 30 seconds timeout for browser launch
  },

  // Test environment settings
  testEnvironment: {
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    testTimeout: process.env.TEST_TIMEOUT ? parseInt(process.env.TEST_TIMEOUT) : 60000, // 60 seconds default
    screenshotOnError: process.env.SCREENSHOT_ON_ERROR !== 'false',
    videoOnError: process.env.VIDEO_ON_ERROR === 'true',
    consoleLogCapture: true,
    networkLogCapture: true
  },

  // Test user credentials from requirements
  testUsers: {
    headCoach: {
      email: 'coach.test@footballtracker.app',
      password: 'GameDay2025!',
      team: 'Cobb Eagles (Test Team)',
      role: 'Head Coach'
    },
    assistantCoach: {
      email: 'assistant.test@footballtracker.app',
      password: 'Assistant2025!',
      team: 'Cobb Eagles (Test Team)',
      role: 'Assistant Coach'
    },
    secondaryCoach: {
      email: 'coach2.test@footballtracker.app',
      password: 'Falcons2025!',
      team: 'Cobb Falcons (Test Team 2)',
      role: 'Head Coach'
    }
  },

  // Test team configurations
  testTeams: {
    eagles: {
      name: 'Cobb Eagles',
      shareCode: 'EAGLES25',
      passcode: '1234',
      fieldSize: 80,
      mpr: 8,
      roster: {
        total: 22,
        striped: ['#7', '#15'],
        injured: ['#22']
      }
    },
    falcons: {
      name: 'Cobb Falcons',
      shareCode: 'FALCONS25',
      passcode: '5678',
      fieldSize: 40,
      mpr: 8,
      roster: {
        total: 15,
        striped: ['#3'],
        injured: []
      }
    }
  },

  // Network conditions for testing
  networkConditions: {
    '4G': {
      offline: false,
      downloadThroughput: 4 * 1024 * 1024 / 8, // 4 Mbps
      uploadThroughput: 3 * 1024 * 1024 / 8, // 3 Mbps
      latency: 20
    },
    '3G': {
      offline: false,
      downloadThroughput: 1.6 * 1024 * 1024 / 8, // 1.6 Mbps
      uploadThroughput: 768 * 1024 / 8, // 768 Kbps
      latency: 100
    },
    'offline': {
      offline: true,
      downloadThroughput: 0,
      uploadThroughput: 0,
      latency: 0
    }
  },

  // Paths for test artifacts
  paths: {
    screenshots: './test-results/screenshots',
    videos: './test-results/videos',
    logs: './test-results/logs',
    reports: './test-results/reports'
  },

  // Retry configuration
  retry: {
    times: process.env.RETRY_TIMES ? parseInt(process.env.RETRY_TIMES) : 2,
    delay: 1000 // 1 second between retries
  },

  // Console message patterns to monitor
  consolePatterns: {
    errors: [
      /error/i,
      /exception/i,
      /failed/i,
      /unauthorized/i,
      /forbidden/i,
      /supabase/i
    ],
    warnings: [
      /warning/i,
      /deprecated/i,
      /slow/i
    ],
    ignore: [
      /Download the React DevTools/,
      /redux-devtools/
    ]
  },

  // Network request patterns to monitor
  networkPatterns: {
    api: /supabase\.co|footballtracker\.app\/api/,
    auth: /auth|signin|signup|session/,
    static: /\.(js|css|png|jpg|svg|woff|woff2)/
  }
};